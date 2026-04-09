import json
import os
import re

# ==============================================================
# SOVEREIGN OS - MENU MAPPING ENGINE (Phase 50)
# ==============================================================
# "0 Kod Değişimi, 100% Veritabanı Mühürlemesi" kuralı ile çalışır.
# Mevcut JSON yapısını ve ID'leri bozmadan sadece name, price_eur ve content objesini günceller.

JSON_PATH = os.path.join(os.path.dirname(__file__), '..', 'assets', 'data', 'services.json')
REPORT_PATH = os.path.join(os.path.dirname(__file__), '..', 'reports', 'menu_update_report.json')

# 1. YENİ BİRİNCİL FİYAT LİSTESİ (THE SOURCE OF TRUTH)
# ID tabanlı sözlük (Controlled Mapping)
MASTER_DICT = {
    # == TURKISH BATH PROGRAM ==
    "hamam-peeling-schaum": {"name": "Peeling and Foam Massage", "duration": 30, "price_eur": 45},
    "hamam-schaum": {"name": "Foam Massage", "duration": 30, "price_eur": 45},
    "hamam-kaffee": {"name": "Coffee Peeling and Foam", "duration": 30, "price_eur": 50}, # Eski "Kaffee Peeling"
    "hamam-meersalz": {"name": "Sea Salt Peeling and Foam", "duration": 30, "price_eur": 50}, # Eski "Meersalz Peeling"
    "hamam-honig": {"name": "Honey and Foam Massage", "duration": 30, "price_eur": 55}, # Eski "Honig Ritual"
    "hamam-schokolade": {"name": "Chocolate and Foam Massage", "duration": 30, "price_eur": 55}, # Eski "Schokolade Ritual"
    "hamam-algen": {"name": "Algen and Foam Massage", "duration": 30, "price_eur": 55}, # Eski "Algen Ritual"
    "hamam-osmanische": {"name": "Ottoman Hamam Tradition", "duration": 50, "price_eur": 90},

    # == CLASSIC MASSAGES ==
    "mass-classic-ganz": {"name": "Classic Massage", "duration": 30, "price_eur": 50}, # 30dk versiyonu
    "mass-fuss": {"name": "Feet Reflex Zone Massage", "duration": 30, "price_eur": 50},
    "mass-classic-50": {"name": "Classic Massage", "duration": 50, "price_eur": 80}, # 50dk versiyonu
    "mass-antistress": {"name": "Anti-Stress Massage", "duration": 50, "price_eur": 80},
    "mass-aroma": {"name": "Aroma Massage", "duration": 50, "price_eur": 80},
    "mass-bronze": {"name": "Bronze Massage", "duration": 50, "price_eur": 80},
    "mass-sport": {"name": "Sport Massage", "duration": 50, "price_eur": 90}, # "mass-sport" id'si yoksa "append candidate" olacak
    "mass-cellulite": {"name": "Anti Cellulite Massage", "duration": 50, "price_eur": 90},

    # == ASIAN MASSAGES ==
    "mass-thai-reflex": {"name": "Thai Reflexology Massage", "duration": 30, "price_eur": 55},
    "mass-indian": {"name": "Indian Head Massage", "duration": 30, "price_eur": 55},
    "mass-bali": {"name": "Bali Massage", "duration": 50, "price_eur": 90},
    "mass-bali-aroma": {"name": "Bali Aroma Massage", "duration": 50, "price_eur": 90},
    "mass-thai": {"name": "Traditional Thai Massage", "duration": 50, "price_eur": 100},
    "mass-ayurveda": {"name": "Ayurveda Massage", "duration": 50, "price_eur": 90},
    "mass-shiatsu": {"name": "Shiatsu", "duration": 50, "price_eur": 100},
    "mass-mandara": {"name": "Mandara Massage (4 Hand)", "duration": 50, "price_eur": 150},

    # == EXTRA & EFFECTIVE ==
    "mass-deep-local": {"name": "Local Deep Tissue", "duration": 30, "price_eur": 55},
    "mass-hotstone": {"name": "Hot Stone Massage", "duration": 50, "price_eur": 90},
    "mass-deeptissue": {"name": "Deep Tissue Massage", "duration": 50, "price_eur": 90},
    "mass-lymphatic": {"name": "Lymphatic Drainage", "duration": 50, "price_eur": 90},
    "kombine-masaj": {"name": "Combination Massage", "duration": 50, "price_eur": 100},
    "mass-combine-90": {"name": "Combination Massage", "duration": 90, "price_eur": 130},
    "mass-mix-manuel": {"name": "Mix Manuel Therapy", "duration": 90, "price_eur": 180},
    
    # == FACE CARE ==
    "face-vitamin-30": {"name": "Vitamin Mask", "duration": 30, "price_eur": 50},
    "face-moist-30": {"name": "Moisturizing Mask", "duration": 30, "price_eur": 50},
    "face-firm-30": {"name": "Face Firming Mask", "duration": 30, "price_eur": 50},
    "face-renewal-30": {"name": "Renewal (Collagen) Mask", "duration": 30, "price_eur": 50},
    "face-vitamin-50": {"name": "Vitamin Care", "duration": 50, "price_eur": 80},
    "face-eye-50": {"name": "Eye Care", "duration": 50, "price_eur": 80},
    "face-classic": {"name": "Classic Face Care", "duration": 50, "price_eur": 80},
    "face-g5": {"name": "G5", "duration": 50, "price_eur": 95},
    "face-eye-active": {"name": "Eye Care Active Couture", "duration": 50, "price_eur": 80},
    "face-collagen": {"name": "Collagen Treatment", "duration": 50, "price_eur": 95},
    "face-moisture": {"name": "Moisture Treatment", "duration": 50, "price_eur": 95},
    "face-extramoist": {"name": "Extra Moisture Treatment", "duration": 90, "price_eur": 110},
    "face-repair": {"name": "Skin Repair Care", "duration": 90, "price_eur": 130},
    "face-ultrafirm": {"name": "Ultra Firming Treatment", "duration": 90, "price_eur": 130},
    "face-couperose": {"name": "Couperose Treatment", "duration": 90, "price_eur": 130},
    "face-acne": {"name": "Oily and Acne Skin Care", "duration": 90, "price_eur": 150},
    "face-antiaging-wrinkle": {"name": "Anti-Aging (Wrinkles)", "duration": 90, "price_eur": 160},
    "face-antiaging-spots": {"name": "Anti-Aging (Age Spots)", "duration": 90, "price_eur": 160},
    "face-deluxe": {"name": "Deluxe Care", "duration": 90, "price_eur": 170},

    # == SPA PROGRAMS ==
    "prog-childcare": {"name": "CHILD CARE PROGRAM", "duration": 75, "price_eur": 80, "categoryId": "programs", "tags": ["PROGRAM"]},
    "prog-relax": {"name": "RELAX PROGRAM", "duration": 95, "price_eur": 100, "categoryId": "programs", "tags": ["PROGRAM"]},
    "prog-medical": {"name": "MEDICAL PROGRAM", "duration": 95, "price_eur": 115, "categoryId": "programs", "tags": ["PROGRAM"]},
    "prog-bronze": {"name": "BRONZE PROGRAM", "duration": 95, "price_eur": 105, "categoryId": "programs", "tags": ["PROGRAM"]},
    "prog-delux": {"name": "DELUX PROGRAM", "duration": 115, "price_eur": 175, "categoryId": "programs", "tags": ["PROGRAM"]},
}

def execute_mapping():
    print("🦅 [Sovereign Dictionary Engine] Starting JSON Schema Mapping...")
    
    if not os.path.exists(JSON_PATH):
        print(f"🚨 HATA: {JSON_PATH} bulunamadı!")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        services = json.load(f)

    # Dictionary Map Reports
    matched_ids = set()
    updated_records = 0
    unmatched_in_dict = set(MASTER_DICT.keys()) # Bunlar "Append Candidates" (Yeni Eklenecekler) olacak
    deprecated_records = [] # Eski JSON'da olup yeni broşürde olmayanlar.

    def process_service(srv):
        nonlocal updated_records
        sid = srv.get("id")
        
        # Olası fuzzy ID match'leri yakala. Örneğin "mass-sport" json'da "mass-sport-50" ise.
        match_key = None
        if sid in MASTER_DICT:
            match_key = sid
        else:
            # Fuzzy fallback
            for mk in MASTER_DICT.keys():
                if mk in sid or sid in mk:
                    match_key = mk
                    break
                    
        if match_key:
            new_data = MASTER_DICT[match_key]
            # Schema Güncellemesi
            srv["name"] = new_data["name"]
            srv["duration"] = new_data["duration"]
            srv["price_eur"] = new_data["price_eur"]
            if "price" in srv: 
                srv["price"]["amount"] = new_data["price_eur"]
            
            # İçerik Localization Güncellemesi (UI Title'ı besleyen asıl yer)
            if "content" not in srv: srv["content"] = {}
            if "en" not in srv["content"]: srv["content"]["en"] = {}
            if "tr" not in srv["content"]: srv["content"]["tr"] = {}
            
            # Görünen ismi mühürle
            srv["content"]["en"]["title"] = new_data["name"]
            
            if "categoryId" in new_data:
                srv["categoryId"] = new_data["categoryId"]
            if "tags" in new_data:
                srv["tags"] = new_data["tags"]

            matched_ids.add(match_key)
            if match_key in unmatched_in_dict:
                unmatched_in_dict.remove(match_key)
            updated_records += 1
            print(f"  [✓] MATCHED [{sid}]: {new_data['name']} -> {new_data['price_eur']}€")
        else:
            deprecated_records.append(f"{sid} ({srv.get('name')})")
            print(f"  [!] DEPRECATED [{sid}]: Bulunamadı.")

    # JSON yapısı gereği Array of Objects ya da Array of Categories olabilir.
    if isinstance(services, list):
        for item in services:
            if "services" in item: # Kategori bazlıysa
                for subitem in item["services"]:
                    process_service(subitem)
            else: # Direkt hizmet objesiyse
                process_service(item)

    # 4. YENİ KARTLAR İÇİN OTOMATİK SCHEMA OLUŞTURMA (Append Candidates)
    append_candidates = []
    for uid in unmatched_in_dict:
        data = MASTER_DICT[uid]
        # Schema-Complete Factory
        new_card = {
            "id": uid,
            "categoryId": data.get("categoryId", "massage-extra"),
            "name": data["name"],
            "slug": re.sub(r'[^a-z0-9]+', '-', data["name"].lower()).strip('-'),
            "duration": data["duration"],
            "price_eur": data["price_eur"],
            "price": {"amount": data["price_eur"], "currency": "€"},
            "tags": data.get("tags", []),
            "image": "/assets/img/cards/santis_card_massage_v1.webp",
            "content": {"en": {"title": data["name"]}, "tr": {"title": data["name"]}}
        }
        append_candidates.append(new_card)
        if isinstance(services, list) and not "services" in services[0]:
            services.append(new_card)

    # 5. DOSYAYI KAYDET
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(services, f, ensure_ascii=False, indent=2)

    # 6. REPORT OLUŞTUR (Gözle kontrol için)
    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    report = {
        "total_updated": updated_records,
        "newly_created": len(append_candidates),
        "deprecated_count": len(deprecated_records),
        "deprecated_items": deprecated_records,
        "created_items": [c["name"] for c in append_candidates]
    }
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
        
    print("\n==========================================")
    print("✅ JSON MAPPING ENGINE BAŞARIYLA TAMAMLANDI")
    print(f"  - Güncellenen Kartlar: {updated_records}")
    print(f"  - Yeni Eklenen Kartlar: {len(append_candidates)}")
    print(f"  - Silinmesi Düşünülen/Eski Kartlar: {len(deprecated_records)}")
    print(f"  - Detaylı Rapor: {REPORT_PATH}")
    print("==========================================\n")

if __name__ == "__main__":
    execute_mapping()
