import os
import re

files_to_patch = [
    'c:/Users/tourg/Desktop/SANTIS_SITE/components/navbar.html',
    'c:/Users/tourg/Desktop/SANTIS_SITE/components/navbar-en.html',
    'c:/Users/tourg/Desktop/SANTIS_SITE/assets/html/components/navbar-en.html'
]

for filepath in files_to_patch:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Apply strict replacements for each specific alt text context
        content = re.sub(r'data-media=\"pending_neurova_luxury_asset\"(?=[^>]*alt=\"Sultan)', 'data-media=\"nav_sultan_bath\"', content)
        content = re.sub(r'(alt=\"Sultan[^>]+)data-media=\"pending_neurova_luxury_asset\"', r'\1data-media=\"nav_sultan_bath\"', content)
        
        content = re.sub(r'data-media=\"pending_neurova_luxury_asset\"(?=[^>]*alt=\"Aroma)', 'data-media=\"nav_aroma_journey\"', content)
        content = re.sub(r'(alt=\"Aroma[^>]+)data-media=\"pending_neurova_luxury_asset\"', r'\1data-media=\"nav_aroma_journey\"', content)
        
        content = re.sub(r'data-media=\"pending_neurova_luxury_asset\"(?=[^>]*alt=\"Sothys)', 'data-media=\"nav_sothys\"', content)
        content = re.sub(r'(alt=\"Sothys[^>]+)data-media=\"pending_neurova_luxury_asset\"', r'\1data-media=\"nav_sothys\"', content)
        
        content = re.sub(r'data-media=\"pending_neurova_luxury_asset\"(?=[^>]*alt=\"Atelier)', 'data-media=\"nav_atelier\"', content)
        content = re.sub(r'(alt=\"Atelier[^>]+)data-media=\"pending_neurova_luxury_asset\"', r'\1data-media=\"nav_atelier\"', content)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Mühürlendi: {filepath}')
