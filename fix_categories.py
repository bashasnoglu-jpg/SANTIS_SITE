"""
services.json — Akıllı Kategori Düzelticisi
Slug ve title'dan kategori tespit eder.
"""
import json, shutil

SRC = 'assets/data/services.json'
BAK = 'assets/data/services.json.bak'
shutil.copy2(SRC, BAK)

d = json.load(open(SRC, encoding='utf-8'))

# ── Eşleşme Kuralları (slug ve title üzerinden) ──────────────────────────
RULES = {
    'massage': [
        'masaj', 'massage', 'shiatsu', 'refleksoloji', 'reflexzonen',
        'aromaterapi', 'aroma', 'thai', 'bali', 'hot-stone', 'sicak-tas',
        'bronz', 'bronze', 'spor', 'sport', 'derin-doku', 'deep-tissue',
        'anti-stress', 'kombinasyon', 'kombine', 'ganzkorp', 'klasik',
        'klassische', 'rucken', 'sirt', 'fuss', 'ayak', 'neuromuscular',
        'madero', 'kupa', 'cupping',
    ],
    'hammam': [
        'hamam', 'hammam', 'kese', 'kopuk', 'peeling', 'osmanli', 'osmanische',
        'bal-', 'honig', 'cikolata', 'schokolade', 'yosun', 'algen',
        'kahve', 'kaffee', 'meersalz', 'tuz-', 'bali-ritual', 'schaum',
    ],
    'skincare': [
        'cilt', 'skin', 'sothys', 'facial', 'yuz', 'gesicht', 'dermatoloji',
        'anti-aging', 'nemlendirme', 'moistur', 'akne', 'acne', 'peeling-cilt',
        'detox-cilt', 'serum', 'maske', 'mask', 'collagen', 'kolajen',
    ],
    'journey': [
        'journey', 'ritual', 'paket', 'package', 'full-day', 'tam-gun',
        'sovereign', 'vip', 'luxury-package', 'kombo-paket', 'half-day',
        'yari-gun', 'signature', 'imza', 'grand', 'wellness-journey',
    ],
}

def guess_category(item):
    slug  = (item.get('slug') or '').lower()
    title = (item.get('title') or item.get('name') or '').lower()
    haystack = slug + ' ' + title

    # Hamam önce kontrol et (peeling hem masaj hem hamam olabilir)
    for cat, keywords in RULES.items():
        for kw in keywords:
            if kw in haystack:
                return cat
    return 'massage'  # bilinmeyenler masaj varsayılanı

# ── Düzeltme ──────────────────────────────────────────────────────────────
stats = {'fixed': 0, 'already_ok': 0}
cat_counts = {}

for item in d:
    cat = (item.get('category') or '').strip()
    if not cat or cat == '?':
        new_cat = guess_category(item)
        item['category'] = new_cat
        stats['fixed'] += 1
    else:
        stats['already_ok'] += 1

    cat_counts[item['category']] = cat_counts.get(item['category'], 0) + 1

# ── Kaydet ────────────────────────────────────────────────────────────────
json.dump(d, open(SRC, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

print(f"✅ Toplam: {len(d)}  Düzeltilen: {stats['fixed']}  Zaten OK: {stats['already_ok']}")
print("\nYeni Dağılım:")
for k, v in sorted(cat_counts.items(), key=lambda x: -x[1]):
    print(f"  {v:3d}  {k}")
