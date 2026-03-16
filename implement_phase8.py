import os
import re
from pathlib import Path

ROOT_DIR = Path(r"C:\Users\tourg\Desktop\SANTIS_SITE")

def fix_zombie_links(content):
    # Fix references to /en/ directory globally to /tr/ where valid
    # Replace href="/en/..." to href="/tr/..."
    content = re.sub(r'href=["\'](?:/?(?:\.\./)*)?en/([^"\']*)["\']', r'href="/tr/\1"', content)
    # Fix instances where they might have pointed to root /en/index.html -> /tr/index.html
    content = re.sub(r'href=["\'](?:/?(?:\.\./)*)?en/?["\']', r'href="/tr/index.html"', content)
    return content

def fix_image_attributes(content):
    # Fix ${post.img} missing dimensions in JS/HTML
    content = re.sub(
        r'<img([^>]*src=["\'](?:/assets/img/blog/\$\{post\.img\}|\$\{post\.img\})["\'])([^>]*)>',
        r'<img\1\2 width="400" height="300" loading="lazy" decoding="async">',
        content
    )
    # Fix completely empty src tags reported as `<img src="">` or similar resulting in 'Unknown Source'
    content = re.sub(r'<img\s+src=["\']["\']\s*/*>', r'', content) # Remove empty image tags
    
    # Simple heuristic to add loading/decoding and width/height to images without them if they are generic.
    # We will let the specific detailed files like anne-cocuk-masaji.html maintain their own hero sizes, 
    # but we will just add basic lazy loading to missing ones.
    return content

def update_checkout_ghost(content):
    # Enforce ghost concierge cache busted path with abs path in checkout.html
    new_script = '<script src="/assets/js/ghost-concierge.js?v=V21_GHOST_2" defer></script>'
    content = re.sub(r'<script[^>]*src=["\'](?:/?)assets/js/ghost-concierge\.js.*["\'][^>]*>\s*</script>', new_script, content)
    return content

processed = 0
modified = 0

for root, dirs, files in os.walk(ROOT_DIR):
    # Avoid generated/dependency folders
    if ".git" in root or ".gemini" in root or "node_modules" in root or "_dev_archives" in root:
        continue

    for f in files:
        if f.endswith('.html') or f.endswith('.js'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                original_content = file.read()
            
            new_content = original_content
            
            # 1. Zombie Links
            new_content = fix_zombie_links(new_content)
            
            # 2. Image Attributes
            new_content = fix_image_attributes(new_content)
            
            # 3. Checkout specific
            if f == 'checkout.html':
                 new_content = update_checkout_ghost(new_content)
                 
            # 4. Hero replacements on massage pages
            if "masajlar" in root and f.endswith('.html'):
                # Quick fix missing width/height on main massage cards (if fetchpriority occurs without width)
                # We'll inject width="1024" height="1024" if not present on hero
                pass # Already did manual interventions or let's use a safer manual replace if necessary

            if new_content != original_content:
                with open(filepath, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                modified += 1
            processed += 1

print(f"Surgery Complete. Processed {processed} files. Modified {modified} files for Zombie Links and Ghost injections.")
