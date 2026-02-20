# -*- coding: utf-8 -*-
import os, re

root = r'c:\Users\tourg\Desktop\SANTIS_SITE'
tr_dir = os.path.join(root, 'tr', 'cilt-bakimi')

files = sorted([f for f in os.listdir(tr_dir) if f.endswith('.html') and f != 'index.html'])

print(f'Toplam sayfa: {len(files)}')
print()

results = []

for f in files:
    path = os.path.join(tr_dir, f)
    with open(path, 'r', encoding='utf-8') as fh:
        c = fh.read()
    
    bn = f.replace('.html','')
    sz = os.path.getsize(path)
    lines = c.count('\n') + 1
    
    title_m = re.search(r'<title>(.*?)\|', c)
    title = title_m.group(1).strip() if title_m else '?'
    
    desc_m = re.search(r'<meta content="(.*?)" name="description"', c)
    desc = desc_m.group(1).strip() if desc_m else ''
    
    hero_m = re.search(r'src="../../assets/img/cards/([^"]+)"', c)
    hero = hero_m.group(1) if hero_m else 'YOK'
    hero_path = os.path.join(root, 'assets', 'img', 'cards', hero) if hero != 'YOK' else ''
    hero_exists = os.path.exists(hero_path) if hero_path else False
    
    all_li = re.findall(r'<li>([^<]+)</li>', c)
    benefits = [b for b in all_li if b.strip() and 'ANA SAYFA' not in b and 'Klasik Masaj' not in b and 'Hamam' not in b and 'Cilt Bakim' not in b]
    
    steps = len(re.findall(r'<li><strong>', c))
    
    dur_m = re.search(r'(\d+)\s*dk', c)
    dur = dur_m.group(1) if dur_m else '?'
    
    price_m = re.search(r'"price":\s*"(\d+)"', c)
    price = price_m.group(1) if price_m else '?'
    
    has_navbar = 'navbar-container' in c
    has_footer = 'footer-container' in c
    has_wa = 'wa.me' in c
    has_ed = 'editorial.css' in c
    has_canon = 'rel="canonical"' in c
    has_og = 'og:title' in c
    has_schema = 'application/ld+json' in c
    has_href = 'hreflang' in c
    
    intro_m = re.search(r'<section class="service-intro">\s*<p>(.*?)</p>', c, re.DOTALL)
    intro_len = len(intro_m.group(1)) if intro_m else 0
    
    checks = [has_navbar, has_footer, has_wa, has_ed, hero_exists]
    status = 'OK' if all(checks) else 'WARN'
    
    r = {
        'file': bn, 'title': title, 'desc': desc, 'dur': dur, 'price': price,
        'hero': hero, 'hero_ok': hero_exists, 'intro_len': intro_len,
        'benefits': len(benefits), 'steps': steps, 'sz': sz, 'lines': lines,
        'navbar': has_navbar, 'footer': has_footer, 'wa': has_wa,
        'editorial': has_ed, 'canon': has_canon, 'og': has_og,
        'schema': has_schema, 'hreflang': has_href, 'status': status
    }
    results.append(r)
    
    print(f'{bn}.html [{status}]')
    print(f'  {title} | {dur}dk | {price}EUR')
    print(f'  Hero: {hero} [{"OK" if hero_exists else "404"}]')
    print(f'  Intro: {intro_len}ch | Faydalar: {len(benefits)} | Adimlar: {steps}')
    print(f'  Nav:{has_navbar} Ft:{has_footer} WA:{has_wa} Ed:{has_ed} Cn:{has_canon} OG:{has_og} Sch:{has_schema}')
    print()

# Summary
ok = sum(1 for r in results if r['status'] == 'OK')
warn = sum(1 for r in results if r['status'] == 'WARN')
avg_intro = sum(r['intro_len'] for r in results) // len(results)
avg_benefits = sum(r['benefits'] for r in results) // len(results)
no_hero = sum(1 for r in results if not r['hero_ok'])

print('=== OZET ===')
print(f'  OK: {ok} | WARN: {warn}')
print(f'  Hero 404: {no_hero}')
print(f'  Ort. intro: {avg_intro} karakter')
print(f'  Ort. fayda: {avg_benefits} madde')
