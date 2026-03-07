import os
import re

# Defs
REQ_SCRIPTS = [
    r'src=["\']/?assets/js/product-data\.js',
    r'src=["\']/?assets/js/home-products\.js',
    r'src=["\']/?assets/js/card-effects\.js'
]
REQ_DIV = r'class=["\'].*nv-product-grid.*["\']'

PAGES = [
    r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\urunler\index.html",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\masajlar\index.html",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\hamam\index.html",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\cilt-bakimi\index.html"
]

def check_file(path):
    if not os.path.exists(path):
        return f"MISSING: {path}"
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    missing = []
    for s in REQ_SCRIPTS:
        if not re.search(s, content):
            missing.append(f"Script missing: {s}")
            
    if not re.search(REQ_DIV, content):
        missing.append("Container missing: .nv-product-grid")
        
    if missing:
        return f"FAIL: {os.path.basename(path)} -> {', '.join(missing)}"
    return f"PASS: {os.path.basename(path)}"

print("--- STATIC INTEGRITY REPORT ---")
for p in PAGES:
    print(check_file(p))
print("--- END REPORT ---")
