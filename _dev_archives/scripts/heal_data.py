import json
import os
import re

filepath = os.path.join("assets", "data", "services.json")

def slugify(text):
    tr_map = str.maketrans('ğüşıöçĞÜŞİÖÇ', 'gusiocGUSIOC')
    text = text.translate(tr_map).lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    return re.sub(r'[\s-]+', '-', text).strip('-')

with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

fixed_count = 0
for item in data:
    if not item.get('url') and not item.get('detailUrl'):
        cat = str(item.get('category', '') or item.get('categoryId', '')).lower()

        if any(k in cat for k in ['massage', 'masaj', 'relaxation', 'regional', 'premium', 'asian', 'sports', 'kids', 'couples', 'medical']):
            folder = 'masajlar'
        elif any(k in cat for k in ['hammam', 'hamam', 'ritual-hammam']):
            folder = 'hamam'
        elif any(k in cat for k in ['sothys', 'skincare', 'cilt', 'skin']):
            folder = 'cilt-bakimi'
        elif 'journey' in cat:
            folder = 'rituals'
        else:
            folder = 'hizmetler'

        base_name = item.get('title') or item.get('name') or item.get('slug') or 'iksir'
        slug = item.get('slug') or slugify(str(base_name))

        item['url'] = f"/tr/{folder}/{slug}.html"
        fixed_count += 1
        print(f"  🔧 [{item.get('id','?')}] → /tr/{folder}/{slug}.html")

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print(f"\n✅ Kuantum Yama Tamamlandı: {fixed_count} eksik URL onarıldı!")
print(f"📄 Toplam kayıt: {len(data)}")
