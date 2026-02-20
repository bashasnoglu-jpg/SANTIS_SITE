# -*- coding: utf-8 -*-
import os, re

root = r'c:\Users\tourg\Desktop\SANTIS_SITE'

# 1. Compare TR vs EN skincare file names
tr_slugs = sorted([f.replace('.html','') for f in os.listdir(os.path.join(root,'tr','cilt-bakimi')) if f.endswith('.html')])
en_slugs = sorted([f.replace('.html','') for f in os.listdir(os.path.join(root,'en','skincare')) if f.endswith('.html')])

print('=== TR vs EN DOSYA KARSILASTIRMASI ===')
print(f'TR: {len(tr_slugs)} | EN: {len(en_slugs)}')

# Only in TR
only_tr = set(tr_slugs) - set(en_slugs)
only_en = set(en_slugs) - set(tr_slugs)
both = set(tr_slugs) & set(en_slugs)

print(f'Ortak: {len(both)}')
if only_tr:
    print(f'Sadece TR ({len(only_tr)}): {sorted(only_tr)}')
if only_en:
    print(f'Sadece EN ({len(only_en)}): {sorted(only_en)}')

# 2. Check EN pages structure (are they updated or old?)
print()
print('=== EN SAYFA YAPISI ===')
en_dir = os.path.join(root, 'en', 'skincare')
for slug in sorted(en_slugs)[:3]:
    path = os.path.join(en_dir, slug + '.html')
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    has_nav = 'navbar-container' in c
    has_foot = 'footer-container' in c
    has_hero = 'svc-detail-hero' in c
    has_wa = 'wa.me' in c
    has_ed = 'editorial.css' in c
    lines = c.count('\n') + 1
    sz = os.path.getsize(path)
    print(f'  {slug}: {sz/1024:.1f}KB {lines}L | Nav:{has_nav} Ft:{has_foot} Hero:{has_hero} WA:{has_wa} Ed:{has_ed}')

# 3. Index page analysis - which services link to static vs dynamic  
print()
print('=== INDEX SAYFA LINK ANALIZI ===')
idx_path = os.path.join(root, 'tr', 'cilt-bakimi', 'index.html')
with open(idx_path, 'r', encoding='utf-8') as f:
    idx = f.read()

# Schema.org ItemList slugs
schema_slugs = re.findall(r'"url":\s*"https://santis\.club/tr/cilt-bakimi/([^"]+)\.html"', idx)
print(f'Schema.org ItemList: {len(schema_slugs)} slug')

# "Tüm Hizmetlerimiz" section slugs
tum_section = idx[idx.find('Tüm Hizmetlerimiz'):idx.find('</section>', idx.find('Tüm Hizmetlerimiz'))]
tum_slugs = re.findall(r'href="/tr/cilt-bakimi/([^"]+)\.html"', tum_section)
print(f'Tum Hizmetlerimiz linkleri: {len(tum_slugs)} slug')

# Compare with actual files
actual_slugs = [s for s in tr_slugs if s != 'index']
in_schema_not_file = set(schema_slugs) - set(actual_slugs) 
in_file_not_schema = set(actual_slugs) - set(schema_slugs)
in_tum_not_file = set(tum_slugs) - set(actual_slugs)
in_file_not_tum = set(actual_slugs) - set(tum_slugs)

if in_schema_not_file:
    print(f'Schema da var ama dosya YOK: {sorted(in_schema_not_file)}')
if in_file_not_schema:
    print(f'Dosya var ama Schema da YOK: {sorted(in_file_not_schema)}')
if in_tum_not_file:
    print(f'Tum listede var ama dosya YOK: {sorted(in_tum_not_file)}')
if in_file_not_tum:
    print(f'Dosya var ama Tum listede YOK: {sorted(in_file_not_tum)}')

# 4. Content quality deep dive - are benefits truly generic?
print()
print('=== ICERIK KALITESI DETAY ===')
benefit_sets = {}
step_sets = {}
intro_starts = {}

for slug in actual_slugs:
    path = os.path.join(root, 'tr', 'cilt-bakimi', slug + '.html')
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    
    # Extract benefits
    ben_section = re.search(r'<section class="service-benefits">.*?</section>', c, re.DOTALL)
    if ben_section:
        bens = re.findall(r'<li>([^<]+)</li>', ben_section.group())
        key = '|'.join(bens)
        if key not in benefit_sets:
            benefit_sets[key] = []
        benefit_sets[key].append(slug)
    
    # Extract steps
    step_section = re.search(r'<ol class="service-steps">.*?</ol>', c, re.DOTALL)
    if step_section:
        stps = re.findall(r'<strong>(.*?)</strong>', step_section.group())
        key = '|'.join(stps)
        if key not in step_sets:
            step_sets[key] = []
        step_sets[key].append(slug)
    
    # Check intro uniqueness (first 50 chars)
    intro_m = re.search(r'<section class="service-intro">\s*<p>(.*?)</p>', c, re.DOTALL)
    if intro_m:
        start = intro_m.group(1)[:50]
        if start not in intro_starts:
            intro_starts[start] = []
        intro_starts[start].append(slug)

print(f'Benzersiz fayda seti: {len(benefit_sets)} adet')
for key, slugs in benefit_sets.items():
    items = key.split('|')
    print(f'  [{len(slugs)} sayfa] -> {items[:2]}...')
    if len(slugs) <= 5:
        print(f'    Sayfalar: {slugs}')

print(f'\nBenzersiz adim seti: {len(step_sets)} adet')
for key, slugs in step_sets.items():
    items = key.split('|')
    print(f'  [{len(slugs)} sayfa] -> {items}')

print(f'\nBenzersiz intro: {len(intro_starts)} adet')
for start, slugs in intro_starts.items():
    print(f'  [{len(slugs)} sayfa] "{start}..."')
