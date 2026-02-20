"""Quick fix for remaining broken links after card_fix.py round 1."""
import os, re
from pathlib import Path

BASE = Path(__file__).resolve().parent
stats = {"fixed": 0, "removed_related": 0}

svc_dir_pattern = re.compile(r'href="/(en|de|fr|ru)/services/"')

broken_related = [
    "/tr/hamam/kahve-peeling.html",
    "/tr/hamam/bal-masaji.html",
    "/tr/hamam/yosun-bakimi.html",
]

for fp in BASE.rglob("*.html"):
    rel = str(fp.relative_to(BASE))
    if any(d in rel for d in ["admin","node_modules",".git","_backup","venv","__pycache__"]):
        continue

    try:
        with open(fp, "r", encoding="utf-8", errors="replace") as f:
            content = original = f.read()
    except:
        continue

    # Fix 1: /XX/services/ directory links → /XX/index.html
    for m in svc_dir_pattern.finditer(original):
        lang = m.group(1)
        old = f'/{lang}/services/"'
        new = f'/{lang}/index.html"'
        content = content.replace(old, new, 1)
        stats["fixed"] += 1

    # Fix 2: /en/services/ from TR pages  
    if '/en/services/"' in content:
        content = content.replace('/en/services/"', '/tr/hizmetler/"')
        stats["fixed"] += 1

    # Fix 3: Remove broken related links
    for broken in broken_related:
        pattern = re.compile(
            r'\s*<a\s+href="' + re.escape(broken) + r'"[^>]*>[^<]*</a>\s*'
        )
        if pattern.search(content):
            content = pattern.sub("\n", content)
            stats["removed_related"] += 1

    if content != original:
        with open(fp, "w", encoding="utf-8") as f:
            f.write(content)

print(f"Fixed service dir links: {stats['fixed']}")
print(f"Removed broken related: {stats['removed_related']}")
