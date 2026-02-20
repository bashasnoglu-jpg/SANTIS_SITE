import os

BASE_DIR = os.getcwd()

# Same target services as fix_registry.py
TARGET_SERVICES = [
    "acne-balance.html", "anti-aging-pro.html", "barrier-repair.html", 
    "brightening-spot.html", "classic-facial.html", "collagen-lift.html", 
    "deep-cleanse.html", "detox-charcoal.html", "enzyme-peel.html", 
    "eye-contour.html", "glass-skin.html", "gold-mask-ritual.html", 
    "hyaluron-hydrate.html", "led-rejuvenation.html", "lip-care.html", 
    "men-facial.html", "micro-polish.html", "oxygen-boost.html", 
    "sensitive-soothe.html", "vitamin-c-glow.html", "index.html" 
]

DUPLICATE_DIRS = ["hizmetler", "services"]

def cleanup():
    deleted_count = 0
    with open("missing_routes_full.txt", "r", encoding="utf-8") as f:
        files = [line.strip() for line in f if line.strip()]

    for rel_path in files:
        # Check if this file is one of the target services in a duplicate dir
        parts = rel_path.split("/") # e.g. ["tr", "hizmetler", "acne-balance.html"]
        if len(parts) >= 2:
            folder = parts[-2]
            filename = parts[-1]
            
            if filename in TARGET_SERVICES and folder in DUPLICATE_DIRS:
                # Candidate for deletion.
                # Double check that we aren't deleting the CANONICAL one in 'services' if it's supposed to be there.
                # But for TARGET_SERVICES, we moved them to 'cilt-bakimi', 'skincare', 'hautpflege', 'soins-visage'.
                # OR 'services' might be valid for RU?
                # In fix_registry.py, RU used 'skincare' (found: skincare/acne-balance.html). 
                # Wait, looking at debug output of fix_registry (Step 2382):
                # ✅ Found RU: skincare/acne-balance.html
                # So RU uses 'skincare'. 'services' folder in RU is likely duplicate.
                
                # EXCEPT: 'index.html'
                # index.html in 'hizmetler' might be valid for TR.
                # In fix_registry output:
                # ✅ Found TR: cilt-bakimi/index.html
                # So 'tr/hizmetler/index.html' is duplicate.
                
                full_path = os.path.join(BASE_DIR, rel_path)
                if os.path.exists(full_path):
                    try:
                        os.remove(full_path)
                        print(f"Deleted duplicate: {rel_path}")
                        deleted_count += 1
                    except Exception as e:
                        print(f"Error deleting {rel_path}: {e}")

    print(f"\nCleaned {deleted_count} duplicate files.")

if __name__ == "__main__":
    cleanup()
