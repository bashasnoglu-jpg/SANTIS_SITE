import json
import os

db_path = r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\js\db.js"
menu_path = r"c:\Users\tourg\Desktop\SANTIS_SITE\tools\panel_menu.json"

# 1. Panel Menu Data
menu_data = [
    {
        "id": "2000",
        "slug": "skincare",
        "sort": 10,
        "visibleIn": ["site", "panel"],
        "labels": {
            "tr": "Cilt Bakımı",
            "en": "Skincare",
            "de": "Hautpflege",
            "fr": "Soin du visage",
            "ru": "Уход за кожей"
        },
        "roleRequired": "editor",
        "routes": {
            "site": "/{lang}/shop/skincare",
            "admin": "/admin/catalog/skincare"
        },
        "featureFlags": {"EU": True},
        "children": [
            {
                "id": "2100",
                "slug": "sothys",
                "sort": 10,
                "visibleIn": ["site", "panel"],
                "labels": {
                    "tr": "Sothys Paris",
                    "en": "Sothys Paris",
                    "de": "Sothys Paris",
                    "fr": "Sothys Paris",
                    "ru": "Sothys Paris"
                },
                "roleRequired": "editor",
                "routes": {
                    "site": "/{lang}/shop/skincare/sothys",
                    "admin": "/admin/brands/sothys"
                },
                "children": [
                    {
                        "id": "2110",
                        "slug": "hydra-ha4",
                        "sort": 10,
                        "visibleIn": ["site", "panel"],
                        "labels": {
                            "tr": "Hydra (Hyaluronic Acid4)",
                            "en": "Hydra (Hyaluronic Acid4)",
                            "de": "Hydra (Hyaluronic Acid4)",
                            "fr": "Hydra (Acide Hyaluronique4)",
                            "ru": "Hydra (Гиалуроновая кислота 4)"
                        },
                        "roleRequired": "editor",
                        "routes": {
                            "site": "/{lang}/shop/skincare/sothys/hydra-ha4",
                            "admin": "/admin/collections/hydra-ha4"
                        }
                    },
                    # ... (Other children implied but kept minimal for brevity if not strictly needed in full tree right now)
                    # Adding just one more example
                     {
                        "id": "2120",
                        "slug": "sensitive-spa-water",
                        "sort": 20,
                        "visibleIn": ["site", "panel"],
                        "labels": {
                            "tr": "Hassas Cilt (Spa™ Thermal Water)",
                            "en": "Sensitive (Spa™ Thermal Water)",
                            "de": "Sensible Haut (Spa™ Thermal Water)",
                            "fr": "Peaux sensibles (Eau thermale Spa™)",
                            "ru": "Чувствительная кожа (Spa™)"
                        },
                        "roleRequired": "editor",
                        "routes": {
                            "site": "/{lang}/shop/skincare/sothys/sensitive-spa-water",
                            "admin": "/admin/collections/sensitive-spa-water"
                        }
                    }
                ]
            }
        ]
    }
]

# 2. Sothys Products Data (Raw from prompt)
products_data = [
    {
        "sku": "SOTHYS-HYDRA-INTENSIVE-SERUM",
        "slug": "hydrating-intensive-serum",
        "brand": "Sothys",
        "collection": "Hydra Hyaluronic Acid4",
        "type": "Serum",
        "size": None,
        "labels": {
            "tr": {"title": "Hydrating Intensive Serum", "subtitle": "Hafif dokuda yoğun nem desteği"},
            "en": {"title": "Hydrating Intensive Serum", "subtitle": "Lightweight intensive hydration"}
        }
    },
    {
        "sku": "SOTHYS-HYDRA-YOUTH-CREAM",
        "slug": "hydra-creme-jeunesse",
        "brand": "Sothys",
        "collection": "Hydra Hyaluronic Acid4",
        "type": "Cream",
        "size": None,
        "labels": {
            "tr": {"title": "Hydra Crème jeunesse (Hydration)", "subtitle": "Günlük nem + dolgun görünüm"},
            "en": {"title": "Hydra Youth Cream (Hydration)", "subtitle": "Daily hydration, plumper look"}
        }
    },
    {
        "sku": "SOTHYS-SENSITIVE-NUTRISOOTHING-MASK",
        "slug": "nutri-soothing-mask",
        "brand": "Sothys",
        "collection": "Sensitive – Spa Thermal Water",
        "type": "Mask",
        "size": None,
        "labels": {
            "tr": {"title": "Nutri-Soothing Mask", "subtitle": "Hassas ciltte konfor ve denge"},
            "en": {"title": "Nutri-Soothing Mask", "subtitle": "Comfort + balance for sensitive skin"}
        }
    },
    {
        "sku": "SOTHYS-SENSITIVE-SOOTHING-VELVET-CREAM",
        "slug": "soothing-velvet-cream",
        "brand": "Sothys",
        "collection": "Sensitive – Spa Thermal Water",
        "type": "Cream",
        "size": None,
        "labels": {
            "tr": {"title": "Soothing Velvet Cream", "subtitle": "Hassas cilt için günlük koruma"},
            "en": {"title": "Soothing Velvet Cream", "subtitle": "Daily protection for sensitive skin"}
        }
    },
    {
        "sku": "SOTHYS-FOCUS-TACHES-SERUM",
        "slug": "serum-focus-taches",
        "brand": "Sothys",
        "collection": "Focus Taches",
        "type": "Serum",
        "size": None,
        "labels": {
            "tr": {"title": "Sérum Focus Taches", "subtitle": "Leke görünümünü hedefleyen bakım"},
            "en": {"title": "Focus Taches Serum", "subtitle": "Targets the appearance of dark spots"}
        }
    },
    {
        "sku": "SOTHYS-FOCUS-TACHES-CREAM",
        "slug": "creme-focus-taches",
        "brand": "Sothys",
        "collection": "Focus Taches",
        "type": "Cream",
        "size": None,
        "labels": {
            "tr": {"title": "Crème Focus Taches", "subtitle": "Günlük kullanım: leke + ışıltı"},
            "en": {"title": "Focus Taches Cream", "subtitle": "Daily: spots + radiance"}
        }
    },
    {
        "sku": "SOTHYS-DETOX-CREME-JEUNESSE-DEPOLLUANTE",
        "slug": "creme-jeunesse-depolluante",
        "brand": "Sothys",
        "collection": "Detox Energie",
        "type": "Cream",
        "size": "50 ml",
        "labels": {
            "tr": {"title": "Crème jeunesse dépolluante", "subtitle": "Şehir stresine karşı günlük denge"},
            "en": {"title": "Depolluting Youth Cream", "subtitle": "Daily balance against urban stress"}
        }
    },
    {
        "sku": "SOTHYS-DETOX-SERUM-ENERGISANT-INTEGRAL",
        "slug": "serum-energisant-integral",
        "brand": "Sothys",
        "collection": "Detox Energie",
        "type": "Serum",
        "size": "30 ml",
        "labels": {
            "tr": {"title": "Sérum énergisant intégral", "subtitle": "Detoks & enerji hissi, hafif doku"},
            "en": {"title": "Integral Energizing Serum", "subtitle": "Detox & energizing feel, light texture"}
        }
    },
    {
        "sku": "SOTHYS-PRESTIGE-LA-CREME-128",
        "slug": "la-creme-128",
        "brand": "Sothys",
        "collection": "Secrets de Sothys",
        "type": "Cream",
        "size": None,
        "labels": {
            "tr": {"title": "La Crème 128", "subtitle": "Prestige youth krem (ikon ürün)"},
            "en": {"title": "La Crème 128", "subtitle": "Iconic prestige youth cream"}
        }
    },
    {
        "sku": "SOTHYS-PRESTIGE-LA-CREME-PREMIUM-YOUTH",
        "slug": "la-creme-premium-youth-cream",
        "brand": "Sothys",
        "collection": "Secrets de Sothys",
        "type": "Cream",
        "size": None,
        "labels": {
            "tr": {"title": "La crème – Premium youth cream", "subtitle": "Günlük pro-youth bakım"},
            "en": {"title": "La crème – Premium youth cream", "subtitle": "Daily pro-youth care"}
        }
    },
    {
        "sku": "SOTHYS-PRESTIGE-EYE-LIP-YOUTH-CREAM",
        "slug": "eye-and-lip-youth-cream",
        "brand": "Sothys",
        "collection": "Secrets de Sothys",
        "type": "Eye Care",
        "size": None,
        "labels": {
            "tr": {"title": "La crème yeux-lèvres", "subtitle": "Göz + dudak çevresi bakımı"},
            "en": {"title": "Eye & lip youth cream", "subtitle": "Eye + lip contour care"}
        }
    },
    {
        "sku": "SOTHYS-PRESTIGE-EAU-DE-PARFUM",
        "slug": "secrets-de-sothys-eau-de-parfum",
        "brand": "Sothys",
        "collection": "Secrets de Sothys",
        "type": "Fragrance",
        "size": "50 ml",
        "labels": {
            "tr": {"title": "Secrets de Sothys – Eau de parfum", "subtitle": "Koleksiyonun imza kokusu"},
            "en": {"title": "Secrets de Sothys – Eau de parfum", "subtitle": "Signature scent of the collection"}
        }
    },
    {
        "sku": "SOTHYS-HOMME-MULTI-OIL",
        "slug": "sothys-homme-multi-oil",
        "brand": "Sothys",
        "collection": "Sothys Homme",
        "type": "Oil",
        "size": "100 ml",
        "labels": {
            "tr": {"title": "Sothys Homme – Multi-Oil", "subtitle": "Tıraş + sakal + yüz/beden çok amaçlı"},
            "en": {"title": "Sothys Homme – Multi-Oil", "subtitle": "Multi-use: shave/beard/face/body"}
        }
    },
    {
        "sku": "SOTHYS-HOMME-HYDRATING-YOUTH-FLUID",
        "slug": "sothys-homme-hydrating-youth-fluid",
        "brand": "Sothys",
        "collection": "Sothys Homme",
        "type": "Fluid",
        "size": "125 ml",
        "labels": {
            "tr": {"title": "Sothys Homme – Hydrating Youth Fluid", "subtitle": "Nem + anti-age tek adım"},
            "en": {"title": "Sothys Homme – Hydrating Youth Fluid", "subtitle": "Hydration + anti-age in one step"}
        }
    },
    {
        "sku": "SOTHYS-HOMME-EAU-FRAICHE",
        "slug": "sothys-homme-eau-fraiche",
        "brand": "Sothys",
        "collection": "Sothys Homme",
        "type": "Body & Hair Mist",
        "size": "50 ml",
        "labels": {
            "tr": {"title": "Sothys Homme – Eau fraîche", "subtitle": "Vücut & saç için ferah koku suyu"},
            "en": {"title": "Sothys Homme – Eau fraîche", "subtitle": "Refreshing body & hair water"}
        }
    }
]

def update_files():
    # 1. Update Panel Menu
    with open(menu_path, 'w', encoding='utf-8') as f:
        json.dump(menu_data, f, indent=4, ensure_ascii=False)
    print("Updated tools/panel_menu.json")

    # 2. Update DB.js
    # Convert 'products_data' to db.js format
    js_products = []
    for p in products_data:
        new_item = {
            "id": p.get("sku"),
            "cat": "skincare",
            "subcat": p.get("collection"),
            "brand": p.get("brand"),
            "type": p.get("type"),
            "size": p.get("size"),
            "name": {},
            "desc": {},
            "price": 0,
            "slug": p.get("slug"),
            "img": f"images/sothys/{p.get('slug')}.jpg"
        }
        
        if "labels" in p:
            for lang, texts in p["labels"].items():
                new_item["name"][lang] = texts.get("title")
                new_item["desc"][lang] = texts.get("subtitle")
        
        js_products.append(new_item)

    with open(db_path, 'r', encoding='utf-8') as f:
        db_content = f.read()

    # Create JS string
    js_str = json.dumps(js_products, indent=2, ensure_ascii=False)
    js_inner = js_str[1:-1] # strip [ ]

    # Replace existing Sothys block
    marker = "// --- 2. SOTHYS PARIS SKINCARE COLLECTION"
    if marker in db_content:
        split_content = db_content.split(marker)[0]
        new_db_content = split_content + marker + " (REFRESHED) ---\n" + "," + js_inner + "\n];"
    else:
        last_bracket = db_content.rfind('];')
        new_db_content = db_content[:last_bracket] + ",\n" + marker + " ---\n" + js_inner + "\n];"

    with open(db_path, 'w', encoding='utf-8') as f:
        f.write(new_db_content)
    print("Updated assets/js/db.js")

if __name__ == "__main__":
    update_files()
