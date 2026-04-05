import os
import re

dir_path = r'c:\Users\tourg\Desktop\SANTIS_SITE'

# Fix url('... ') in HTML style attributes
html_pattern = re.compile(r'style="[^"]*background-image:\s*url\([^)]+\)[^"]*"')
url_pattern = re.compile(r"url\(['\"]([^'\"]+)['\"]\)")

for root, _, files in os.walk(dir_path):
    if 'node_modules' in root or '.git' in root or 'venv' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            def replace_url(match):
                attr = match.group(0)
                # replace inside this attr
                fixed = url_pattern.sub(r'url(\1)', attr)
                return fixed

            new_content = html_pattern.sub(replace_url, content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed CSS URLs in {filepath}")
