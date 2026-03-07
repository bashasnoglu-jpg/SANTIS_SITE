"""
Sprint 4 — Add slugs and revenue metadata to 20 skincare items.
Uses existing EN file names as canonical slugs.
"""
import json
from pathlib import Path

DATA_FILE = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE\data\site_content.json")

# Slug mapping: JSON title → existing EN filename (canonical slug)
SLUG_MAP = {
    "Klasik Cilt Bakımı":                "classic-facial",
    "Derin Temizleme Bakımı":            "deep-cleanse",
    "Enzim Peeling Bakımı":              "enzyme-peel",
    "Detox Kömür Maske":                 "detox-charcoal",
    "Hyaluron Nem Terapisi":             "hyaluron-hydrate",
    "Vitamin C Glow":                    "vitamin-c-glow",
    "Oksijen Boost Bakımı":              "oxygen-boost",
    "Glass Skin Ritüeli":                "glass-skin",
    "Kolajen Lifting Bakımı":            "collagen-lift",
    "Anti-Aging Pro Bakım":              "anti-aging-pro",
    "LED Rejuvenation":                  "led-rejuvenation",
    "Leke Karşıtı Aydınlatıcı Bakım":   "brightening-spot",
    "Akne & Sebum Denge Bakımı":         "acne-balance",
    "Hassas Cilt Sakinleştirici Bakım":  "sensitive-soothe",
    "Bariyer Onarıcı Bakım":            "barrier-repair",
    "Micro Polish Bakımı":               "micro-polish",
    "Gold Mask Ritüeli":                 "gold-mask-ritual",
    "Göz Çevresi Bakımı":               "eye-contour",
    "Dudak Bakımı":                      "lip-care",
    "Erkek Cilt Bakımı":                 "men-facial",
}

# Revenue metadata per slug
METADATA = {
    "classic-facial":    {"intensity": "soft",   "room_type": "single", "featured_score": 85, "sort_priority": 2},
    "deep-cleanse":      {"intensity": "medium", "room_type": "single", "featured_score": 78, "sort_priority": 4},
    "enzyme-peel":       {"intensity": "medium", "room_type": "single", "featured_score": 65, "sort_priority": 8},
    "detox-charcoal":    {"intensity": "medium", "room_type": "single", "featured_score": 70, "sort_priority": 6},
    "hyaluron-hydrate":  {"intensity": "soft",   "room_type": "single", "featured_score": 82, "sort_priority": 3},
    "vitamin-c-glow":    {"intensity": "soft",   "room_type": "single", "featured_score": 88, "sort_priority": 2},
    "oxygen-boost":      {"intensity": "soft",   "room_type": "single", "featured_score": 72, "sort_priority": 5},
    "glass-skin":        {"intensity": "soft",   "room_type": "single", "featured_score": 92, "sort_priority": 1},
    "collagen-lift":     {"intensity": "medium", "room_type": "single", "featured_score": 80, "sort_priority": 3},
    "anti-aging-pro":    {"intensity": "medium", "room_type": "single", "featured_score": 90, "sort_priority": 1},
    "led-rejuvenation":  {"intensity": "soft",   "room_type": "single", "featured_score": 68, "sort_priority": 7},
    "brightening-spot":  {"intensity": "soft",   "room_type": "single", "featured_score": 75, "sort_priority": 4},
    "acne-balance":      {"intensity": "medium", "room_type": "single", "featured_score": 72, "sort_priority": 5},
    "sensitive-soothe":  {"intensity": "soft",   "room_type": "single", "featured_score": 60, "sort_priority": 9},
    "barrier-repair":    {"intensity": "soft",   "room_type": "single", "featured_score": 58, "sort_priority": 10},
    "micro-polish":      {"intensity": "medium", "room_type": "single", "featured_score": 78, "sort_priority": 4},
    "gold-mask-ritual":  {"intensity": "soft",   "room_type": "single", "featured_score": 95, "sort_priority": 1},
    "eye-contour":       {"intensity": "soft",   "room_type": "single", "featured_score": 55, "sort_priority": 11},
    "lip-care":          {"intensity": "soft",   "room_type": "single", "featured_score": 45, "sort_priority": 14},
    "men-facial":        {"intensity": "medium", "room_type": "single", "featured_score": 62, "sort_priority": 8},
}

def main():
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    updated = 0
    skincare = data.get("catalogs", {}).get("skincare", {})

    for item in skincare.get("items", []):
        title = item.get("title", "")
        if title in SLUG_MAP:
            slug = SLUG_MAP[title]
            item["slug"] = slug
            # Add revenue metadata
            if slug in METADATA:
                for k, v in METADATA[slug].items():
                    item[k] = v
            updated += 1
            print(f"  OK  {title:35s} → {slug}")
        else:
            print(f"  ??  {title:35s} → NO MAPPING")

    DATA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nUpdated {updated}/20 skincare items with slugs + metadata")

if __name__ == "__main__":
    main()
