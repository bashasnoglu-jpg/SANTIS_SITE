import json
import os

# Dosya yolları
JSON_PATH = os.path.join(os.path.dirname(__file__), '..', 'assets', 'data', 'services.json')

# 1. TEMİZLENECEK SAFRA ID'LER (Önceki betiğin ürettiği kopyalar)
SAFRALAR = [
    "mass-deeptissue", 
    "mass-hotstone", 
    "mass-deep-local", 
    "mass-lymphatic", 
    "mass-combine-90", 
    "mass-mix-manuel",
    "mass-cellulite"
]

# 2. KUSURSUZ EŞLEŞTİRME SÖZLÜĞÜ (Orijinal Sistem ID -> Yeni Lüks Veri)
KUSURSUZ_HEDEFLEME = {
    "extra-local-deep": {"name": "Local Deep Tissue (30')", "price_eur": 55, "duration": 30},
    "extra-hotstone": {"name": "Hot Stone Massage (50')", "price_eur": 90, "duration": 50},
    "extra-deep": {"name": "Deep Tissue Massage (50')", "price_eur": 90, "duration": 50},
    "extra-lymph": {"name": "Lymphatic Drainage (50')", "price_eur": 90, "duration": 50},
    "extra-combined": {"name": "Combination Massage (50')", "price_eur": 100, "duration": 50},
    "extra-combo-ganz": {"name": "Combination Massage (90')", "price_eur": 130, "duration": 90},
    "extra-mix-manuel": {"name": "Mix Manuel Therapy (90')", "price_eur": 180, "duration": 90},
    "mass-anticellulite": {"name": "Anti Cellulite Massage", "price_eur": 90, "duration": 50}
}

def cerrahi_mudahale():
    print("[SANTIS OS] V2 Fixer Engine Başlatılıyor...")
    
    try:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"HATA: {JSON_PATH} bulunamadı.")
        return

    temizlenen_safra_sayisi = 0
    guncellenen_orijinal_sayisi = 0
    yeni_liste = []

    # Orijinal services.json Flat Array (Düz Liste) formatındadır.
    if isinstance(data, list):
        for hizmet in data:
            mevcut_id = hizmet.get("id")
            
            # ADIM 1: Safra Temizliği
            if mevcut_id in SAFRALAR:
                temizlenen_safra_sayisi += 1
                print(f"[-] SAFRA TEMİZLENDİ / SİLİNDİ: {mevcut_id}")
                continue # Listeye ekleme, dolayısıyla silinmiş olacak.
            
            # ADIM 2: Kusursuz Güncelleme
            if mevcut_id in KUSURSUZ_HEDEFLEME:
                yeni_veriler = KUSURSUZ_HEDEFLEME[mevcut_id]
                hizmet["name"] = yeni_veriler["name"]
                hizmet["price_eur"] = yeni_veriler["price_eur"]
                if "price" in hizmet:
                    hizmet["price"]["amount"] = yeni_veriler["price_eur"]
                if "duration" in yeni_veriler:
                    hizmet["duration"] = yeni_veriler["duration"]
                
                # Content Localizations
                if "content" not in hizmet: hizmet["content"] = {}
                if "en" not in hizmet["content"]: hizmet["content"]["en"] = {}
                if "tr" not in hizmet["content"]: hizmet["content"]["tr"] = {}
                
                hizmet["content"]["en"]["title"] = yeni_veriler["name"]

                guncellenen_orijinal_sayisi += 1
                print(f"[+] ORİJİNAL KİMLİK GÜNCELLENDİ (UI KORUNDU): {mevcut_id} -> {yeni_veriler['name']} ({yeni_veriler['price_eur']}€)")
            
            yeni_liste.append(hizmet)
            
        data = yeni_liste
    else:
        print("HATA: JSON formatı list array değil. Sistemin mimarisiyle uyuşmuyor.")
        return

    # ADIM 3: Kaydet
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("\n[SANTIS OS] OPERASYON KUSURSUZCA TAMAMLANDI.")
    print(f"Toplam Silinen Safra (Kopya): {temizlenen_safra_sayisi}")
    print(f"Toplam Kurtarılan & Güncellenen Orijinal Kart: {guncellenen_orijinal_sayisi}")
    print("Sistem UI zırhı %100 güvenlidir. 🍷")

if __name__ == "__main__":
    cerrahi_mudahale()
