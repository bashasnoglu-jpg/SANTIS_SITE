"""SANTIS MASS FIX v2 - Fix all remaining issues found by deep audit"""
import re, json
from pathlib import Path

ROOT = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE")
fixes = []

# ═══════════════════════════════════════════════════════
# FIX 1: Remove santis-core.js from ALL language index files
# ═══════════════════════════════════════════════════════
print("🔧 [1/4] Removing santis-core.js from language pages...")
for lang in ["en", "de", "fr", "ru", "sr"]:
    index = ROOT / lang / "index.html"
    if not index.exists():
        continue
    content = index.read_text(encoding='utf-8', errors='ignore')
    if 'santis-core.js' in content:
        # Remove the script tag
        new_content = re.sub(r'\s*<script[^>]*santis-core\.js[^>]*>\s*</script>', '', content)
        index.write_text(new_content, encoding='utf-8')
        fixes.append(f"  ✅ /{lang}/index.html: santis-core.js removed")
    else:
        fixes.append(f"  ⏭️ /{lang}/index.html: already clean")

for f in fixes:
    print(f)

# ═══════════════════════════════════════════════════════
# FIX 2: Fix remaining relative paths in JS files
# ═══════════════════════════════════════════════════════
print("\n🔧 [2/4] Fixing remaining relative asset paths in JS files...")
js_files_to_fix = [
    "app.js", "concierge-engine.js", "core_data_loader.js", "css-loader.js",
    "gallery-loader.js", "home-products.js", "image-checker.js", 
    "product-loader.js", "santis-live-test.js", "santis-nav.js",
    "service-detail-loader.js", "services-data.js", "shop.js"
]

for js_name in js_files_to_fix:
    js_path = ROOT / "assets" / "js" / js_name
    if not js_path.exists():
        print(f"  ⏭️ {js_name}: not found")
        continue
    content = js_path.read_text(encoding='utf-8', errors='ignore')
    
    # Only fix actual file paths, not things like `fetch('assets/data/...')` 
    # which should become `/assets/data/...`
    count = 0
    
    # Pattern: quote + assets/ (not preceded by /)
    # But be careful: don't match things like `const path = "assets/"` in comments
    for old_pattern in ['"assets/', "'assets/"]:
        new_pattern = old_pattern[0] + '/' + old_pattern[1:]
        c = content.count(old_pattern)
        count += c
        content = content.replace(old_pattern, new_pattern)
    
    if count > 0:
        js_path.write_text(content, encoding='utf-8')
        print(f"  ✅ {js_name}: {count} paths fixed")
    else:
        print(f"  ⏭️ {js_name}: already clean")

# ═══════════════════════════════════════════════════════
# FIX 3: Fix site_content.json BOM encoding
# ═══════════════════════════════════════════════════════
print("\n🔧 [3/4] Fixing site_content.json BOM...")
site_json = ROOT / "data" / "site_content.json"
if site_json.exists():
    content = site_json.read_text(encoding='utf-8-sig', errors='ignore')
    # Rewrite without BOM
    site_json.write_text(content, encoding='utf-8')
    # Validate JSON
    try:
        json.loads(content)
        print("  ✅ site_content.json: BOM removed, JSON valid")
    except json.JSONDecodeError as e:
        print(f"  ⚠️ site_content.json: BOM removed but JSON error: {e}")

# ═══════════════════════════════════════════════════════
# FIX 4: Fix remaining relative paths in JSON data
# ═══════════════════════════════════════════════════════
print("\n🔧 [4/4] Final pass on JSON relative paths...")
json_files = list((ROOT / "assets" / "data").glob("*.json")) + list((ROOT / "data").glob("*.json"))

for jf in json_files:
    content = jf.read_text(encoding='utf-8-sig', errors='ignore')
    count = 0
    for old in ['"assets/', "'assets/"]:
        new = old[0] + '/' + old[1:]
        c = content.count(old)
        count += c
        content = content.replace(old, new)
    
    if count > 0:
        content = content.lstrip('\ufeff')  # remove BOM if present
        jf.write_text(content, encoding='utf-8')
        print(f"  ✅ {jf.name}: {count} paths fixed")

print("\n✅ ALL FIXES COMPLETE!")
