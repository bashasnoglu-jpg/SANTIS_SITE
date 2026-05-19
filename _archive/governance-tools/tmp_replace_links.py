import os
import re

TARGET_DIR = r"c:/Users/tourg/Desktop/SANTIS_SITE"

def replace_links_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = re.sub(r'(href|data-target|src)=[\'"]\/tr\/', lambda m: m.group(1) + '="/', content)
        new_content = new_content.replace('/tr/index.html', '/')
        new_content = new_content.replace('/tr/hakkimizda/index.html', '/hakkimizda.html')
        new_content = new_content.replace('/tr/galeri/index.html', '/galeri.html')
        new_content = new_content.replace('/tr/urunler/index.html', '/magaza.html')
        new_content = new_content.replace('/tr/urunler/detay.html', '/urunler/detay.html') # fix missing
        new_content = new_content.replace('/tr/urunler/', '/magaza.html')
        new_content = new_content.replace('/tr/magaza/index.html', '/magaza.html')
        new_content = new_content.replace('/tr/hamam/index.html', '/hamam.html')
        new_content = new_content.replace('/tr/hamam/', '/hamam.html')
        # new_content = new_content.replace('/tr/masajlar/index.html', '/masaj.html')
        # new_content = new_content.replace('/tr/masajlar/', '/masaj.html')
        new_content = new_content.replace('/tr/cilt-bakimi/index.html', '/cilt-bakimi.html')
        new_content = new_content.replace('/tr/cilt-bakimi/', '/cilt-bakimi.html')
        new_content = new_content.replace('/tr/rituals/index.html', '/ritueller.html')
        new_content = new_content.replace('/tr/rituals/', '/ritueller.html')
        new_content = new_content.replace('/tr/dunya-ritueli.html', '/dunya-ritueli.html')
        new_content = new_content.replace('/tr/iletisim.html', '/iletisim.html')
        new_content = new_content.replace('/tr/guest-zen/index.html', '/guest-zen.html')
        new_content = new_content.replace('/tr/code-of-silence.html', '/code-of-silence.html')
        
        # Finally, any stragglers starting with /tr/ inside quotes
        new_content = re.sub(r'[\'"]\/tr\/([a-zA-Z0-9_-]+)(?:\/index\.html|\.html)?[\'"]', r'"/\1.html"', new_content)

        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
    except Exception as e:
        pass

for root, dirs, files in os.walk(TARGET_DIR):
    if '_archive' in root or 'node_modules' in root or '.git' in root or 'dist' in root or '_dev_archives' in root or 'tr\\' in root:
        continue
    for file in files:
        if file.endswith('.html') or file.endswith('.js'):
            replace_links_in_file(os.path.join(root, file))
