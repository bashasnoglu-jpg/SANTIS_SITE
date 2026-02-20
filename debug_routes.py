import os
import json

BASE_DIR = os.getcwd()
ROUTES_FILE = os.path.join(BASE_DIR, "assets", "data", "available-routes.json")
ACTIVE_LANGS = ["tr", "en", "de", "fr", "ru"]

def check_routes():
    with open(ROUTES_FILE, "r", encoding="utf-8") as f:
        routes = json.load(f)

    reverse = {}
    for canonical_key, lang_paths in routes.items():
        for lang, path in lang_paths.items():
            if lang in ACTIVE_LANGS:
                full_rel = f"{lang}/{path}"
                reverse[full_rel] = canonical_key

    missing_files = []
    
    for lang in ACTIVE_LANGS:
        lang_dir = os.path.join(BASE_DIR, lang)
        if not os.path.isdir(lang_dir):
            continue
            
        for root, dirs, files in os.walk(lang_dir):
            for fname in files:
                if fname.endswith(".html"):
                    full = os.path.join(root, fname)
                    rel = os.path.relpath(full, BASE_DIR).replace("\\", "/")
                    
                    if rel not in reverse:
                        missing_files.append(rel)

    print(f"Found {len(missing_files)} files missing from available-routes.json:")
    for f in missing_files[:20]:
        print(f" - {f}")

if __name__ == "__main__":
    check_routes()
