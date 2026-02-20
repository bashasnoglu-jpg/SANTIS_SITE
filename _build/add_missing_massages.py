"""
Eksik 13 masajı services.json'a ekler.
HTML detay sayfalarından title, description, duration bilgisi çeker.
"""
import json, re, os

SITE = r"c:\Users\tourg\Desktop\SANTIS_SITE"
JSON_PATH = os.path.join(SITE, "assets", "data", "services.json")

# 13 eksik masaj: (html_basename, slug, categoryId)
MISSING = [
    ("anne-cocuk",        "anne-cocuk-masaji",       "massage-specialty"),
    ("bali",             "bali-masaji",             "massage-specialty"),
    ("bas-boyun-omuz",   "bas-boyun-omuz-masaji",   "massage-classic"),
    ("cift-rituel",      "cift-rituel-masaji",      "massage-couples"),
    ("cift-senkron",     "cift-senkron-masaji",     "massage-couples"),
    ("kids-nazik",       "kids-nazik-masaji",       "massage-kids"),
    ("kranyo-sakral",    "kranyo-sakral-terapi",    "massage-therapeutic"),
    ("myofascial-release","myofascial-release",     "massage-therapeutic"),
    ("shiatsu",          "shiatsu-masaji",          "massage-specialty"),
    ("signature-rituel", "signature-rituel",        "massage-specialty"),
    ("sirt-terapi",      "sirt-terapi-masaji",      "massage-therapeutic"),
    ("tetik-nokta",      "tetik-nokta-terapi",      "massage-therapeutic"),
    ("thai",             "thai-masaji",             "massage-specialty"),
]

def extract_from_html(basename):
    path = os.path.join(SITE, "tr", "masajlar", f"{basename}.html")
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()
    
    # Title from <h1>
    m = re.search(r'<h1>(.*?)</h1>', html)
    title = m.group(1).strip() if m else basename
    
    # Description from meta
    m = re.search(r'name="description"\s*(?:content|CONTENT)="(.*?)"', html, re.IGNORECASE)
    if not m:
        m = re.search(r'content="(.*?)"\s*name="description"', html, re.IGNORECASE)
    desc = m.group(1).strip() if m else ""
    
    # Duration from service-duration section  
    m = re.search(r'<section class="service-duration">.*?<p>(\d+)\s*dk', html, re.DOTALL)
    duration = int(m.group(1)) if m else 50
    
    # Price from Schema
    m = re.search(r'"price":\s*"(\d+)"', html)
    price = int(m.group(1)) if m else 80
    
    # Intro from service-intro
    m = re.search(r'<section class="service-intro">\s*<p>(.*?)</p>', html, re.DOTALL)
    intro = m.group(1).strip() if m else ""
    # Clean HTML tags from intro
    intro = re.sub(r'<[^>]+>', '', intro).strip()
    
    return {
        "title": title,
        "desc": desc,
        "duration": duration,
        "price": price,
        "intro": intro
    }

# Load existing JSON
with open(JSON_PATH, "r", encoding="utf-8") as f:
    services = json.load(f)

existing_ids = {s["id"] for s in services}
added = 0

for basename, slug, cat_id in MISSING:
    item_id = f"mass-{basename}"
    if item_id in existing_ids:
        print(f"  SKIP {item_id} (zaten var)")
        continue
    
    data = extract_from_html(basename)
    
    new_entry = {
        "id": item_id,
        "categoryId": cat_id,
        "name": data["title"],
        "duration": data["duration"],
        "price": {
            "amount": data["price"],
            "currency": "€"
        },
        "media": {
            "hero": "santis_card_massage_lux.png"
        },
        "content": {
            "tr": {
                "title": data["title"],
                "shortDesc": data["desc"],
                "fullDesc": data["intro"][:200] if data["intro"] else data["desc"],
                "tagline": data["desc"][:60] if data["desc"] else data["title"],
                "heroTitle": data["title"],
                "intro": data["intro"],
                "steps": [
                    "Ön Görüşme: Terapistiniz ihtiyaçlarınızı değerlendirir",
                    "Ortam Hazırlığı: Terapi odası özenle hazırlanır",
                    "Uygulama: Profesyonel tekniklerle terapi uygulanır",
                    "Tamamlama: Bitkisel çay eşliğinde rahatlama"
                ],
                "effects": data["intro"][:150] if data["intro"] else "",
                "idealFor": "Bedensel ve zihinsel rahatlama arayanlar için idealdir.",
                "signature": "Santis Club uzman terapistleri tarafından özenle uygulanır."
            },
            "de": {
                "title": data["title"],
                "shortDesc": data["desc"]
            }
        },
        "slug": slug,
        "tags": ["SPECIALTY" if "specialty" in cat_id else "THERAPEUTIC" if "therapeutic" in cat_id else "CLASSIC"]
    }
    
    services.append(new_entry)
    added += 1
    print(f"  + {item_id} | {data['title']} | {data['duration']}dk | €{data['price']}")

# Save
with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(services, f, ensure_ascii=False, indent=4)

print(f"\n✅ Toplam {added} masaj eklendi. Yeni toplam: {len(services)} hizmet.")
