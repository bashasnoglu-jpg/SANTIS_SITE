import json
from pathlib import Path

path = Path("data/site_content.json")
try:
    data = json.load(path.open(encoding="utf-8-sig"))
    if "catalogs" in data:
        print("Keys in catalogs:", list(data["catalogs"].keys()))
        for key in data["catalogs"]:
            print(f"Inside catalogs['{key}']: keys -> {list(data['catalogs'][key].keys())}")
            
    # Also check 'global' just in case
    if "global" in data:
        print("Keys in global:", list(data["global"].keys()))

except Exception as e:
    print("Error:", e)
