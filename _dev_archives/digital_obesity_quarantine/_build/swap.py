"""Swap all built pages to live site, creating directories as needed."""
import shutil
from pathlib import Path

output = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE\_build\output")
live = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE")

count = 0
for f in output.rglob("*.html"):
    dest = live / f.relative_to(output)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(str(f), str(dest))
    count += 1

print(f"Swapped {count} pages")
