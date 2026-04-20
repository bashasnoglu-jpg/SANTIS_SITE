"""
tools/cms_slot_inject.py
Bulk-injects data-cms-slot attributes and cms-image-loader.js into ALL service detail pages.
Works on files that contain 'cin-visual-img' class (service detail template).
"""
import os
import re
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TR_DIR = os.path.join(ROOT, "tr")

LOADER_TAG = '<script defer="" src="/assets/js/cms-image-loader.js?v=9.1"></script>'

modified = 0
skipped = 0

for html_path in glob.glob(os.path.join(TR_DIR, "**", "*.html"), recursive=True):
    # Skip index pages (category pages, not service detail)
    basename = os.path.basename(html_path)
    if basename == "index.html":
        continue
    
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Only process files with cin-visual-img (service detail template)
    if "cin-visual-img" not in content:
        skipped += 1
        continue
    
    # Extract SERVICE_ID from window.SERVICE_ID = 'xxx'
    sid_match = re.search(r"window\.SERVICE_ID\s*=\s*['\"]([^'\"]+)['\"]", content)
    if not sid_match:
        # Try data-service-id attribute
        sid_match = re.search(r'data-service-id="([^"]+)"', content)
    
    if not sid_match:
        print(f"  SKIP (no SERVICE_ID): {html_path}")
        skipped += 1
        continue
    
    service_id = sid_match.group(1)
    original = content
    
    # 1. Add data-cms-slot to cin-visual-img if not already present
    if 'data-cms-slot' not in content:
        # Replace: class="cin-visual-img" -> data-cms-slot="{service_id}" class="cin-visual-img"
        content = content.replace(
            'class="cin-visual-img"',
            f'data-cms-slot="{service_id}" class="cin-visual-img"'
        )
    
    # 2. Add cms-image-loader.js if not already present
    if 'cms-image-loader.js' not in content:
        # Insert before </body>
        content = content.replace(
            '</body>',
            f'{LOADER_TAG}\n</body>'
        )
    
    if content != original:
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(content)
        modified += 1
        print(f"  ✅ {service_id}: {basename}")
    else:
        skipped += 1

print(f"\nDone: {modified} modified, {skipped} skipped")
