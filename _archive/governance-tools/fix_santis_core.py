"""Remove non-existent santis-core.js script tags from all language index files"""
from pathlib import Path

ROOT = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE")
TARGET = '<script src="../assets/js/santis-core.js"></script> <!-- ENABLE MOOD INTRO -->'
REPLACEMENT = '<!-- santis-core.js removed (file does not exist) -->'

fixed = 0
for lang in ["en", "de", "fr", "ru", "sr", "tr"]:
    idx = ROOT / lang / "index.html"
    if not idx.exists():
        continue
    content = idx.read_text(encoding="utf-8", errors="ignore")
    if TARGET in content:
        content = content.replace(TARGET, REPLACEMENT)
        idx.write_text(content, encoding="utf-8")
        fixed += 1
        print(f"FIXED: /{lang}/index.html")
    else:
        print(f"SKIP: /{lang}/index.html (not found)")

print(f"\nTotal fixed: {fixed} files")
