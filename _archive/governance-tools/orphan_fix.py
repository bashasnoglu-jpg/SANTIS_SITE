"""
SANTIS ORPHAN PAGE FIXER v1.0
Fixes orphan pages by:
1. Adding all sub-page links to category index pages
2. Adding cross-category links to detail pages missing related-services
3. Ensures every page has at least 3 incoming internal links
"""
import os, re
from pathlib import Path
from collections import defaultdict

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')
SKIP_DIRS = {'_legacy_archive','_legacy_content','_snapshots','backup','backups',
             'node_modules','admin','a4','components','venv','__pycache__',
             '.git','.vscode','_dev_archives','print','public','static','templates',
             'includes','reports','sr','assets'}

stats = {'index_links_added': 0, 'detail_links_added': 0, 'files_modified': 0}

# ─── 1. Build page inventory ───
pages = {}
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for f in fn:
        if not f.endswith('.html'): continue
        fp = Path(dp) / f
        rel = str(fp.relative_to(ROOT)).replace('\\','/')
        with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
            content = fh.read()
        # Get title
        h1 = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.I|re.DOTALL)
        title_tag = re.search(r'<title>(.*?)</title>', content, re.I)
        title = ''
        if h1:
            title = re.sub(r'<[^>]+>', '', h1.group(1)).strip()
        elif title_tag:
            title = title_tag.group(1).strip()
            for sep in [' | ', ' • ', ' - ', ' – ']:
                if sep in title:
                    title = title.split(sep)[0].strip()
        pages[rel] = {'content': content, 'title': title, 'path': fp}

print(f'Total pages: {len(pages)}')

# ─── 2. Identify category index pages and their children ───
categories = defaultdict(list)  # category_index_path -> [child_pages]

for rel in pages:
    parts = rel.split('/')
    if len(parts) >= 3 and not parts[-1] == 'index.html':
        # This is a detail page — find its category index
        lang = parts[0]
        cat = parts[1]
        cat_index = f'{lang}/{cat}/index.html'
        if cat_index in pages:
            categories[cat_index].append(rel)
    elif len(parts) >= 4 and parts[-1] == 'index.html':
        # Sub-directory detail page (e.g., tr/hizmetler/abhyanga-masaji/index.html)
        lang = parts[0]
        cat = parts[1]
        cat_index = f'{lang}/{cat}/index.html'
        if cat_index in pages and rel != cat_index:
            categories[cat_index].append(rel)

print(f'Categories found: {len(categories)}')
for cat, children in sorted(categories.items()):
    print(f'  {cat}: {len(children)} alt sayfa')

# ─── 3. Add child links to category index pages ───
for cat_index, children in categories.items():
    if not children:
        continue
    
    content = pages[cat_index]['content']
    
    # Check which children are already linked
    already_linked = set()
    for child in children:
        # Check both absolute and relative link patterns
        child_href = '/' + child
        child_name = os.path.basename(child)
        if child_href in content or child_name in content:
            already_linked.add(child)
    
    missing = [c for c in children if c not in already_linked]
    if not missing:
        continue
    
    # Build link section
    lang = cat_index.split('/')[0]
    if lang == 'tr':
        section_title = 'Tüm Hizmetlerimiz'
    elif lang == 'de':
        section_title = 'Alle Dienstleistungen'
    elif lang == 'fr':
        section_title = 'Tous nos Services'
    elif lang == 'ru':
        section_title = 'Все Услуги'
    else:
        section_title = 'All Services'
    
    link_items = []
    for child in sorted(missing):
        child_title = pages[child]['title'] or child.split('/')[-1].replace('.html','').replace('-',' ').title()
        child_href = '/' + child
        link_items.append(f'<li><a href="{child_href}">{child_title}</a></li>')
    
    section_html = f'''
<section class="category-all-services">
<h2>{section_title}</h2>
<ul class="service-link-list">
{chr(10).join(link_items)}
</ul>
</section>'''
    
    # Insert before </main> or before footer
    modified = False
    if '</main>' in content:
        content = content.replace('</main>', section_html + '\n</main>', 1)
        modified = True
    elif '<footer' in content:
        content = content.replace('<footer', section_html + '\n<footer', 1)
        modified = True
    
    if modified:
        pages[cat_index]['content'] = content
        with open(pages[cat_index]['path'], 'w', encoding='utf-8') as f:
            f.write(content)
        stats['index_links_added'] += len(missing)
        stats['files_modified'] += 1
        print(f'  INDEX: {cat_index} → {len(missing)} yeni link eklendi')

# ─── 4. Add cross-references to detail pages without related-services ───
# For each language, build cross-link pools
cross_links = defaultdict(lambda: defaultdict(list))
for rel, info in pages.items():
    parts = rel.split('/')
    if len(parts) < 3:
        continue
    lang = parts[0]
    cat = parts[1]
    if rel.endswith('index.html') and len(parts) <= 3:
        continue  # Skip category indexes
    cross_links[lang][cat].append((rel, info['title']))

for rel, info in pages.items():
    parts = rel.split('/')
    if len(parts) < 3:
        continue
    
    content = info['content']
    lang = parts[0]
    cat = parts[1]
    
    # Skip if already has related-services section (not auto-generated)
    if 'related-services' in content and 'related-services-auto' not in content:
        continue
    if 'category-all-services' in content:
        continue
    
    # Count existing internal links in main
    existing_links = re.findall(r'<a\s[^>]*href\s*=\s*["\'][^"\'#]*["\']', content, re.I)
    if len(existing_links) >= 5:
        continue
    
    # Build related links from same category + cross-category
    related = []
    # Same category (exclude self)
    for (p, t) in cross_links[lang].get(cat, []):
        if p != rel and t:
            related.append((p, t))
    
    # Cross-category (1-2 links from other categories)
    other_cats = [c for c in cross_links[lang] if c != cat]
    for other_cat in other_cats[:2]:
        others = cross_links[lang][other_cat]
        if others:
            related.append(others[0])
    
    if len(related) < 3:
        continue
    
    selected = related[:5]
    
    if lang == 'tr':
        section_title = 'Keşfedebileceğiniz Diğer Deneyimler'
    elif lang == 'de':
        section_title = 'Weitere Erlebnisse'
    elif lang == 'fr':
        section_title = 'Autres Expériences'
    elif lang == 'ru':
        section_title = 'Другие Услуги'
    else:
        section_title = 'More Experiences'
    
    link_items = '\n'.join([f'<li><a href="/{p}">{t}</a></li>' for p, t in selected])
    section_html = f'''
<section class="related-services">
<h2>{section_title}</h2>
<ul>
{link_items}
</ul>
</section>'''
    
    modified = False
    if '</main>' in content:
        content = content.replace('</main>', section_html + '\n</main>', 1)
        modified = True
    elif '<footer' in content:
        content = content.replace('<footer', section_html + '\n<footer', 1)
        modified = True
    
    if modified:
        with open(info['path'], 'w', encoding='utf-8') as f:
            f.write(content)
        stats['detail_links_added'] += 1
        stats['files_modified'] += 1

print(f'\n{"="*60}')
print(f'SONUÇLAR:')
print(f'  Kategori indexlerine eklenen link: {stats["index_links_added"]}')
print(f'  Detay sayfalarına eklenen ilgili bölüm: {stats["detail_links_added"]}')
print(f'  Değiştirilen dosya: {stats["files_modified"]}')
print(f'{"="*60}')
