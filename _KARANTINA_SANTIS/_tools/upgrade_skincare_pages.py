# -*- coding: utf-8 -*-
"""
SANTIS — Cilt Bakımı Sayfa Güçlendirme Script'i
Statik sayfaları premium seviyeye yükseltir:
  - Navbar/footer component loading
  - Hero section
  - Editorial CSS
  - WhatsApp CTA
  - Proper script loading
"""
import os, re, glob

ROOT = r'c:\Users\tourg\Desktop\SANTIS_SITE'
TR_DIR = os.path.join(ROOT, 'tr', 'cilt-bakimi')

# Default hero image for skincare pages
DEFAULT_HERO = 'santis_hero_skincare_lux.webp'

# Map specific pages to specific card images if available
PAGE_IMAGES = {
    'acne-balance': 'santis_card_skincare_clay_v2.webp',
    'deep-cleanse': 'santis_card_skincare_clay_v2.webp', 
    'classic-facial': 'facial.webp',
    'hydra-boost': 'santis_card_hydration_lux.webp',
    'gold-facial': 'santis_card_skincare_lux.webp',
    'anti-aging-pro': 'santis_card_skincare_detail_v2.webp',
    'collagen-lift': 'santis_card_skincare_detail_v2.webp',
    'vitamin-c-glow': 'santis_card_skincare_v1.webp',
    'brightening-spot': 'santis_card_skincare_v1.webp',
    'stem-cell': 'santis_card_skincare_lux.webp',
    'oxygen-infusion': 'skincare.webp',
    'peel-renewal': 'santis_card_skincare_clay_v2.webp',
    'detox-charcoal': 'santis_card_skincare_clay_v2.webp',
    'barrier-repair': 'santis_card_hydration_lux.webp',
    'sensitive-calm': 'santis_card_hydration_lux.webp',
    'led-therapy': 'santis_card_skincare_detail_v2.webp',
    'micro-current': 'santis_card_skincare_detail_v2.webp',
    'eye-contour': 'facial.webp',
    'neck-decollete': 'santis_card_skincare_lux.webp',
    'rose-quartz': 'santis_card_skincare_lux.webp',
}


def extract_data(content):
    """Extract title, desc, duration, price from existing HTML."""
    title_m = re.search(r'<title>(.*?)\s*\|', content)
    title = title_m.group(1).strip() if title_m else 'Cilt Bakımı'

    desc_m = re.search(r'<meta content="(.*?)" name="description"', content)
    desc = desc_m.group(1).strip() if desc_m else ''

    dur_m = re.search(r'<p>(\d+)\s*dk</p>', content)
    dur = dur_m.group(1) if dur_m else '60'

    price_m = re.search(r'"price":\s*"(\d+)"', content)
    price = price_m.group(1) if price_m else '65'

    # Extract intro paragraph
    intro_m = re.search(r'<section class="service-intro">\s*<p>(.*?)</p>', content, re.DOTALL)
    intro = intro_m.group(1).strip() if intro_m else desc

    # Extract benefits
    benefits = []
    ben_m = re.findall(r'<li>(.*?)</li>', content)
    for b in ben_m:
        if b.strip() and b.strip() != 'Faydaları' and '<a ' not in b:
            benefits.append(b.strip())

    # Extract steps
    steps = []
    steps_section = re.search(r'<ol class="service-steps">(.*?)</ol>', content, re.DOTALL)
    if steps_section:
        steps = re.findall(r'<li>(.*?)</li>', steps_section.group(1), re.DOTALL)
        steps = [s.strip() for s in steps]

    # Extract process description
    proc_m = re.search(r'<section class="service-process">\s*<h2>.*?</h2>\s*<p>(.*?)</p>', content, re.DOTALL)
    process_desc = proc_m.group(1).strip() if proc_m else ''

    # Extract post-steps paragraph
    post_m = re.search(r'</ol>\s*<p>(.*?)</p>\s*</section>', content, re.DOTALL)
    post_text = post_m.group(1).strip() if post_m else ''

    # Canonical 
    canon_m = re.search(r'<link href="(.*?)" rel="canonical"', content)
    canonical = canon_m.group(1) if canon_m else ''

    # OG URL
    og_url_m = re.search(r'<meta content="(.*?)" property="og:url"', content)
    og_url = og_url_m.group(1) if og_url_m else canonical

    # Schema JSON-LD (Service)
    schema_m = re.search(r'(<script type="application/ld\+json">.*?</script>)', content, re.DOTALL)
    schema = schema_m.group(1) if schema_m else ''

    # Breadcrumb JSON-LD
    bread_start = content.find('"BreadcrumbList"')
    breadcrumb_schema = ''
    if bread_start > 0:
        # Find the <script> tag containing it
        s = content.rfind('<script type="application/ld+json">', 0, bread_start)
        e = content.find('</script>', bread_start) + len('</script>')
        if s > 0 and e > s:
            breadcrumb_schema = content[s:e]

    # Hreflang links
    hreflang_links = re.findall(r'(<link rel="alternate" hreflang=.*?/>)', content)

    return {
        'title': title,
        'desc': desc,
        'duration': dur,
        'price': price,
        'intro': intro,
        'benefits': benefits,
        'steps': steps,
        'process_desc': process_desc,
        'post_text': post_text,
        'canonical': canonical,
        'og_url': og_url,
        'schema': schema,
        'breadcrumb_schema': breadcrumb_schema,
        'hreflang_links': hreflang_links,
    }


def build_page(basename, data, hero_img):
    """Build the upgraded HTML page."""
    
    benefits_html = '\n'.join(f'<li>{b}</li>' for b in data['benefits']) if data['benefits'] else '<li>Derin cilt yenilenmesi</li>\n<li>Doğal parlaklık</li>'
    
    steps_html = ''
    if data['steps']:
        steps_items = '\n'.join(f'<li>{s}</li>' for s in data['steps'])
        steps_html = f'''<section class="service-process">
<h2>Uygulama Süreci</h2>
<p>{data['process_desc']}</p>
<ol class="service-steps">
{steps_items}
</ol>
{f'<p>{data["post_text"]}</p>' if data['post_text'] else ''}
</section>'''

    hreflang_html = '\n    '.join(data['hreflang_links']) if data['hreflang_links'] else ''
    
    whatsapp_msg = f'Merhaba, {data["title"]} için randevu almak istiyorum.'
    whatsapp_url = f'https://wa.me/905348350169?text={whatsapp_msg.replace(" ", "%20").replace(",", "%2C")}'

    return f'''<!DOCTYPE html>
<html lang="tr" data-site-root="../../" data-page-type="service-detail">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>{data['title']} | Santis Club</title>
<meta content="{data['desc']}" name="description"/>
<!-- Canonical -->
<link href="{data['canonical']}" rel="canonical"/>
<!-- Open Graph -->
<meta content="{data['title']}" property="og:title"/>
<meta content="{data['desc']}" property="og:description"/>
<meta content="service" property="og:type"/>
<meta content="{data['og_url']}" property="og:url"/>
<meta content="../../assets/img/cards/{hero_img}" property="og:image"/>
<!-- Schema.org -->
{data['schema']}
{data['breadcrumb_schema']}
<!-- Fonts & Styles -->
<link href="../../assets/css/fonts.css" rel="stylesheet"/>
<link href="../../assets/css/style.css" rel="stylesheet"/>
<link href="../../assets/css/editorial.css?v=2.5" rel="stylesheet"/>
<link href="../../assets/css/service-detail.css" rel="stylesheet"/>
<link href="/favicon.ico" rel="icon"/>
<script src="../../assets/js/perf-head.js"></script>
<script src="../../assets/js/i18n-routes.js"></script>
<script src="../../assets/js/hreflang-injector.js" defer></script>
    {hreflang_html}
</head>
<body class="editorial-mode">
<noscript>
<nav class="nv-noscript-nav">
<a href="/index.html" class="nv-ns-home">ANA SAYFA</a>
<a href="/tr/hamam/index.html">HAMAM</a>
<a href="/tr/masajlar/index.html">MASAJLAR</a>
<a href="/tr/cilt-bakimi/index.html">CİLT BAKIMI</a>
<a href="/tr/galeri/index.html">GALERİ</a>
</nav>
</noscript>

<!-- NAVBAR -->
<div id="navbar-container"></div>

<!-- HERO SECTION -->
<section class="svc-detail-hero" style="position:relative; min-height:50vh; display:flex; align-items:center; justify-content:center; overflow:hidden;">
<img
  src="../../assets/img/cards/{hero_img}"
  alt="{data['title']} — Santis Club premium cilt bakımı"
  decoding="async"
  fetchpriority="high"
  width="1200"
  height="800"
  style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; filter:brightness(0.45);"
/>
<div style="position:relative; z-index:2; text-align:center; color:#fff; padding:2rem;">
<h1 style="font-family:'Cinzel',serif; font-size:clamp(1.8rem,4vw,3.2rem); font-weight:400; letter-spacing:0.05em; margin-bottom:0.5rem;">{data['title']}</h1>
<p style="font-family:'Inter',sans-serif; font-size:1rem; opacity:0.8; max-width:600px; margin:0 auto;">{data['desc']}</p>
</div>
</section>

<!-- MAIN CONTENT -->
<main class="service-detail nv-container" style="max-width:800px; margin:0 auto; padding:3rem 1.5rem;">

<section class="service-intro">
<p>{data['intro']}</p>
</section>

<section class="service-benefits">
<h2>Faydaları</h2>
<ul>
{benefits_html}
</ul>
</section>

{steps_html}

<section class="service-duration">
<h2>Süre & Deneyim</h2>
<p>{data['duration']} dk</p>
</section>

<!-- CTA -->
<section class="booking-cta" style="text-align:center; padding:2rem 0; display:flex; flex-direction:column; gap:1rem; align-items:center;">
<a class="btn-primary" href="{whatsapp_url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#25D366,#128C7E); color:#fff; padding:14px 32px; border-radius:30px; font-weight:600; text-decoration:none; font-size:1rem;">
WhatsApp ile Randevu Al
</a>
<a class="btn-secondary" href="/tr/rezervasyon/index.html" style="color:#d4af37; text-decoration:underline; font-size:0.9rem;">veya Online Rezervasyon →</a>
</section>

<!-- İlgili Hizmetler -->
<section class="related-services">
<h2>İlgili Hizmetler</h2>
<ul>
<li><a href="/tr/masajlar/klasik-rahatlama.html">Klasik Masaj</a></li>
<li><a href="/tr/hamam/kese-kopuk.html">Hamam Kese & Köpük</a></li>
<li><a href="/tr/cilt-bakimi/index.html">Tüm Cilt Bakımları</a></li>
</ul>
</section>

</main>

<!-- FOOTER -->
<div id="footer-container"></div>

<!-- SCRIPTS -->
<script src="../../assets/js/app-core.js"></script>
<script defer src="../../assets/js/santis-nav.js"></script>
<script defer src="../../assets/js/app.js"></script>
</body>
</html>
'''


def main():
    files = sorted(glob.glob(os.path.join(TR_DIR, '*.html')))
    
    upgraded = 0
    skipped = 0
    
    for f in files:
        basename = os.path.basename(f).replace('.html', '')
        
        # Skip index page (category page, different structure)
        if basename == 'index':
            skipped += 1
            print(f'  SKIP: {basename} (index page)')
            continue
        
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
        
        # Extract data from existing page
        data = extract_data(content)
        
        # Get hero image
        hero_img = PAGE_IMAGES.get(basename, DEFAULT_HERO)
        
        # Build new page
        new_html = build_page(basename, data, hero_img)
        
        # Write
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(new_html)
        
        upgraded += 1
        print(f'  OK: {basename} -> {data["title"]} ({data["duration"]}dk) [img: {hero_img}]')
    
    print(f'\nDone: {upgraded} upgraded, {skipped} skipped')


if __name__ == '__main__':
    main()
