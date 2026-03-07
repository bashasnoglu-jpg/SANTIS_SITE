import json

JSON_PATH = r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\data\services.json"

with open(JSON_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

kids_keywords = ["anne", "kids", "cocuk", "child"]
updated = 0

for svc in data:
    sid = svc["id"].lower()
    if any(kw in sid for kw in kids_keywords):
        old = svc["categoryId"]
        svc["categoryId"] = "massage-kids"
        title = svc.get("content", {}).get("tr", {}).get("title", svc.get("name", sid))
        print(f"  {sid}: {old} -> massage-kids ({title})")
        updated += 1

with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print(f"\n{updated} items moved to massage-kids")
