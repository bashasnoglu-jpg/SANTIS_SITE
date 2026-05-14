"""
SANTIS SEO FIX SCRIPT v1.0
Fixes: H1, Alt Text, Content Expansion, Internal Links
Scope: TR pages first, then other languages
"""
import os, re, sys, json, copy
from pathlib import Path

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')
SKIP_DIRS = {'_legacy_archive','_legacy_content','_snapshots','backup','backups',
             'node_modules','admin','a4','components','assets','venv','__pycache__',
             '.git','.vscode','_dev_archives','print','public','static','templates',
             'includes','reports','sr'}

DRY_RUN = '--dry-run' in sys.argv
LANG_FILTER = None  # None = all, 'tr' = only TR
for arg in sys.argv:
    if arg.startswith('--lang='):
        LANG_FILTER = arg.split('=')[1]

stats = {'h1_fixed': 0, 'alt_fixed': 0, 'content_added': 0, 'links_added': 0, 'files_modified': 0}

# ─── INTERNAL LINK DATABASE ───
TR_LINKS = {
    'masaj': [
        ('/tr/masajlar/klasik-rahatlama.html', 'Klasik Rahatlama Masajı'),
        ('/tr/masajlar/aromaterapi.html', 'Aromaterapi Masajı'),
        ('/tr/masajlar/derin-doku.html', 'Derin Doku Masajı'),
        ('/tr/masajlar/sicak-tas.html', 'Sıcak Taş Masajı'),
        ('/tr/masajlar/anti-stress.html', 'Anti-Stress Masajı'),
        ('/tr/masajlar/refleksoloji.html', 'Refleksoloji'),
        ('/tr/masajlar/bali.html', 'Bali Masajı'),
        ('/tr/masajlar/thai.html', 'Thai Masajı'),
        ('/tr/masajlar/spor-terapi.html', 'Spor Terapi Masajı'),
        ('/tr/masajlar/shiatsu.html', 'Shiatsu Masajı'),
    ],
    'hamam': [
        ('/tr/hamam/kese-kopuk.html', 'Kese & Köpük Masajı'),
        ('/tr/hamam/osmanli-ritueli.html', 'Osmanlı Saray Ritüeli'),
        ('/tr/hamam/kahve-detox.html', 'Kahve Detox Arınma'),
        ('/tr/hamam/santis-pasa.html', 'Santis Paşa Hamamı'),
        ('/tr/hamam/gelin-hamami.html', 'Gelin Hamamı'),
        ('/tr/hamam/kopuk-masaji.html', 'Köpük Masajı'),
        ('/tr/hamam/tuz-peeling.html', 'Tuz Peeling'),
    ],
    'cilt': [
        ('/tr/cilt-bakimi/deep-cleanse.html', 'Derin Temizleme Bakımı'),
        ('/tr/cilt-bakimi/anti-aging-pro.html', 'Anti-Aging Pro Bakım'),
        ('/tr/cilt-bakimi/hyaluron-hydrate.html', 'Hyaluron Nem Terapisi'),
        ('/tr/cilt-bakimi/collagen-lift.html', 'Kolajen Lifting Bakımı'),
        ('/tr/cilt-bakimi/glass-skin.html', 'Glass Skin Ritüeli'),
        ('/tr/cilt-bakimi/vitamin-c-glow.html', 'Vitamin C Glow'),
        ('/tr/cilt-bakimi/gold-mask-ritual.html', 'Gold Mask Ritüeli'),
        ('/tr/cilt-bakimi/oxygen-boost.html', 'Oksijen Boost Bakımı'),
        ('/tr/cilt-bakimi/enzyme-peel.html', 'Enzim Peeling Bakımı'),
    ],
    'hizmet': [
        ('/tr/hizmetler/abhyanga-masaji/index.html', 'Abhyanga Masajı'),
        ('/tr/hizmetler/shirodhara/index.html', 'Shirodhara'),
        ('/tr/hizmetler/maderoterapi/index.html', 'Maderoterapi'),
        ('/tr/hizmetler/g5-masaji/index.html', 'G5 Vibro-Sculpting'),
    ],
}

EN_LINKS = {
    'massage': [
        ('/en/massages/classic-relaxation.html', 'Classic Relaxation Massage'),
        ('/en/massages/aromatherapy.html', 'Aromatherapy Massage'),
        ('/en/massages/deep-tissue.html', 'Deep Tissue Massage'),
        ('/en/massages/hot-stone.html', 'Hot Stone Massage'),
        ('/en/massages/anti-stress.html', 'Anti-Stress Massage'),
    ],
    'hammam': [
        ('/en/hammam/kese-kopuk.html', 'Scrub & Foam Massage'),
        ('/en/hammam/osmanli-ritueli.html', 'Ottoman Palace Ritual'),
        ('/en/hammam/kahve-detox.html', 'Coffee Detox Purification'),
    ],
    'skin': [
        ('/en/services/deep-cleanse.html', 'Deep Cleansing'),
        ('/en/services/anti-aging-pro.html', 'Anti-Aging Pro'),
        ('/en/services/hyaluron-hydrate.html', 'Hyaluron Hydration'),
    ],
}

# ─── CONTENT TEMPLATES ───
TR_CONTENT_TEMPLATES = {
    'masaj': {
        'extra_intro': 'Santis Club\'un uzman terapistleri tarafından, her bireyin ihtiyacına özel olarak uyarlanan bu terapi, bedensel ve zihinsel dengeyi yeniden kurmayı amaçlar. Profesyonel dokunuş ve özenle seçilmiş aromatik yağlarla derin bir rahatlama deneyimi sunulur.',
        'extra_benefits': [
            'Kan dolaşımını hızlandırır',
            'Kas gerginliğini azaltır',
            'Uyku kalitesini artırır',
            'Bağışıklık sistemini güçlendirir',
        ],
        'process_steps': '''<ol class="service-steps">
<li><strong>Ön Görüşme:</strong> Terapistiniz, kişisel sağlık durumunuzu ve tercihlerinizi değerlendirir.</li>
<li><strong>Ortam Hazırlığı:</strong> Terapi odası, tercih edeceğiniz ışık ve müzik eşliğinde hazırlanır.</li>
<li><strong>Uygulama:</strong> Profesyonel tekniklerle, odak bölgelerinize yönelik terapi uygulanır.</li>
<li><strong>Tamamlama:</strong> Bitkisel çay eşliğinde rahatlama ve terapist önerileri.</li>
</ol>''',
        'ideal_for': 'Yoğun tempolu yaşamdan kaçış arayan, bedeni ve zihniyle yeniden bağ kurmak isteyen herkes için idealdir.',
    },
    'hamam': {
        'extra_intro': 'Yüzyıllık Osmanlı hamam geleneğinden ilham alan bu ritüel, Santis Club\'un özel atmosferinde modern bir yorumla sunulur. Her detay, arınma ve yenilenme deneyiminizi zenginleştirmek için tasarlanmıştır.',
        'extra_benefits': [
            'Cilt yenilenmesini hızlandırır',
            'Toksinlerin atılmasını sağlar',
            'Kas ve eklem esnekliğini artırır',
            'Derin rahatlama ve huzur hissi verir',
        ],
        'process_steps': '''<ol class="service-steps">
<li><strong>Isınma:</strong> Hamam sıcaklığına uyum sağlamak için buhar odasında dinlenme.</li>
<li><strong>Ritüel:</strong> Uzman eller eşliğinde geleneksel tekniklerle uygulama.</li>
<li><strong>Arınma:</strong> Doğal ürünlerle cildin derinlemesine temizlenmesi.</li>
<li><strong>Ferahlama:</strong> Serinleme ve bitkisel çay ile ritüelin tamamlanması.</li>
</ol>''',
        'ideal_for': 'Geleneksel arınma ritüellerini modern konforla deneyimlemek isteyen misafirlerimiz için özel olarak tasarlanmıştır.',
    },
    'cilt': {
        'extra_intro': 'Sothys Paris\'in bilimsel formülleriyle güçlendirilmiş bu bakım, cildinizin doğal dengesini yeniden kurar. Santis Club\'un profesyonel cilt bakım uzmanları tarafından, kişiselleştirilmiş bir protokolle uygulanır.',
        'extra_benefits': [
            'Cilt bariyerini güçlendirir',
            'Nem dengesini optimize eder',
            'Cilt tonunu eşitler',
            'Yaşlanma belirtilerini azaltır',
        ],
        'process_steps': '''<ol class="service-steps">
<li><strong>Cilt Analizi:</strong> Dijital cilt analizi ile ihtiyaçlarınız belirlenir.</li>
<li><strong>Temizleme:</strong> Profesyonel ürünlerle derinlemesine temizlik.</li>
<li><strong>Uygulama:</strong> Kişiselleştirilmiş aktif madde formülasyonu.</li>
<li><strong>Koruma:</strong> SPF ve nem bariyeri ile bakımın korunması.</li>
</ol>''',
        'ideal_for': 'Cildinize profesyonel düzeyde özen göstermek ve uzun vadeli sonuçlar elde etmek isteyen herkes için uygundur.',
    },
}


def detect_category(filepath):
    """Detect page category from filepath."""
    fp = str(filepath).replace('\\', '/')
    if '/masaj' in fp or '/massage' in fp:
        return 'masaj'
    elif '/hamam' in fp or '/hammam' in fp:
        return 'hamam'
    elif '/cilt' in fp or '/skin' in fp or '/services/' in fp:
        return 'cilt'
    elif '/hizmet' in fp:
        return 'hizmet'
    return None


def detect_lang(filepath):
    """Detect language from filepath."""
    rel = str(filepath.relative_to(ROOT)).replace('\\', '/')
    if rel.startswith('tr/'):
        return 'tr'
    elif rel.startswith('en/'):
        return 'en'
    elif rel.startswith('de/'):
        return 'de'
    elif rel.startswith('fr/'):
        return 'fr'
    elif rel.startswith('ru/'):
        return 'ru'
    return 'tr'  # root pages default to TR


def get_title_from_content(content):
    """Extract page title from <title> tag."""
    m = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
    if m:
        title = m.group(1).strip()
        # Remove site name suffix
        for sep in [' | ', ' • ', ' - ', ' – ']:
            if sep in title:
                title = title.split(sep)[0].strip()
        return title
    return None


def fix_h1(content, filepath):
    """Fix H1 issues: ensure exactly 1 H1 per page."""
    h1s = list(re.finditer(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL))
    modified = False

    if len(h1s) == 0:
        # No H1 → add one after <main> or <body>
        title = get_title_from_content(content)
        if not title:
            return content, False

        # Don't add H1 to root index.html (it's a special page with sections)
        rel = str(filepath.relative_to(ROOT)).replace('\\', '/')
        if rel == 'index.html':
            # For root index.html, add visually hidden H1 for SEO
            h1_tag = f'<h1 class="sr-only">{title}</h1>'
            if '<main' in content:
                content = re.sub(r'(<main[^>]*>)', r'\1\n' + h1_tag, content, count=1)
                modified = True
        else:
            h1_tag = f'<h1>{title}</h1>'
            if '<header' in content and '</header>' in content:
                # Add H1 inside header
                content = re.sub(r'(<header[^>]*>)', r'\1\n<div class="nv-container">' + h1_tag + '</div>', content, count=1)
                modified = True
            elif '<main' in content:
                content = re.sub(r'(<main[^>]*>)', r'\1\n' + h1_tag, content, count=1)
                modified = True

    elif len(h1s) > 1:
        # Multiple H1 → keep first, convert rest to H2
        for h1_match in reversed(h1s[1:]):
            old = h1_match.group(0)
            new = old.replace('<h1', '<h2').replace('</h1>', '</h2>')
            content = content[:h1_match.start()] + new + content[h1_match.end():]
        modified = True

    # Fix generic H1 like "<h1>Index</h1>"
    generic_h1 = re.search(r'<h1[^>]*>\s*Index\s*</h1>', content, re.IGNORECASE)
    if generic_h1:
        title = get_title_from_content(content)
        if title and title.lower() != 'index':
            content = content[:generic_h1.start()] + f'<h1>{title}</h1>' + content[generic_h1.end():]
            modified = True

    if modified:
        stats['h1_fixed'] += 1
    return content, modified


def fix_alt_text(content, filepath):
    """Fix missing alt text on images."""
    modified = False

    def replace_img(match):
        nonlocal modified
        img_tag = match.group(0)
        if 'alt=' not in img_tag.lower():
            # Derive alt from src filename
            src_match = re.search(r'src=["\']([^"\']+)["\']', img_tag)
            if src_match:
                src = src_match.group(1)
                basename = Path(src).stem.replace('-', ' ').replace('_', ' ').title()
                img_tag = img_tag.rstrip('/>').rstrip('>').rstrip('/') + f' alt="{basename}"'
                if match.group(0).endswith('/>'):
                    img_tag += '/>'
                else:
                    img_tag += '>'
                modified = True
        elif re.search(r'alt\s*=\s*["\'][\s]*["\']', img_tag):
            # Empty alt → derive from src
            src_match = re.search(r'src=["\']([^"\']+)["\']', img_tag)
            if src_match:
                src = src_match.group(1)
                basename = Path(src).stem.replace('-', ' ').replace('_', ' ').title()
                img_tag = re.sub(r'alt\s*=\s*["\'][\s]*["\']', f'alt="{basename}"', img_tag)
                modified = True
        return img_tag

    content = re.sub(r'<img\s[^>]*?/?>', replace_img, content, flags=re.IGNORECASE | re.DOTALL)
    if modified:
        stats['alt_fixed'] += 1
    return content, modified


def expand_content(content, filepath):
    """Expand thin content with service details, benefits, process."""
    cat = detect_category(filepath)
    lang = detect_lang(filepath)

    if lang != 'tr' or cat is None:
        return content, False

    # Only expand pages with service-detail structure
    if 'service-intro' not in content and 'service-benefits' not in content:
        return content, False

    # Check word count
    clean = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.IGNORECASE | re.DOTALL)
    clean = re.sub(r'<style[^>]*>.*?</style>', '', clean, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', clean)
    text = re.sub(r'\s+', ' ', text).strip()
    word_count = len(text.split())

    if word_count >= 120:
        return content, False

    # Get template - use category or fallback
    template_cat = cat if cat in TR_CONTENT_TEMPLATES else 'masaj'
    template = TR_CONTENT_TEMPLATES[template_cat]
    modified = False

    # 1. Expand service-intro
    intro_match = re.search(r'(<section class="service-intro">\s*<p>)(.*?)(</p>\s*</section>)', content, re.DOTALL)
    if intro_match:
        existing_text = intro_match.group(2).strip()
        if len(existing_text.split()) < 40:
            new_intro = f'{existing_text} {template["extra_intro"]}'
            content = content[:intro_match.start(1)] + intro_match.group(1) + new_intro + intro_match.group(3) + content[intro_match.end():]
            modified = True

    # 2. Add extra benefits
    benefits_match = re.search(r'(</ul>\s*</section>\s*<section class="service-process">)', content, re.DOTALL)
    if not benefits_match:
        benefits_match = re.search(r'(</ul>\s*</section>)', content, re.DOTALL)
    
    ul_match = re.search(r'(<section class="service-benefits">.*?<ul>)(.*?)(</ul>)', content, re.DOTALL)
    if ul_match:
        existing_items = ul_match.group(2)
        existing_count = existing_items.count('<li>')
        if existing_count < 7:
            extra_items = '\n'.join([f'<li>{b}</li>' for b in template['extra_benefits']])
            new_ul_content = existing_items.rstrip() + '\n' + extra_items + '\n'
            content = content[:ul_match.start(2)] + new_ul_content + content[ul_match.end(2):]
            modified = True

    # 3. Expand process section
    process_match = re.search(r'(<section class="service-process">\s*<h2>.*?</h2>\s*<p>)(.*?)(</p>\s*</section>)', content, re.DOTALL)
    if process_match:
        existing_process = process_match.group(2).strip()
        if len(existing_process.split()) < 30:
            new_process = existing_process + '</p>\n' + template['process_steps'] + '\n<p>' + template['ideal_for']
            content = content[:process_match.start(2)] + new_process + content[process_match.end(2):]
            modified = True

    if modified:
        stats['content_added'] += 1
    return content, modified


def add_internal_links(content, filepath):
    """Add internal links if fewer than 3 exist."""
    cat = detect_category(filepath)
    lang = detect_lang(filepath)
    rel = str(filepath.relative_to(ROOT)).replace('\\', '/')

    # Count existing internal links in main content area
    # Exclude nav and footer
    main_match = re.search(r'<main[^>]*>(.*?)</main>', content, re.DOTALL | re.IGNORECASE)
    if main_match:
        main_content = main_match.group(1)
    else:
        main_content = content

    existing_links = re.findall(r'<a\s[^>]*href\s*=\s*["\'][^"\']*["\']', main_content, re.IGNORECASE)
    
    if len(existing_links) >= 3:
        return content, False

    # Already has related-services section?
    if 'related-services' in content and 'related-services-auto' not in content:
        return content, False

    # Determine link pool
    if lang == 'tr':
        link_pool = TR_LINKS.get(cat, TR_LINKS.get('masaj', []))
    elif lang == 'en':
        link_pool = EN_LINKS.get(cat, EN_LINKS.get('massage', []))
    else:
        return content, False  # Skip DE/FR/RU for now

    # Filter out self-links
    current_page = '/' + rel.replace('\\', '/')
    available_links = [(href, text) for href, text in link_pool if href != current_page]

    if len(available_links) < 3:
        return content, False

    # Pick 3 links
    selected = available_links[:3]

    # Build link section
    link_items = '\n'.join([f'<li><a href="{href}">{text}</a></li>' for href, text in selected])
    
    if lang == 'tr':
        section_title = 'İlgili Hizmetler'
    else:
        section_title = 'Related Services'

    link_section = f'''
<section class="related-services">
<h2>{section_title}</h2>
<ul>
{link_items}
</ul>
</section>'''

    # Insert before </main> or before <footer>
    modified = False
    if '</main>' in content:
        # Check if already has related-services-auto (from previous script runs)
        if 'related-services-auto' in content:
            # Remove old auto section and replace
            content = re.sub(r'<div class="related-services-auto"[^>]*>.*?</div>', '', content, flags=re.DOTALL)
        
        content = content.replace('</main>', link_section + '\n</main>', 1)
        modified = True
    elif '<footer' in content:
        content = content.replace('<footer', link_section + '\n<footer', 1)
        modified = True

    if modified:
        stats['links_added'] += 1
    return content, modified


def process_file(filepath):
    """Process a single HTML file through all fixes."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            original = f.read()
    except:
        return

    content = original
    any_modified = False

    # Apply fixes in order
    content, m1 = fix_h1(content, filepath)
    any_modified = any_modified or m1

    content, m2 = fix_alt_text(content, filepath)
    any_modified = any_modified or m2

    content, m3 = expand_content(content, filepath)
    any_modified = any_modified or m3

    content, m4 = add_internal_links(content, filepath)
    any_modified = any_modified or m4

    if any_modified:
        rel = str(filepath.relative_to(ROOT))
        fixes = []
        if m1: fixes.append('H1')
        if m2: fixes.append('ALT')
        if m3: fixes.append('CONTENT')
        if m4: fixes.append('LINKS')
        print(f'  FIXED: {rel} [{", ".join(fixes)}]')

        if not DRY_RUN:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
        stats['files_modified'] += 1


def main():
    print('=' * 60)
    print('SANTIS SEO FIX SCRIPT v1.0')
    print(f'Mode: {"DRY RUN" if DRY_RUN else "LIVE"}')
    print(f'Language filter: {LANG_FILTER or "ALL"}')
    print('=' * 60)

    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirpath_p = Path(dirpath)
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for f in filenames:
            if not f.endswith('.html'):
                continue
            fp = dirpath_p / f
            rel = str(fp.relative_to(ROOT)).replace('\\', '/')

            # Apply language filter
            if LANG_FILTER:
                if LANG_FILTER == 'tr':
                    if not (rel.startswith('tr/') or rel in ('index.html', 'booking.html', 'service-detail.html', 'showroom.html', '404.html', 'kese-ve-kopuk-masaji.html')):
                        continue
                elif not rel.startswith(f'{LANG_FILTER}/'):
                    continue

            process_file(fp)

    print('\n' + '=' * 60)
    print('RESULTS:')
    print(f'  H1 fixed:        {stats["h1_fixed"]}')
    print(f'  Alt text fixed:   {stats["alt_fixed"]}')
    print(f'  Content expanded: {stats["content_added"]}')
    print(f'  Links added:      {stats["links_added"]}')
    print(f'  Files modified:   {stats["files_modified"]}')
    print('=' * 60)


if __name__ == '__main__':
    main()
