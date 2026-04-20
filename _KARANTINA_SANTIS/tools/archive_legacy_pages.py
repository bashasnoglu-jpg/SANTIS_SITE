import json
import os
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SITE_JSON = BASE_DIR / "data" / "site_content.json"
ARCHIVE_DIR = BASE_DIR / "_legacy_archive"

# Folder mappings (Must match check_missing_pages.py / restore_pages.py)
FOLDER_MAP = {
    "tr": { "hammam": "hamam", "massages": "masajlar", "skincare": "cilt-bakimi", "products": "urunler", "services": "hizmetler" },
    "en": { "hammam": "hammam", "massages": "massages", "skincare": "services", "products": "products", "services": "services" },
    "de": { "hammam": "hammam", "massages": "massagen", "skincare": "services", "products": "produkte", "services": "services" },
    "fr": { "hammam": "hammam", "massages": "massages", "skincare": "services", "products": "produits", "services": "services" },
    "ru": { "hammam": "hammam", "massages": "massages", "skincare": "services", "products": "products", "services": "services" }
}

def archive_legacy():
    print("📦 Starting legacy archival...")
    
    if not SITE_JSON.exists():
        print(f"❌ Error: {SITE_JSON} not found.")
        return

    try:
        data = json.loads(SITE_JSON.read_text(encoding="utf-8-sig"))
    except Exception as e:
        print(f"❌ Error reading JSON: {e}")
        return

    catalogs = data.get("catalogs", {})
    languages = ["tr", "en", "de", "fr", "ru"]

    # Build set of expected paths
    expected_paths = set()
    for lang in languages:
        folder_map = FOLDER_MAP.get(lang, {})
        for section_key, section_data in catalogs.items():
            folder_name = folder_map.get(section_key, section_key)
            items = section_data.get("items", [])
            for item in items:
                slug = item.get("slug") or item.get("id")
                if slug:
                     expected_paths.add(f"{lang}/{folder_name}/{slug}.html")

    archived_count = 0
    
    # Iterate filesystem and move non-expected files
    for lang in languages:
        folder_map = FOLDER_MAP.get(lang, {})
        for section_key in catalogs.keys():
            folder_name = folder_map.get(section_key, section_key)
            
            target_dir = BASE_DIR / lang / folder_name
            if not target_dir.exists():
                continue
                
            for file_path in target_dir.glob("*.html"):
                if file_path.name == "index.html":
                    continue # Keep index files for now? Or allow them to be archived if not in JSON?
                             # Typically index.html is category page, might not be in 'items'.
                
                rel_path = f"{lang}/{folder_name}/{file_path.name}"
                
                if rel_path not in expected_paths:
                    # Archive it
                    dest_path = ARCHIVE_DIR / rel_path
                    dest_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    try:
                        shutil.move(str(file_path), str(dest_path))
                        print(f"Moved: {rel_path} -> _legacy_archive")
                        archived_count += 1
                    except Exception as e:
                        print(f"Error moving {rel_path}: {e}")

    print(f"✅ Archived {archived_count} files.")

if __name__ == "__main__":
    archive_legacy()
