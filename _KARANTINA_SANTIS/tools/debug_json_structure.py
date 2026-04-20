import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SITE_JSON = BASE_DIR / "data" / "site_content.json"

def debug_structure():
    try:
        data = json.loads(SITE_JSON.read_text(encoding="utf-8-sig"))
    except Exception as e:
        print(f"Error: {e}")
        return

    print("Top level keys:", list(data.keys()))
    
    for lang in ["tr", "en", "de", "fr", "ru", "global"]:
        if lang in data:
            print(f"\nKeys in '{lang}':")
            keys = list(data[lang].keys())
            print(keys)
            
            # Check for massages/hammam specifically
            if "massages" in data[lang]:
                print(f"  -> Found 'massages' in {lang}")
            if "hammam" in data[lang]:
                print(f"  -> Found 'hammam' in {lang}")

if __name__ == "__main__":
    debug_structure()
