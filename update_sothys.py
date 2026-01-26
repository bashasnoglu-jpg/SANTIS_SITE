import json
import os

filename = "santis-hotels.json"

new_services = {
    "sothys_organics_radiance": {
        "categoryId": "skincare",
        "durationMin": 30,
        "price": 0,
        "currency": "EUR",
        "name": {
            "tr": "Sothys Organics® Işıltı Bakımı",
            "en": "Sothys Organics® Organic Certified Radiance Treatment",
            "de": "Sothys Organics® Bio-Radiance Behandlung",
            "fr": "Sothys Organics® Soin éclat certifié bio",
            "ru": "Sothys Organics® Органический уход «Сияние»"
        },
        "desc": {
            "tr": "Anında ışıltı. Tüm cilt tipleri (hassas dahil).",
            "en": "Instant radiance. All skin types (even sensitive).",
            "de": "Sofortiger Glow. Für alle Hauttypen (auch sensibel).",
            "fr": "Éclat immédiat. Tous types de peau (même sensibles).",
            "ru": "Мгновенное сияние. Для всех типов кожи (включая чувствительную)."
        }
    },
    "sothys_seasonal_oxygen": {
        "categoryId": "skincare",
        "durationMin": 45,
        "price": 0,
        "currency": "EUR",
        "name": {
            "tr": "Sothys Seasonal Oksijenlendirici Bakım",
            "en": "Sothys Seasonal Oxygenating Treatment",
            "de": "Sothys Seasonal Oxygenating Behandlung",
            "fr": "Sothys Soin saisonnier oxygénant",
            "ru": "Sothys Сезонный кислородный уход"
        },
        "desc": {
            "tr": "Mevsimsel canlandırma: peeling + maske + rahatlatıcı modelaj.",
            "en": "Seasonal boost: exfoliation + mask + relaxing modelling.",
            "de": "Saisonaler Boost: Peeling + Maske + entspannende Modellage.",
            "fr": "Boost saisonnier : gommage + masque + modelage relaxant.",
            "ru": "Сезонное обновление: пилинг + маска + расслабляющий массаж."
        }
    },
    "sothys_spa_thermal_water": {
        "categoryId": "skincare",
        "durationMin": 50,
        "price": 0,
        "currency": "EUR",
        "name": {
            "tr": "Spa™ Termal Su ile Yatıştırıcı Bakım",
            "en": "Soothing Professional Treatment with Spa™ Thermal Water",
            "de": "Beruhigende Profi-Behandlung mit Spa™ Thermalwasser",
            "fr": "Soin professionnel apaisant à l’Eau Thermale Spa™",
            "ru": "Успокаивающий профессиональный уход со Spa™ термальной водой"
        },
        "desc": {
            "tr": "Konfor ve sakinlik odaklı; hassasiyete nazik yaklaşım.",
            "en": "Comfort & calm—gentle care for sensitive skin.",
            "de": "Komfort & Ruhe—sanfte Pflege für sensible Haut.",
            "fr": "Confort & apaisement—pour peaux sensibles.",
            "ru": "Комфорт и успокоение — деликатный уход для чувствительной кожи."
        }
    },
    "sothys_cryo_eye": {
        "categoryId": "skincare",
        "durationMin": 45,
        "price": 0,
        "currency": "EUR",
        "name": {
            "tr": "Sothys Cryo Eye Profesyonel Göz Bakımı",
            "en": "Sothys Cryo Eye Professional Treatment",
            "de": "Sothys Cryo Eye Profi-Augenbehandlung",
            "fr": "Sothys Soin professionnel Cryo Yeux",
            "ru": "Sothys Профессиональный Cryo-уход для глаз"
        },
        "desc": {
            "tr": "Göz çevresinde ferahlık ve daha dinlenmiş görünüm.",
            "en": "Refreshing eye contour for a rested look.",
            "de": "Erfrischte Augenpartie für einen wachen Blick.",
            "fr": "Contour des yeux rafraîchi, regard reposé.",
            "ru": "Освежает область вокруг глаз для отдохнувшего вида."
        }
    },
    "sothys_hydra_acid4": {
        "categoryId": "skincare",
        "durationMin": 75,
        "price": 0,
        "currency": "EUR",
        "name": {
            "tr": "Hydra Hyaluronic Acid4 (Yoğun Nem Bakımı)",
            "en": "Hydrating Intensive Treatment (Hydra Hyaluronic Acid4)",
            "de": "Hydrating Intensive Behandlung (Hydra Hyaluronic Acid4)",
            "fr": "Soin intensif hydratant (Hydra Hyaluronic Acid4)",
            "ru": "Интенсивное увлажнение (Hydra Hyaluronic Acid4)"
        },
        "desc": {
            "tr": "6 aşamalı yoğun nem; dolgunluk ve tazelik hissi.",
            "en": "6-step intensive hydration; plumped, fresh-feeling skin.",
            "de": "6 Schritte intensive Hydration; pralle, frische Haut.",
            "fr": "Hydratation intensive en 6 étapes; peau repulpée.",
            "ru": "6 этапов интенсивного увлажнения; ощущение наполненности."
        }
    },
    "sothys_detox_energie": {
        "categoryId": "skincare",
        "durationMin": 75,
        "price": 0,
        "currency": "EUR",
        "name": {
            "tr": "Detox Energie™ Yoğun Bakım",
            "en": "Detox Energie™ Intensive Treatment",
            "de": "Detox Energie™ Intensive Behandlung",
            "fr": "Soin intensif Detox Energie™",
            "ru": "Detox Energie™ Интенсивный уход"
        },
        "desc": {
            "tr": "Enerji desteği ve ‘depolluted’ görünüm odağı.",
            "en": "Energy boost with a ‘depolluted’ looking complexion focus.",
            "de": "Energie-Boost mit Fokus auf ein ‘entlastet’ wirkendes Hautbild.",
            "fr": "Coup d’énergie avec focus ‘teint dépollué’.",
            "ru": "Энергия и акцент на «очищенный» вид кожи."
        }
    },
    "sothys_glow_defense": {
        "categoryId": "skincare",
        "durationMin": 75,
        "price": 0,
        "currency": "EUR",
        "name": {
            "tr": "Glow Defense Yoğun Bakım",
            "en": "Glow Defense Intensive Treatment",
            "de": "Glow Defense Intensive Behandlung",
            "fr": "Soin intensif Glow Defense",
            "ru": "Glow Defense Интенсивный уход"
        },
        "desc": {
            "tr": "Işıltı ve koruma odağı; şehir temposuna karşı bakım hissi.",
            "en": "Glow + defense focus—ideal for urban life stressors.",
            "de": "Glow + Schutz—ideal gegen urbane Stressfaktoren.",
            "fr": "Éclat + protection—idéal face au stress urbain.",
            "ru": "Сияние + защита — идеально при городской нагрузке."
        }
    },
    "sothys_youth_intensive": {
        "categoryId": "skincare",
        "durationMin": 75,
        "price": 0,
        "currency": "EUR",
        "name": {
            "tr": "Youth Intensive (Gençlik Yoğun Bakım)",
            "en": "Youth Intensive Treatment",
            "de": "Youth Intensive Behandlung",
            "fr": "Soin intensif Jeunesse",
            "ru": "Youth Intensive — Интенсивный уход"
        },
        "desc": {
            "tr": "Daha genç görünüm ve sıkılık hissi odaklı protokol.",
            "en": "Expert protocol focused on a visibly younger look & firmness feel.",
            "de": "Expertenprotokoll für sichtbar jüngeren Look & Festigkeit.",
            "fr": "Protocole expert pour un effet jeunesse & fermeté.",
            "ru": "Эксперт-протокол для более молодого вида и упругости."
        }
    },
    "sothys_double_peel": {
        "categoryId": "skincare",
        "durationMin": 45,
        "price": 0,
        "currency": "EUR",
        "name": {
            "tr": "Dermo_Booster Double Peel (Çift Peeling)",
            "en": "Dermo_Booster Double Peel Professional Treatment",
            "de": "Dermo_Booster Double Peel Profi-Behandlung",
            "fr": "Dermo_Booster Double Peel — Soin professionnel",
            "ru": "Dermo_Booster Double Peel — Профессиональный уход"
        },
        "desc": {
            "tr": "Enzim + asit peeling kombinasyonu (AHA/BHA/PHA).",
            "en": "Enzymatic peel + acid peel combination (AHA/BHA/PHA).",
            "de": "Enzympeeling + Säurepeeling (AHA/BHA/PHA).",
            "fr": "Peeling enzymatique + peeling acide (AHA/BHA/PHA).",
            "ru": "Ферментный + кислотный пилинг (AHA/BHA/PHA)."
        }
    },
    "sothys_glysalac_peel": {
        "categoryId": "skincare",
        "durationMin": 45,
        "price": 0,
        "currency": "EUR",
        "name": {
            "tr": "Glysalac Pro Peel",
            "en": "Glysalac Pro Peel Treatment",
            "de": "Glysalac Pro Peel Behandlung",
            "fr": "Glysalac Pro Peel",
            "ru": "Glysalac Pro Peel"
        },
        "desc": {
            "tr": "Daha pürüzsüz doku ve daha aydınlık görünüm (normal/karma).",
            "en": "Refines texture & brightens (normal/combination skin).",
            "de": "Verfeinert & hellt auf (normale/mischhaut).",
            "fr": "Affiner & illuminer (peau normale/mixte).",
            "ru": "Выравнивает текстуру и придает сияние (норм./комб.)."
        }
    },
    "sothys_resurfacing_peel": {
        "categoryId": "skincare",
        "durationMin": 60,
        "price": 0,
        "currency": "EUR",
        "name": {
            "tr": "Professional Resurfacing Peel (Yenileyici Peeling)",
            "en": "Professional Resurfacing Peel Treatment",
            "de": "Professional Resurfacing Peel Behandlung",
            "fr": "Soin peeling resurfaçant professionnel",
            "ru": "Профессиональный Resurfacing Peel"
        },
        "desc": {
            "tr": "Peel + mikrodermabrazyon yaklaşımı; daha net ve aydınlık görünüm.",
            "en": "Peel + microdermabrasion approach for renewed-looking skin.",
            "de": "Peel + Mikrodermabrasion für erneuert wirkende Haut.",
            "fr": "Peeling + microdermabrasion pour une peau renouvelée.",
            "ru": "Пилинг + микродермабразия для обновленного вида кожи."
        }
    }
}

try:
    with open(filename, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    # Merge services
    if 'services' not in data:
        data['services'] = {}
    
    data['services'].update(new_services)
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully added 11 Sothys treatments to {filename}")

except Exception as e:
    print(f"Error: {e}")
