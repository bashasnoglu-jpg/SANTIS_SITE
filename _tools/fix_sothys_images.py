# -*- coding: utf-8 -*-
import json, os

path = r'c:\Users\tourg\Desktop\SANTIS_SITE\assets\data\services.json'
with open(path, 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

bad_imgs = ['sothys_sage_hero.jpg', 'sothys_hydra_cream.webp', 'sothys_gold_hero.jpg', 'sothys_slate_hero.jpg']

# Replacement map - assign working images to bad ones
REPLACE_MAP = {
    'sothys_sage_hero.jpg': 'santis_card_skincare_clay_v2.webp',
    'sothys_hydra_cream.webp': 'santis_card_hydration_lux.webp',
    'sothys_gold_hero.jpg': 'santis_card_skincare_detail_v2.webp',
    'sothys_slate_hero.jpg': 'santis_card_skincare_v1.webp',
}

fixed = 0
for s in data:
    cat = s.get('categoryId', '')
    if not cat.startswith('sothys'):
        continue
    
    slug = s.get('slug', '?')
    
    # Fix media.hero
    media = s.get('media') or {}
    hero = media.get('hero', '')
    if hero in REPLACE_MAP:
        old_hero = hero
        media['hero'] = REPLACE_MAP[hero]
        s['media'] = media
        print(f'  FIX hero: {slug} | {old_hero} -> {REPLACE_MAP[old_hero]}')
        fixed += 1
    
    # Fix img
    img = s.get('img', '')
    if img in REPLACE_MAP:
        old_img = img
        s['img'] = REPLACE_MAP[img]
        print(f'  FIX img:  {slug} | {old_img} -> {REPLACE_MAP[old_img]}')
        fixed += 1

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'\n{fixed} gorsel duzeltildi')
