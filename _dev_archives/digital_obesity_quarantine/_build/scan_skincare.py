"""Map hand-written skincare file names to JSON titles."""
import json, re
from pathlib import Path

d = json.loads(Path(r"c:\Users\tourg\Desktop\SANTIS_SITE\data\site_content.json").read_text(encoding="utf-8"))
items = d.get("catalogs", {}).get("skincare", {}).get("items", [])

# Existing hand-written files (EN slugs)
en_files = sorted(f.stem for f in Path(r"c:\Users\tourg\Desktop\SANTIS_SITE\en\skincare").glob("*.html") if f.stem != "index")
tr_files = sorted(f.stem for f in Path(r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\cilt-bakimi").glob("*.html") if f.stem != "index")

print(f"JSON items: {len(items)}")
print(f"EN files:   {len(en_files)}")
print(f"TR files:   {len(tr_files)}")
print()

# Show EN slugs (these are the ones we should USE as canonical slugs)
print("HAND-WRITTEN EN SLUGS:")
for s in en_files:
    print(f"  {s}")

print()
print("JSON TITLES → SUGGESTED MAPPING:")
for item in items:
    title = item.get("title", "?")
    # Try to match to EN slug
    print(f"  {title:35s} → ?")
