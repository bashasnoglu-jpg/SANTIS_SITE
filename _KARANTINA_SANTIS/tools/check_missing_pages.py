import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SITE_JSON = BASE_DIR / "data" / "site_content.json"
REPORT_DIR = BASE_DIR / "reports"
REPORT_FILE = REPORT_DIR / "missing_pages_report.json"

# Folder mappings per language
# Based on sitemap.xml observations
FOLDER_MAP = {
    "tr": {
        "hammam": "hamam",
        "massages": "masajlar",
        "skincare": "cilt-bakimi",
        "products": "urunler",
        "services": "hizmetler"
    },
    "en": {
        "hammam": "hammam",
        "massages": "massages",
        "skincare": "services", # or skincare? sitemap showed 'services' for sothys stuff? 
        # Sitemap: en/services/abhyanga-massage, en/services/shirodhara...
        # But maybe skincare goes to services too?
        "products": "products",
        "services": "services"
    },
    "de": {
        "hammam": "hammam",
        "massages": "massagen",
        "skincare": "services",
        "products": "produkte",
        "services": "services"
    },
    "fr": {
        "hammam": "hammam",
        "massages": "massages",
        "skincare": "services",
        "products": "produits",
        "services": "services"
    },
    "ru": {
        "hammam": "hammam",
        "massages": "massages",
        "skincare": "services",
        "products": "products", # assumption
        "services": "services"
    }
}

def check_missing():
    if not SITE_JSON.exists():
        print(f"Error: {SITE_JSON} not found.")
        return

    try:
        data = json.loads(SITE_JSON.read_text(encoding="utf-8-sig"))
    except Exception as e:
        print(f"Error reading JSON: {e}")
        return

    missing = []
    existing = 0
    checked_paths = set()

    languages = ["tr", "en", "de", "fr", "ru"]
    sections_to_check = ["hammam", "massages", "skincare", "services"] 
    # 'services' key might contain scattered items if not in other cats

    catalogs = data.get("catalogs", {})
    if not catalogs:
        print("No catalogs found")
        return

    for lang in languages:
        folder_map = FOLDER_MAP.get(lang, {})
        print(f"Checking lang: {lang}...")

        # catalogs has keys: hammam, massages, skincare
        for section_key, section_data in catalogs.items():
            # section_key: "massages", "hammam", etc.
            
            # Map to folder name
            folder_name = folder_map.get(section_key, section_key)
            
            items = section_data.get("items", [])
            if not items:
                continue

            # print(f"Found {len(items)} items in {section_key}")
            
            for item in items:
                slug = item.get("slug")
                if not slug:
                    # Fallback to ID if slug missing
                    slug = item.get("id")
                    
                if not slug:
                   continue

                # Construct path
                # {lang}/{folder}/{slug}.html
                rel_path = f"{lang}/{folder_name}/{slug}.html"
                
                if rel_path in checked_paths:
                    continue
                checked_paths.add(rel_path)
                
                full_path = BASE_DIR / rel_path
                
                if full_path.exists():
                    existing += 1
                else:
                    missing.append(rel_path)

    REPORT_DIR.mkdir(exist_ok=True)
    report_data = {
        "missing": missing,
        "total_checked": existing + len(missing),
        "existing_count": existing,
        "missing_count": len(missing)
    }
    
    REPORT_FILE.write_text(json.dumps(report_data, indent=2), encoding="utf-8")
    print(f"Checked {existing + len(missing)} paths. Found {len(missing)} missing.")
    print(f"Report saved to {REPORT_FILE}")

if __name__ == "__main__":
    check_missing()
