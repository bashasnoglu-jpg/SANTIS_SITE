"""
Sprint 3 — Add revenue metadata to all services in site_content.json.
Fields: intensity, room_type, featured_score, sort_priority
"""
import json
from pathlib import Path

DATA_FILE = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE\data\site_content.json")

# Revenue metadata per slug (EXACT slugs from site_content.json)
METADATA = {
    # === HAMMAM (7) ===
    "kese-kopuk":          {"intensity": "medium", "room_type": "single", "featured_score": 95, "sort_priority": 1},
    "kopuk-masaji":        {"intensity": "soft",   "room_type": "single", "featured_score": 60, "sort_priority": 10},
    "tuz-peeling":         {"intensity": "medium", "room_type": "single", "featured_score": 65, "sort_priority": 7},
    "kahve-detox":         {"intensity": "medium", "room_type": "single", "featured_score": 75, "sort_priority": 5},
    "osmanli-ritueli":     {"intensity": "medium", "room_type": "single", "featured_score": 90, "sort_priority": 2},
    "santis-pasa":         {"intensity": "strong", "room_type": "single", "featured_score": 85, "sort_priority": 3},
    "gelin-hamami":        {"intensity": "medium", "room_type": "group",  "featured_score": 80, "sort_priority": 4},

    # === MASSAGES — Classic (4) ===
    "klasik-rahatlama":    {"intensity": "soft",   "room_type": "single", "featured_score": 80, "sort_priority": 3},
    "anti-stress":         {"intensity": "medium", "room_type": "single", "featured_score": 72, "sort_priority": 6},
    "aromaterapi":         {"intensity": "soft",   "room_type": "single", "featured_score": 92, "sort_priority": 1},
    "sicak-tas":           {"intensity": "medium", "room_type": "single", "featured_score": 88, "sort_priority": 2},

    # === MASSAGES — Regional (4) ===
    "klasik-sirt":         {"intensity": "medium", "room_type": "single", "featured_score": 58, "sort_priority": 13},
    "bas-boyun-omuz":      {"intensity": "medium", "room_type": "single", "featured_score": 70, "sort_priority": 7},
    "isvec-full-body":     {"intensity": "soft",   "room_type": "single", "featured_score": 65, "sort_priority": 8},
    "refleksoloji":        {"intensity": "medium", "room_type": "single", "featured_score": 68, "sort_priority": 9},

    # === MASSAGES — Therapeutic (3) ===
    "lenf-drenaj":         {"intensity": "soft",   "room_type": "single", "featured_score": 62, "sort_priority": 11},
    "anti-selulit":        {"intensity": "strong", "room_type": "single", "featured_score": 55, "sort_priority": 14},

    # === MASSAGES — Asian (4) ===
    "shiatsu":             {"intensity": "medium", "room_type": "single", "featured_score": 82, "sort_priority": 4},
    "thai":                {"intensity": "strong", "room_type": "single", "featured_score": 90, "sort_priority": 2},
    "bali":                {"intensity": "soft",   "room_type": "single", "featured_score": 86, "sort_priority": 3},

    # === MASSAGES — Sports/Deep (5) ===
    "derin-doku":          {"intensity": "strong", "room_type": "single", "featured_score": 85, "sort_priority": 4},
    "spor-terapi":         {"intensity": "strong", "room_type": "single", "featured_score": 78, "sort_priority": 5},
    "sirt-terapi":         {"intensity": "medium", "room_type": "single", "featured_score": 55, "sort_priority": 14},
    "tetik-nokta":         {"intensity": "strong", "room_type": "single", "featured_score": 60, "sort_priority": 12},
    "myofascial-release":  {"intensity": "strong", "room_type": "single", "featured_score": 58, "sort_priority": 13},
    "kranyo-sakral":       {"intensity": "soft",   "room_type": "single", "featured_score": 52, "sort_priority": 16},

    # === MASSAGES — Signature/Couples (3) ===
    "signature-rituel":    {"intensity": "medium", "room_type": "single", "featured_score": 95, "sort_priority": 1},
    "cift-senkron":        {"intensity": "medium", "room_type": "couple", "featured_score": 82, "sort_priority": 5},
    "cift-rituel":         {"intensity": "medium", "room_type": "couple", "featured_score": 80, "sort_priority": 6},

    # === MASSAGES — Kids & Family (2) ===
    "kids-nazik":          {"intensity": "soft",   "room_type": "single", "featured_score": 55, "sort_priority": 15},
    "anne-cocuk":           {"intensity": "soft",   "room_type": "couple", "featured_score": 60, "sort_priority": 14},
}

def main():
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    updated = 0
    missing = []

    for sec_key, section in data.get("catalogs", {}).items():
        for item in section.get("items", []):
            slug = item.get("slug", "")
            if not slug:
                continue  # Skip skincare items without slugs
            if slug in METADATA:
                for k, v in METADATA[slug].items():
                    item[k] = v
                updated += 1
            else:
                missing.append(f"{sec_key}/{slug}")

    # Write back
    DATA_FILE.write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

    print(f"Updated {updated} services with revenue metadata")
    if missing:
        print(f"Missing mappings: {missing}")

    # Quick verify
    for sec_key, section in data.get("catalogs", {}).items():
        for item in section.get("items", []):
            slug = item.get("slug", "")
            if not slug:
                continue
            fs = item.get("featured_score", "MISS")
            print(f"  {slug:25s} feat={str(fs):4s} int={item.get('intensity','?'):8s} room={item.get('room_type','?'):8s} sort={item.get('sort_priority','?')}")

if __name__ == "__main__":
    main()
