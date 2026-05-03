import os
import re

TARGET_DIR = r"c:/Users/tourg/Desktop/SANTIS_SITE"

def replace_links_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = content
        
        # Exact HTML file replacements
        new_content = new_content.replace('href="/cilt-bakimi.html"', 'href="/tr/cilt-bakimi/index.html"')
        new_content = new_content.replace("href='/cilt-bakimi.html'", "href='/tr/cilt-bakimi/index.html'")
        
        new_content = new_content.replace('href="/hamam.html"', 'href="/tr/hamam/index.html"')
        new_content = new_content.replace("href='/hamam.html'", "href='/tr/hamam/index.html'")
        
        # Directory prefix replacements
        new_content = re.sub(r'(?<!/tr)(?<!/en)(/cilt-bakimi/)', r'/tr\1', new_content)
        new_content = re.sub(r'(?<!/tr)(?<!/en)(/hamam/)', r'/tr\1', new_content)

        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
    except Exception as e:
        pass

for root, dirs, files in os.walk(TARGET_DIR):
    if '.git' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.html', '.js', '.json', '.ts')):
            replace_links_in_file(os.path.join(root, file))
print("Done!")
