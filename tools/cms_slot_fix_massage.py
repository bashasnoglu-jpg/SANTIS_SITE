"""Fix remaining massage pages that use data-service-id instead of window.SERVICE_ID"""
import os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TR_DIR = os.path.join(ROOT, "tr", "masajlar")
LOADER = '<script defer="" src="/assets/js/cms-image-loader.js?v=9.1"></script>'
count = 0

for f in glob.glob(os.path.join(TR_DIR, "*.html")):
    bn = os.path.basename(f)
    if bn == "index.html":
        continue
    with open(f, "r", encoding="utf-8") as fh:
        c = fh.read()
    if "cin-visual-img" not in c:
        continue
    if "data-cms-slot" in c:
        continue
    
    sid = re.search(r'data-service-id="([^"]+)"', c)
    if sid:
        sid_val = sid.group(1)
    else:
        sid_val = bn.replace(".html", "")
    
    c = c.replace('class="cin-visual-img"', f'data-cms-slot="{sid_val}" class="cin-visual-img"')
    if "cms-image-loader.js" not in c:
        c = c.replace("</body>", f"{LOADER}\n</body>")
    
    with open(f, "w", encoding="utf-8") as fh:
        fh.write(c)
    count += 1
    print(f"  + {sid_val}: {bn}")

print(f"Fixed {count} massage pages")
