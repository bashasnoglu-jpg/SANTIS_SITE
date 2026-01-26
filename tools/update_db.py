import json
import os

# New Sothys Data from _PROMPT_WORKBENCH.json
sothys_raw = [
    {
        "id": 401,
        "cat": "skincare",
        "time": 30,
        "price": 0,
        "name": {
            "tr": "Sothys Organics® Işıltı Bakımı",
            "en": "Sothys Organics® Organic Certified Radiance Treatment",
            "de": "Sothys Organics® Bio-Radiance Behandlung",
            "fr": "Sothys Organics® Soin éclat certifié bio",
            "ru": "Sothys Organics® Органический уход «Сияние»"
        },
        "short": {
            "tr": "Anında ışıltı. Tüm cilt tipleri (hassas dahil).",
            "en": "Instant radiance. All skin types (even sensitive).",
            "de": "Sofortiger Glow. Für alle Hauttypen (auch sensibel).",
            "fr": "Éclat immédiat. Tous types de peau (même sensibles).",
            "ru": "Мгновенное сияние. Для всех типов кожи (включая чувствительную)."
        }
    },
    {
        "id": 402,
        "cat": "skincare",
        "time": 45,
        "price": 0,
        "name": {
            "tr": "Sothys Seasonal Oksijenlendirici Bakım",
            "en": "Sothys Seasonal Oxygenating Treatment",
            "de": "Sothys Seasonal Oxygenating Behandlung",
            "fr": "Sothys Soin saisonnier oxygénant",
            "ru": "Sothys Сезонный кислородный уход"
        },
        "short": {
            "tr": "Mevsimsel canlandırma: peeling + maske + rahatlatıcı modelaj.",
            "en": "Seasonal boost: exfoliation + mask + relaxing modelling.",
            "de": "Saisonaler Boost: Peeling + Maske + entspannende Modellage.",
            "fr": "Boost saisonnier : gommage + masque + modelage relaxant.",
            "ru": "Сезонное обновление: пилинг + маска + расслабляющий массаж."
        }
    },
    {
        "id": 403,
        "cat": "skincare",
        "time": 50,
        "price": 0,
        "name": {
            "tr": "Spa™ Termal Su ile Yatıştırıcı Bakım",
            "en": "Soothing Professional Treatment with Spa™ Thermal Water",
            "de": "Beruhigende Profi-Behandlung mit Spa™ Thermalwasser",
            "fr": "Soin professionnel apaisant à l’Eau Thermale Spa™",
            "ru": "Успокаивающий профессиональный уход со Spa™ термальной водой"
        },
        "short": {
            "tr": "Konfor ve sakinlik odaklı; hassasiyete nazik yaklaşım.",
            "en": "Comfort & calm—gentle care for sensitive skin.",
            "de": "Komfort & Ruhe—sanfte Pflege für sensible Haut.",
            "fr": "Confort & apaisement—pour peaux sensibles.",
            "ru": "Комфорт и успокоение — деликатный уход для чувствительной кожи."
        }
    },
    {
        "id": 404,
        "cat": "skincare",
        "time": 45,
        "price": 0,
        "name": {
            "tr": "Sothys Cryo Eye Profesyonel Göz Bakımı",
            "en": "Sothys Cryo Eye Professional Treatment",
            "de": "Sothys Cryo Eye Profi-Augenbehandlung",
            "fr": "Sothys Soin professionnel Cryo Yeux",
            "ru": "Sothys Профессиональный Cryo-уход для глаз"
        },
        "short": {
            "tr": "Göz çevresinde ferahlık ve daha dinlenmiş görünüm.",
            "en": "Refreshing eye contour for a rested look.",
            "de": "Erfrischte Augenpartie für einen wachen Blick.",
            "fr": "Contour des yeux rafraîchi, regard reposé.",
            "ru": "Освежает область вокруг глаз для отдохнувшего вида."
        }
    },
    {
        "id": 405,
        "cat": "skincare",
        "time": 75,
        "price": 0,
        "name": {
            "tr": "Hydra Hyaluronic Acid4 (Yoğun Nem Bakımı)",
            "en": "Hydrating Intensive Treatment (Hydra Hyaluronic Acid4)",
            "de": "Hydrating Intensive Behandlung (Hydra Hyaluronic Acid4)",
            "fr": "Soin intensif hydratant (Hydra Hyaluronic Acid4)",
            "ru": "Интенсивное увлажнение (Hydra Hyaluronic Acid4)"
        },
        "short": {
            "tr": "6 aşamalı yoğun nem; dolgunluk ve tazelik hissi.",
            "en": "6-step intensive hydration; plumped, fresh-feeling skin.",
            "de": "6 Schritte intensive Hydration; pralle, frische Haut.",
            "fr": "Hydratation intensive en 6 étapes; peau repulpée.",
            "ru": "6 этапов интенсивного увлажнения; ощущение наполненности."
        }
    },
    {
        "id": 406,
        "cat": "skincare",
        "time": 75,
        "price": 0,
        "name": {
            "tr": "Detox Energie™ Yoğun Bakım",
            "en": "Detox Energie™ Intensive Treatment",
            "de": "Detox Energie™ Intensive Behandlung",
            "fr": "Soin intensif Detox Energie™",
            "ru": "Detox Energie™ Интенсивный уход"
        },
        "short": {
            "tr": "Enerji desteği ve ‘depolluted’ görünüm odağı.",
            "en": "Energy boost with a ‘depolluted’ looking complexion focus.",
            "de": "Energie-Boost mit Fokus auf ein ‘entlastet’ wirkendes Hautbild.",
            "fr": "Coup d’énergie avec focus ‘teint dépollué’.",
            "ru": "Энергия и акцент на «очищенный» вид кожи."
        }
    },
    {
        "id": 407,
        "cat": "skincare",
        "time": 75,
        "price": 0,
        "name": {
            "tr": "Glow Defense Yoğun Bakım",
            "en": "Glow Defense Intensive Treatment",
            "de": "Glow Defense Intensive Behandlung",
            "fr": "Soin intensif Glow Defense",
            "ru": "Glow Defense Интенсивный уход"
        },
        "short": {
            "tr": "Işıltı ve koruma odağı; şehir temposuna karşı bakım hissi.",
            "en": "Glow + defense focus—ideal for urban life stressors.",
            "de": "Glow + Schutz—ideal gegen urbane Stressfaktoren.",
            "fr": "Éclat + protection—idéal face au stress urbain.",
            "ru": "Сияние + защита — идеально при городской нагрузке."
        }
    },
    {
        "id": 408,
        "cat": "skincare",
        "time": 75,
        "price": 0,
        "name": {
            "tr": "Youth Intensive (Gençlik Yoğun Bakım)",
            "en": "Youth Intensive Treatment",
            "de": "Youth Intensive Behandlung",
            "fr": "Soin intensif Jeunesse",
            "ru": "Youth Intensive — Интенсивный уход"
        },
        "short": {
            "tr": "Daha genç görünüm ve sıkılık hissi odaklı protokol.",
            "en": "Expert protocol focused on a visibly younger look & firmness feel.",
            "de": "Expertenprotokoll für sichtbar jüngeren Look & Festigkeit.",
            "fr": "Protocole expert pour un effet jeunesse & fermeté.",
            "ru": "Эксперт-протокол для более молодого вида и упругости."
        }
    },
    {
        "id": 409,
        "cat": "skincare",
        "time": 45,
        "price": 0,
        "name": {
            "tr": "Dermo_Booster Double Peel (Çift Peeling)",
            "en": "Dermo_Booster Double Peel Professional Treatment",
            "de": "Dermo_Booster Double Peel Profi-Behandlung",
            "fr": "Dermo_Booster Double Peel — Soin professionnel",
            "ru": "Dermo_Booster Double Peel — Профессиональный уход"
        },
        "short": {
            "tr": "Enzim + asit peeling kombinasyonu (AHA/BHA/PHA).",
            "en": "Enzymatic peel + acid peel combination (AHA/BHA/PHA).",
            "de": "Enzympeeling + Säurepeeling (AHA/BHA/PHA).",
            "fr": "Peeling enzymatique + peeling acide (AHA/BHA/PHA).",
            "ru": "Ферментный + кислотный пилинг (AHA/BHA/PHA)."
        }
    },
    {
        "id": 410,
        "cat": "skincare",
        "time": 45,
        "price": 0,
        "name": {
            "tr": "Glysalac Pro Peel",
            "en": "Glysalac Pro Peel Treatment",
            "de": "Glysalac Pro Peel Behandlung",
            "fr": "Glysalac Pro Peel",
            "ru": "Glysalac Pro Peel"
        },
        "short": {
            "tr": "Daha pürüzsüz doku ve daha aydınlık görünüm (normal/karma).",
            "en": "Refines texture & brightens (normal/combination skin).",
            "de": "Verfeinert & hellt auf (normale/mischhaut).",
            "fr": "Affiner & illuminer (peau normale/mixte).",
            "ru": "Выравнивает текстуру и придает сияние (норм./комб.)."
        }
    },
    {
        "id": 411,
        "cat": "skincare",
        "time": 60,
        "price": 0,
        "name": {
            "tr": "Professional Resurfacing Peel (Yenileyici Peeling)",
            "en": "Professional Resurfacing Peel Treatment",
            "de": "Professional Resurfacing Peel Behandlung",
            "fr": "Soin peeling resurfaçant professionnel",
            "ru": "Профессиональный Resurfacing Peel"
        },
        "short": {
            "tr": "Peel + mikrodermabrazyon yaklaşımı; daha net ve aydınlık görünüm.",
            "en": "Peel + microdermabrasion approach for renewed-looking skin.",
            "de": "Peel + Mikrodermabrasion für erneuert wirkende Haut.",
            "fr": "Peeling + microdermabrasion pour une peau renouvelée.",
            "ru": "Пилинг + микродермабразия для обновленного вида кожи."
        }
    }
]

# Paths
INPUT_JSON = 'c:/Users/tourg/Desktop/SANTIS_SITE/data/services_spa.json'
OUTPUT_DB_JS = 'c:/Users/tourg/Desktop/SANTIS_SITE/assets/js/db.js'

def run():
    # 1. Read existing services_spa.json
    try:
        with open(INPUT_JSON, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {INPUT_JSON}: {e}")
        return

    # 2. Transform Sothys items to services_spa.json format
    new_face_sothys = []
    for item in sothys_raw:
        new_item = {
            "id": str(item["id"]), # Convert 401 to "401" for consistent string IDs
            "slug": str(item["id"]), # Use ID as slug or create one? Let's use ID for simplicity as slug
            "duration": item["time"],
            "name": item["name"],
            "desc": { "tr": item["short"]["tr"] }, # Minimal mapping
            "content": {
                "tr": {
                    "intro": item["short"]["tr"], # Use short desc as intro
                    # Placeholders to prevent undefined errors in service-detail.html
                    "highlights": ["Dengeli bakım", "Sothys uzmanlığı", "Işıltı ve ferahlık"],
                    "flow": ["Karşılama", "Bakım ritüeli", "Kapanış"],
                    "ideal": ["Işıltı arayanlar", "Hassas ciltler"],
                    "note": "Rezervasyon sırasında lütfen hassasiyetlerinizi belirtin."
                }
            }
        }
        new_face_sothys.append(new_item)

    # 3. Update data object
    data['faceSothys'] = new_face_sothys

    # 4. Write back to services_spa.json (UTF-8)
    try:
        with open(INPUT_JSON, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated {INPUT_JSON} with new Sothys data.")
    except Exception as e:
        print(f"Error writing {INPUT_JSON}: {e}")
        return

    # 5. Generate assets/js/db.js
    # Need to flatten the data structure: { key: [items] } -> [ {..., cat: key} ]
    # And map keys to valid 'cat' values used in index.html fallbackRender
    
    # index.html cats: 'hammam', 'massage', 'extra', 'skincare'
    # services_spa.json keys: 'hammam', 'classicMassages', 'extraEffective', 'faceSothys'
    
    cat_map = {
        'hammam': 'hammam',
        'classicMassages': 'massage',
        'extraEffective': 'extra',
        'faceSothys': 'skincare'
    }

    flat_db = []
    
    for key, items in data.items():
        mapped_cat = cat_map.get(key, key)
        for item in items:
            # Map item to db.js / index.html friendly format
            db_item = {
                "id": item.get("id"),
                "cat": mapped_cat,
                "time": item.get("duration"),
                "price": item.get("price", 0), # Default 0 if missing
                "name": item.get("name", {}),
                "desc": item.get("desc", {}),
                # Add slug too?
                "slug": item.get("slug")
            }
            flat_db.append(db_item)

    # Convert to JS string
    js_content = f"window.servicesDB = {json.dumps(flat_db, indent=2, ensure_ascii=False)};"

    try:
        with open(OUTPUT_DB_JS, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"Generated {OUTPUT_DB_JS} successfully.")
    except Exception as e:
        print(f"Error writing {OUTPUT_DB_JS}: {e}")

if __name__ == "__main__":
    run()
