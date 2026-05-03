import os
import re

TARGET_DIR = r"c:/Users/tourg/Desktop/SANTIS_SITE"

def replace_links_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # We want to replace /masajlar/ with /tr/masajlar/ 
        # BUT only if it is not already /tr/masajlar/ or /en/masajlar/
        new_content = re.sub(r'(?<!/tr)(?<!/en)(/masajlar/)', r'/tr\1', content)

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
        if file.endswith(('.html', '.js', '.json')):
            replace_links_in_file(os.path.join(root, file))
print("Done!")
