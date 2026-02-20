# -*- coding: utf-8 -*-
"""
services.json'daki 20 skincare kartına detailUrl alanı ekler.
Böylece createCardElement() statik sayfalara yönlendirebilir.
"""
import json

path = r'c:\Users\tourg\Desktop\SANTIS_SITE\assets\data\services.json'
with open(path, 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

updated = 0
for s in data:
    cat = s.get('categoryId', '')
    slug = s.get('slug', '')
    
    # Only add detailUrl for our 20 skincare cards
    if cat.startswith('skincare-') and slug:
        s['detailUrl'] = '/tr/cilt-bakimi/' + slug + '.html'
        updated += 1
        print(f'  {slug} -> /tr/cilt-bakimi/{slug}.html')

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'\n{updated} detailUrl eklendi')
