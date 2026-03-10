"""
Services.json — Image & Price Healer v2
Tüm kayıtlara kategori bazlı varsayılan image ve fiyat ekler.
Çalıştır: python heal_images_prices.py
"""
import json, os

ROOT = os.path.dirname(os.path.abspath(__file__))
SVC  = os.path.join(ROOT, 'assets', 'data', 'services.json')

# Kategori → default görsel haritası
IMAGE_MAP = {
    'ritual-hammam':       '/assets/img/cards/santis_card_hammam_lux.webp',
    'massage':             '/assets/img/cards/santis_card_massage_lux.webp',
    'massage-asian':       '/assets/img/cards/santis_card_massage_asian.webp',
    'massage-couples':     '/assets/img/cards/santis_card_massage_couples.webp',
    'massage-kids':        '/assets/img/cards/santis_card_massage_kids.webp',
    'massage-medical':     '/assets/img/cards/santis_card_massage_medical.webp',
    'massage-premium':     '/assets/img/cards/santis_card_massage_premium.webp',
    'massage-regional':    '/assets/img/cards/santis_card_massage_lux.webp',
    'massage-relaxation':  '/assets/img/cards/santis_card_massage_lux.webp',
    'massage-sports':      '/assets/img/cards/santis_card_massage_sports.webp',
    'skincare-advanced':   '/assets/img/cards/santis_card_skin_advanced.webp',
    'skincare-antiage':    '/assets/img/cards/santis_card_skin_antiage.webp',
    'skincare-basic':      '/assets/img/cards/santis_card_skin_basic.webp',
    'skincare-hydra':      '/assets/img/cards/santis_card_skin_hydra.webp',
    'skincare-purify':     '/assets/img/cards/santis_card_skin_purify.webp',
    'skincare-ritual':     '/assets/img/cards/santis_card_skin_ritual.webp',
    'skincare-special':    '/assets/img/cards/santis_card_skin_special.webp',
    'sothys-antiage':      '/assets/img/cards/santis_card_sothys_antiage.webp',
    'sothys-hydra':        '/assets/img/cards/santis_card_sothys_hydra.webp',
    'sothys-men':          '/assets/img/cards/santis_card_sothys_men.webp',
    'sothys-purifying':    '/assets/img/cards/santis_card_sothys_purifying.webp',
    'journey':             '/assets/img/cards/santis_card_journey_vip.webp',
}
DEFAULT_IMAGE = '/assets/img/cards/santis_card_massage_lux.webp'

# Kategori → default fiyat (EUR)
PRICE_MAP = {
    'ritual-hammam':      45,
    'massage':            60,
    'massage-asian':      75,
    'massage-couples':    110,
    'massage-kids':       40,
    'massage-medical':    70,
    'massage-premium':    90,
    'massage-regional':   65,
    'massage-relaxation': 60,
    'massage-sports':     70,
    'skincare-advanced':  85,
    'skincare-antiage':   95,
    'skincare-basic':     55,
    'skincare-hydra':     65,
    'skincare-purify':    65,
    'skincare-ritual':    80,
    'skincare-special':   75,
    'sothys-antiage':     105,
    'sothys-hydra':       85,
    'sothys-men':         80,
    'sothys-purifying':   80,
    'journey':            180,
}
DEFAULT_PRICE = 60

data = json.load(open(SVC, encoding='utf-8'))
img_fixed = price_fixed = 0

for item in data:
    cat = (item.get('category') or item.get('categoryId') or '').lower().strip()

    # Image
    if not item.get('image', '').strip():
        item['image'] = IMAGE_MAP.get(cat, DEFAULT_IMAGE)
        img_fixed += 1

    # Price
    try:
        price = float(item.get('price_eur', 0) or 0)
    except (ValueError, TypeError):
        price = 0
    if price <= 0:
        item['price_eur'] = PRICE_MAP.get(cat, DEFAULT_PRICE)
        price_fixed += 1

json.dump(data, open(SVC, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(f"✅ image düzeltildi: {img_fixed}")
print(f"✅ price_eur eklendi: {price_fixed}")
print(f"🦅 services.json güncellendi — toplam {len(data)} kayıt")
