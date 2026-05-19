"""Fix ALL relative asset paths across JSON and JS files"""
import os, re
from pathlib import Path

ROOT = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE")

# Target files with relative paths
targets = [
    ROOT / "assets" / "data" / "global-trends.json",
    ROOT / "assets" / "data" / "home_data.json",
    ROOT / "assets" / "data" / "products-sothys.json",
    ROOT / "assets" / "data" / "products-atelier.json",
    ROOT / "data" / "site_content.json",
]

total = 0
for f in targets:
    if not f.exists():
        print(f"SKIP (not found): {f.name}")
        continue
    content = f.read_text(encoding="utf-8", errors="ignore")
    
    # Fix "assets/ without leading / (but don't double-prefix existing /assets/)
    # Pattern: a quote followed by assets/ (not /assets/)
    old_count = 0
    for pattern in ['"assets/', "'assets/"]:
        c = content.count(pattern)
        if c > 0:
            replacement = pattern[0] + '/' + pattern[1:]  # Add / after quote
            content = content.replace(pattern, replacement)
            old_count += c
    
    if old_count > 0:
        f.write_text(content, encoding="utf-8")
        total += old_count
        print(f"FIXED {f.name}: {old_count} relative paths")
    else:
        print(f"OK {f.name}: no relative paths")

print(f"\nTotal fixed: {total}")
