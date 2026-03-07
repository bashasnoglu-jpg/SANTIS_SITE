"""
services.json'daki massage categoryId'lerini
7 yeni kültürel kategoriye günceller.
"""
import json

JSON_PATH = r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\data\services.json"

# ID → Yeni Kategori mapping
REMAP = {
    # 1. Klasik Rahatlama
    "mass-classic-ganz":   "massage-relaxation",     # Klasik Tüm Vücut
    "mass-classic-50":     "massage-relaxation",     # Klasik Masaj 50dk
    "mass-antistress":     "massage-relaxation",     # Anti-Stress
    "mass-aroma":          "massage-relaxation",     # Aromaterapi
    "mass-klasik-rahatlama": "massage-relaxation",   # Klasik Rahatlama (if exists)
    
    # 2. Spor & Derin Doku
    "mass-sport":          "massage-sports",         # Spor Masajı
    "extra-deep":          "massage-sports",         # Derin Doku 50dk
    "mass-tetik-nokta":    "massage-sports",         # Tetik Nokta
    "mass-myofascial-release": "massage-sports",     # Miyofasyal
    
    # 3. Asya Terapileri
    "mass-thai":           "massage-asian",          # Thai
    "mass-bali":           "massage-asian",          # Bali
    "mass-shiatsu":        "massage-asian",          # Shiatsu
    
    # 4. Medikal & Terapötik
    "mass-kranyo-sakral":  "massage-medical",        # Kraniyo-Sakral
    "extra-lymph":         "massage-medical",        # Lenf Drenaj
    "mass-anticellulite":  "massage-medical",        # Anti-Selülit
    "extra-manual":        "massage-medical",        # Manuel Terapi
    
    # 5. Bölgesel Terapiler
    "mass-bas-boyun-omuz": "massage-regional",       # Baş-Boyun-Omuz
    "mass-sirt-terapi":    "massage-regional",       # Sırt Terapi
    "mass-rucken":         "massage-regional",       # Klasik Sırt
    "mass-fuss":           "massage-regional",       # Ayak Refleksoloji
    "extra-local-deep":    "massage-regional",       # Lokal Derin Doku
    "extra-local-hotstone":"massage-regional",       # Lokal Sıcak Taş
    
    # 6. Premium Ritüeller
    "mass-signature-rituel":"massage-premium",       # Signature Ritüel
    "extra-hotstone":      "massage-premium",        # Sıcak Taş 50dk
    "mass-bronze":         "massage-premium",        # Bronz Masajı
    "extra-combined":      "massage-premium",        # Kombine 50dk
    "extra-combo-ganz":    "massage-premium",        # Kombine 90dk
    "extra-mix-manuel":    "massage-premium",        # Mix Manuel
    
    # 7. Çift & Aile
    "mass-cift-rituel":    "massage-couples",        # Çift Ritüel
    "mass-cift-senkron":   "massage-couples",        # Çift Senkron
    "mass-anne-cocuk":     "massage-couples",        # Anne-Çocuk
    "mass-kids-nazik":     "massage-couples",        # Kids
}

with open(JSON_PATH, "r", encoding="utf-8") as f:
    services = json.load(f)

updated = 0
for svc in services:
    sid = svc["id"]
    if sid in REMAP:
        old_cat = svc["categoryId"]
        new_cat = REMAP[sid]
        if old_cat != new_cat:
            svc["categoryId"] = new_cat
            print(f"  ✓ {sid}: {old_cat} → {new_cat}")
            updated += 1
        else:
            print(f"  = {sid}: zaten {new_cat}")

with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(services, f, ensure_ascii=False, indent=4)

print(f"\n✅ {updated} hizmet güncellendi.")

# Doğrulama
cats = {}
for svc in services:
    if svc["categoryId"].startswith("massage"):
        cat = svc["categoryId"]
        cats.setdefault(cat, []).append(svc.get("content", {}).get("tr", {}).get("title", svc.get("name", svc["id"])))

print("\n=== YENİ KATEGORİ DAĞILIMI ===")
for cat, items in sorted(cats.items()):
    print(f"\n[{cat}] ({len(items)} adet)")
    for item in items:
        print(f"  - {item}")
