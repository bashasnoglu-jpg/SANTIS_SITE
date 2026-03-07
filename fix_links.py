import os
import re

site_dir = r"c:\Users\tourg\Desktop\SANTIS_SITE"

# Known fixes based on the report:
# 1. Double slashes at the end of localized links: "https://santisclub.com/de/massagen/anti-stress-massage//"
# 2. Link fonts.googleapis.com missing href or malformed
# 3. Component navbars linking to just "index.html" instead of "/index.html"
# 4. Old CSS query strings ?v=5.1 -> removing or updating

def fix_html_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Fix double trailing slashes on santisclub.com links
    content = re.sub(r'(https://santisclub\.com/[^"\s]+)//"', r'\1/"', content)

    # 2. Fix component index.html links to root /index.html if they are just "index.html"
    # Wait, the navbar files are at components/navbar.html. They link to "index.html". 
    # It should be "/index.html" so it works from any subdirectory.
    content = re.sub(r'href="index\.html"', 'href="/index.html"', content)
    content = re.sub(r"href='index\.html'", "href='/index.html'", content)
    
    # 3. Replace old style.css paths that 404
    content = re.sub(r'href="\.\./\.\./\.\./assets/css/style\.css\?v=[^"]+"', 'href="/assets/css/style.css"', content)
    content = re.sub(r'href="\.\./\.\./assets/css/style\.css\?v=[^"]+"', 'href="/assets/css/style.css"', content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

fixed_count = 0
for root, dirs, files in os.walk(site_dir):
    if "backup" in root or "_dev_archives" in root:
        continue
    for file in files:
        if file.endswith(".html"):
            if fix_html_file(os.path.join(root, file)):
                fixed_count += 1

print(f"Fixed structural link issues in {fixed_count} HTML files.")
