import os

files = ['tr/index.html', 'index.html', 'assets/js/core/santis-forge-injector.js']

for f in files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # 1. Fix the backslash single quotes in inline styles: url(\'...\') -> url('...')
        content = content.replace("url(\\'", "url('").replace("\\')", "')")
        
        # 2. Map shirodhara.webp -> santis_card_shirodhara_v1.webp
        content = content.replace("shirodhara.webp", "santis_card_shirodhara_v1.webp")
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Fixed {f}")
