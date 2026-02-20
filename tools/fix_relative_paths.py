"""Check and fix remaining relative image paths in JS files"""
from pathlib import Path

ROOT = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\js")

for name in ["fallback_data.js", "app.js"]:
    f = ROOT / name
    content = f.read_text(encoding="utf-8", errors="ignore")
    
    old = '"img": "assets/'
    new_val = '"img": "/assets/'
    
    rel_count = content.count(old)
    abs_count = content.count(new_val)
    
    if rel_count > 0:
        content = content.replace(old, new_val)
        f.write_text(content, encoding="utf-8")
        print(f"FIXED {name}: {rel_count} relative -> absolute")
    else:
        print(f"OK {name}: {abs_count} absolute paths, 0 relative")
