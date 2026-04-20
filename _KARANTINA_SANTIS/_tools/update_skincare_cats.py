# -*- coding: utf-8 -*-
"""
services.json'daki 20 yeni skincare kartının categoryId'lerini
kullanıcının onayladığı alt kategorilere günceller.
"""
import json

JSON_PATH = r'c:\Users\tourg\Desktop\SANTIS_SITE\assets\data\services.json'

# Onaylanan alt kategoriler
CAT_MAP = {
    # skincare-basic: Temel Bakım
    'classic-facial': 'skincare-basic',
    'eye-contour': 'skincare-basic',
    'lip-care': 'skincare-basic',
    'sensitive-soothe': 'skincare-basic',

    # skincare-antiage: Anti-Aging
    'anti-aging-pro': 'skincare-antiage',
    'collagen-lift': 'skincare-antiage',
    'led-rejuvenation': 'skincare-antiage',
    'brightening-spot': 'skincare-antiage',

    # skincare-purify: Arındırma
    'acne-balance': 'skincare-purify',
    'detox-charcoal': 'skincare-purify',
    'deep-cleanse': 'skincare-purify',
    'enzyme-peel': 'skincare-purify',

    # skincare-hydra: Nemlendirme
    'hyaluron-hydrate': 'skincare-hydra',
    'barrier-repair': 'skincare-hydra',
    'glass-skin': 'skincare-hydra',
    'oxygen-boost': 'skincare-hydra',

    # skincare-special: Özel
    'gold-mask-ritual': 'skincare-special',
    'micro-polish': 'skincare-special',
    'men-facial': 'skincare-special',
    'vitamin-c-glow': 'skincare-special',
}

with open(JSON_PATH, 'r', encoding='utf-8-sig') as f:
    services = json.load(f)

updated = 0
for s in services:
    slug = s.get('slug', '')
    if slug in CAT_MAP:
        old_cat = s.get('categoryId', '?')
        new_cat = CAT_MAP[slug]
        s['categoryId'] = new_cat
        updated += 1
        print(f'  {slug}: {old_cat} -> {new_cat}')

with open(JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(services, f, ensure_ascii=False, indent=2)

# Summary
print(f'\n{updated} kart guncellendi')

# Count per category
cats = {}
for s in services:
    c = s.get('categoryId', '?')
    if 'skin' in c or 'sothys' in c:
        cats[c] = cats.get(c, 0) + 1

print('\nCilt bakimi kategorileri:')
for c in sorted(cats):
    print(f'  {c}: {cats[c]} kart')
