"""
SANTIS ULTRA DEEP SEO AUDIT v1.0
Analyzes: Schema Markup, Breadcrumbs, Orphan Pages, Anchor Text, Sitemap, Listing Pages
"""
import os, re, json, xml.etree.ElementTree as ET
from pathlib import Path
from collections import defaultdict

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')
SKIP_DIRS = {'_legacy_archive','_legacy_content','_snapshots','backup','backups',
             'node_modules','admin','a4','components','venv','__pycache__',
             '.git','.vscode','_dev_archives','print','public','static','templates',
             'includes','reports','sr'}

# Collect all active HTML files
pages = {}
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for f in fn:
        if not f.endswith('.html'): continue
        fp = Path(dp) / f
        rel = str(fp.relative_to(ROOT)).replace('\\','/')
        try:
            with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
            pages[rel] = content
        except:
            pass

print(f'Total active HTML pages: {len(pages)}')
print('='*70)

# ─── 1. SCHEMA MARKUP ANALYSIS ───
print('\n📋 1. SCHEMA MARKUP ANALİZİ')
print('-'*70)
schema_pages = {}
no_schema = []
for rel, content in pages.items():
    schemas = re.findall(r'<script\s+type=["\']application/ld\+json["\']>(.*?)</script>', content, re.DOTALL|re.IGNORECASE)
    if schemas:
        types = []
        for s in schemas:
            try:
                data = json.loads(s)
                t = data.get('@type','?')
                types.append(t)
            except:
                types.append('PARSE_ERROR')
        schema_pages[rel] = types
    else:
        no_schema.append(rel)

print(f'  Schema olan: {len(schema_pages)} sayfa')
print(f'  Schema OLMAYAN: {len(no_schema)} sayfa')

# Schema type distribution
type_counts = defaultdict(int)
for types in schema_pages.values():
    for t in types:
        type_counts[t] += 1
print(f'\n  Schema Tip Dağılımı:')
for t, c in sorted(type_counts.items(), key=lambda x: -x[1]):
    print(f'    {t}: {c} sayfa')

print(f'\n  Schema OLMAYAN önemli sayfalar:')
for p in no_schema:
    if not p.startswith(('de/','en/','fr/','ru/')):
        print(f'    ❌ {p}')

# ─── 2. BREADCRUMB ANALYSIS ───
print('\n\n🍞 2. BREADCRUMB ANALİZİ')
print('-'*70)
has_breadcrumb_html = 0
has_breadcrumb_schema = 0
no_breadcrumb = []
for rel, content in pages.items():
    has_bc_html = bool(re.search(r'breadcrumb|aria-label=["\']breadcrumb', content, re.IGNORECASE))
    has_bc_schema = 'BreadcrumbList' in content
    if has_bc_html: has_breadcrumb_html += 1
    if has_bc_schema: has_breadcrumb_schema += 1
    if not has_bc_html and not has_bc_schema:
        no_breadcrumb.append(rel)

print(f'  HTML breadcrumb olan: {has_breadcrumb_html}')
print(f'  Schema breadcrumb olan: {has_breadcrumb_schema}')
print(f'  Breadcrumb OLMAYAN: {len(no_breadcrumb)} sayfa')
print(f'  → Tüm sayfalarda breadcrumb EKSIK' if len(no_breadcrumb) == len(pages) else '')

# ─── 3. ORPHAN PAGE ANALYSIS ───
print('\n\n🔗 3. ORPHAN PAGE (YETİM SAYFA) ANALİZİ')
print('-'*70)
# Build link graph
all_hrefs = defaultdict(set)  # page -> set of pages it links to
linked_by = defaultdict(set)  # page -> set of pages linking to it

for rel, content in pages.items():
    hrefs = re.findall(r'href=["\']([^"\'#]+)', content, re.IGNORECASE)
    for href in hrefs:
        # Normalize href
        href = href.strip()
        if href.startswith(('http','mailto','tel','javascript','data:')): continue
        if href.startswith('/'):
            target = href.lstrip('/')
        else:
            # Relative path
            base_dir = os.path.dirname(rel)
            target = os.path.normpath(os.path.join(base_dir, href)).replace('\\','/')
        # Remove query strings
        target = target.split('?')[0]
        if target in pages:
            all_hrefs[rel].add(target)
            linked_by[target].add(rel)

orphans = []
for rel in pages:
    if rel not in linked_by or len(linked_by[rel]) == 0:
        orphans.append(rel)

# Also check pages with very few incoming links
low_incoming = []
for rel in pages:
    incoming = len(linked_by.get(rel, set()))
    if 0 < incoming <= 1:
        low_incoming.append((rel, incoming))

print(f'  Yetim sayfa (0 gelen link): {len(orphans)}')
for p in sorted(orphans):
    if not p.startswith(('de/','fr/','ru/')):
        print(f'    🚫 {p}')

print(f'\n  Zayıf bağlı sayfa (1 gelen link): {len(low_incoming)}')
for p, c in sorted(low_incoming)[:15]:
    if not p.startswith(('de/','fr/','ru/')):
        print(f'    ⚠️ {p} ({c} link)')

# ─── 4. ANCHOR TEXT ANALYSIS ───
print('\n\n🏷️ 4. ANCHOR TEXT ANALİZİ')
print('-'*70)
anchor_texts = defaultdict(list)  # anchor_text -> [(source, target)]
for rel, content in pages.items():
    links = re.findall(r'<a\s[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', content, re.IGNORECASE|re.DOTALL)
    for href, text in links:
        if href.startswith(('http','mailto','tel','javascript','#')): continue
        clean_text = re.sub(r'<[^>]+>', '', text).strip()
        if clean_text and len(clean_text) > 1:
            anchor_texts[clean_text.lower()].append((rel, href))

# Find over-used anchors
print(f'  Toplam benzersiz anchor text: {len(anchor_texts)}')
print(f'\n  En çok kullanılan anchor textler:')
sorted_anchors = sorted(anchor_texts.items(), key=lambda x: -len(x[1]))
for text, usages in sorted_anchors[:15]:
    print(f'    "{text}" → {len(usages)} kez kullanılmış')

# Find generic/weak anchors
generic = ['tümünü gör','devamını oku','tıklayın','click here','read more','learn more','daha fazla','buraya tıklayın','detay','incele']
print(f'\n  Zayıf/Generic anchor text:')
for g in generic:
    if g in anchor_texts:
        print(f'    ⚠️ "{g}" → {len(anchor_texts[g])} kez')

# ─── 5. SITEMAP ANALYSIS ───
print('\n\n🗺️ 5. SITEMAP ANALİZİ')
print('-'*70)
sitemap_path = ROOT / 'sitemap.xml'
if sitemap_path.exists():
    with open(sitemap_path, 'r', encoding='utf-8') as f:
        sitemap_content = f.read()
    print(f'  Dosya boyutu: {len(sitemap_content)} byte')
    
    # Count URLs
    urls_in_sitemap = re.findall(r'<loc>(.*?)</loc>', sitemap_content)
    print(f'  URL sayısı: {len(urls_in_sitemap)}')
    
    # Check lastmod
    lastmods = re.findall(r'<lastmod>(.*?)</lastmod>', sitemap_content)
    print(f'  lastmod olan: {len(lastmods)}')
    
    # Check priority
    priorities = re.findall(r'<priority>(.*?)</priority>', sitemap_content)
    print(f'  priority olan: {len(priorities)}')
    
    # Check changefreq
    changefreqs = re.findall(r'<changefreq>(.*?)</changefreq>', sitemap_content)
    print(f'  changefreq olan: {len(changefreqs)}')
    
    # Pages NOT in sitemap
    sitemap_paths = set()
    for url in urls_in_sitemap:
        # Extract path from URL
        path = url.replace('https://santis.club/','').replace('http://santis.club/','')
        sitemap_paths.add(path)
    
    not_in_sitemap = [p for p in pages if p not in sitemap_paths]
    print(f'\n  Sitemap\'te OLMAYAN sayfa: {len(not_in_sitemap)}')
    for p in sorted(not_in_sitemap)[:10]:
        print(f'    ❌ {p}')
    if len(not_in_sitemap) > 10:
        print(f'    ... ve {len(not_in_sitemap)-10} sayfa daha')
    
    print(f'\n  Sitemap İçeriği:')
    print(f'  {sitemap_content[:500]}')
else:
    print('  ❌ sitemap.xml BULUNAMADI!')

# ─── 6. LISTING PAGE (24 SHORT PAGE) ANALYSIS ───
print('\n\n📄 6. LISTING SAYFA ANALİZİ (Kısa İçerikli Hub Sayfaları)')
print('-'*70)
listing_pages = []
for rel, content in pages.items():
    if not (rel.startswith('tr/') or rel in ('index.html','booking.html','service-detail.html','showroom.html','404.html','kese-ve-kopuk-masaji.html')):
        continue
    clean = re.sub(r'<script[^>]*>.*?</script>','',content,flags=re.I|re.DOTALL)
    clean = re.sub(r'<style[^>]*>.*?</style>','',clean,flags=re.I|re.DOTALL)
    tx = re.sub(r'<[^>]+>',' ',clean)
    tx = re.sub(r'\s+',' ',tx).strip()
    wc = len(tx.split())
    if wc < 80:
        title = re.search(r'<title>(.*?)</title>', content, re.I)
        title_text = title.group(1).strip() if title else '?'
        has_faq = bool(re.search(r'FAQ|faq|sss|sık sorulan', content, re.I))
        has_intro = bool(re.search(r'class=".*intro|description|summary', content, re.I))
        listing_pages.append({
            'file': rel,
            'words': wc,
            'title': title_text,
            'has_faq': has_faq,
            'has_intro': has_intro,
        })

print(f'  Kısa listing sayfa sayısı: {len(listing_pages)}')
for p in listing_pages:
    faq_icon = '✅' if p['has_faq'] else '❌'
    intro_icon = '✅' if p['has_intro'] else '❌'
    print(f'    {p["file"]} ({p["words"]}w) | FAQ:{faq_icon} Intro:{intro_icon}')

# ─── 7. ROBOTS.TXT ANALYSIS ───
print('\n\n🤖 7. ROBOTS.TXT ANALİZİ')
print('-'*70)
robots_path = ROOT / 'robots.txt'
if robots_path.exists():
    with open(robots_path, 'r') as f:
        robots_content = f.read()
    print(f'  İçerik:\n{robots_content}')
else:
    print('  ❌ robots.txt BULUNAMADI!')

# ─── 8. CANONICAL & HREFLANG ANALYSIS ───
print('\n\n🌐 8. CANONICAL & HREFLANG ANALİZİ')
print('-'*70)
no_canonical = []
no_hreflang = []
for rel, content in pages.items():
    has_canonical = bool(re.search(r'rel=["\']canonical["\']', content, re.I))
    has_hreflang = bool(re.search(r'hreflang=', content, re.I))
    if not has_canonical: no_canonical.append(rel)
    if not has_hreflang: no_hreflang.append(rel)

print(f'  Canonical OLMAYAN: {len(no_canonical)} sayfa')
for p in no_canonical[:10]:
    print(f'    ❌ {p}')
print(f'  Hreflang OLMAYAN: {len(no_hreflang)} sayfa')
for p in no_hreflang[:10]:
    print(f'    ❌ {p}')

# ─── 9. META DESCRIPTION ANALYSIS ───
print('\n\n📝 9. META DESCRIPTION ANALİZİ')
print('-'*70)
no_desc = []
short_desc = []
for rel, content in pages.items():
    desc_match = re.search(r'<meta\s[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\']', content, re.I)
    if not desc_match:
        desc_match = re.search(r'<meta\s[^>]*content=["\']([^"\']*)["\'][^>]*name=["\']description["\']', content, re.I)
    if not desc_match:
        no_desc.append(rel)
    elif len(desc_match.group(1).strip()) < 50:
        short_desc.append((rel, desc_match.group(1).strip()))

print(f'  Meta description OLMAYAN: {len(no_desc)} sayfa')
for p in no_desc[:10]:
    print(f'    ❌ {p}')
print(f'  Kısa meta description (<50 char): {len(short_desc)} sayfa')
for p, d in short_desc[:5]:
    print(f'    ⚠️ {p}: "{d}"')

# ─── 10. OPEN GRAPH ANALYSIS ───
print('\n\n📱 10. OPEN GRAPH ANALİZİ')
print('-'*70)
no_og_title = 0
no_og_desc = 0
no_og_image = 0
for rel, content in pages.items():
    if not re.search(r'property=["\']og:title', content, re.I): no_og_title += 1
    if not re.search(r'property=["\']og:description', content, re.I): no_og_desc += 1
    if not re.search(r'property=["\']og:image', content, re.I): no_og_image += 1

print(f'  og:title eksik: {no_og_title} sayfa')
print(f'  og:description eksik: {no_og_desc} sayfa')
print(f'  og:image eksik: {no_og_image} sayfa')

print('\n\n' + '='*70)
print('TARAMA TAMAMLANDI')
print('='*70)
