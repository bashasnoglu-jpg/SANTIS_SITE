import os
import json

BASE_DIR = os.getcwd()
ROUTES_FILE = os.path.join(BASE_DIR, "assets", "data", "available-routes.json")
BACKUP_FILE = os.path.join(BASE_DIR, "assets", "data", "available-routes.backup.json")

# TARGET SERVICES TO FIX (from debug_routes output)
TARGET_SERVICES = [
    "acne-balance.html", "anti-aging-pro.html", "barrier-repair.html", 
    "brightening-spot.html", "classic-facial.html", "collagen-lift.html", 
    "deep-cleanse.html", "detox-charcoal.html", "enzyme-peel.html", 
    "eye-contour.html", "glass-skin.html", "gold-mask-ritual.html", 
    "hyaluron-hydrate.html", "led-rejuvenation.html", "lip-care.html", 
    "men-facial.html", "micro-polish.html", "oxygen-boost.html", 
    "sensitive-soothe.html", "vitamin-c-glow.html", "index.html" 
]

# Potential Folder Names per Language
SEARCH_DIRS = {
    "tr": ["cilt-bakimi", "hizmetler"],
    "en": ["skincare", "services"],
    "de": ["hautpflege", "services", "skincare"],
    "fr": ["soins-visage", "services", "skincare"],
    "ru": ["skincare", "services", "uhod-za-licom"]
}

def fix_registry():
    # 1. Load Registry
    with open(ROUTES_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 2. Iterate and Fix
    print(f"🔍 Scanning for {len(TARGET_SERVICES)} services...")

    new_entries = {}
    keys_to_remove = []

    for filename in TARGET_SERVICES:
        # Determine Canonical Key (prefer skincare/...)
        canonical_key = f"skincare/{filename}"
        
        entry = {}
        
        # Auto-discover correct path for each lang
        for lang, folders in SEARCH_DIRS.items():
            found_path = None
            for folder in folders:
                rel_path = f"{lang}/{folder}/{filename}"
                full_path = os.path.join(BASE_DIR, rel_path)
                if os.path.exists(full_path):
                    # Found it!
                    found_path = f"{folder}/{filename}" # Store as "folder/file" (no lang prefix in value)
                    print(f"  ✅ Found {lang.upper()}: {found_path}")
                    break
            
            if found_path:
                entry[lang] = found_path
            # If not found, check if it was in the old registry under "hizmetler/" or "skincare/"
            elif not found_path:
                 # Fallback: Check existing data
                 old_key_hiz = f"hizmetler/{filename}"
                 old_key_skin = f"skincare/{filename}"
                 
                 val = None
                 if old_key_hiz in data and lang in data[old_key_hiz]:
                     val = data[old_key_hiz][lang]
                 elif old_key_skin in data and lang in data[old_key_skin]:
                     val = data[old_key_skin][lang]
                 
                 if val:
                     # Check if THIS path exists
                     check_full = os.path.join(BASE_DIR, lang, val)
                     if os.path.exists(check_full):
                         entry[lang] = val
                         print(f"  ⚠️ Kept existing {lang.upper()}: {val}")

        if entry:
            new_entries[canonical_key] = entry
            
            # Mark old keys for deletion
            if f"hizmetler/{filename}" in data:
                keys_to_remove.append(f"hizmetler/{filename}")
            if f"skincare/{filename}" in data and canonical_key != f"skincare/{filename}":
                keys_to_remove.append(f"skincare/{filename}")

    # 3. Apply Updates
    # Remove old
    for k in keys_to_remove:
        if k in data:
            del data[k]
    
    # Add/Update new
    for k, v in new_entries.items():
        data[k] = v

    # 4. Save
    # Backup first
    import shutil
    shutil.copy(ROUTES_FILE, BACKUP_FILE)
    
    with open(ROUTES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, sort_keys=True)

    print(f"\n✨ Consolidated {len(new_entries)} entries.")
    print(f"🗑️ Removed {len(keys_to_remove)} old entries.")

if __name__ == "__main__":
    fix_registry()
