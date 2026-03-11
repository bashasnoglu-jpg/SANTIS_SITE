import os

files_to_fix = [
    ('site-haritasi.html', '/tr/masajlar/anne-cocuk.html', ''),
    ('site-haritasi.html', '/tr/masajlar/anti-selulit.html', ''),
    ('site-haritasi.html', '/tr/masajlar/anti-stress.html', ''),
    ('site-haritasi.html', '/tr/masajlar/bali.html', ''),
    ('site-haritasi.html', '/tr/masajlar/bas-boyun-omuz.html', ''),
    ('site-haritasi.html', '/tr/masajlar/cift-senkron.html', ''),
    ('site-haritasi.html', '/tr/masajlar/kids-nazik.html', ''),
    ('site-haritasi.html', '/tr/masajlar/kranyo-sakral.html', ''),
    ('site-haritasi.html', '/tr/masajlar/refleksoloji.html', ''),
    ('site-haritasi.html', '/tr/masajlar/shiatsu.html', ''),
    ('site-haritasi.html', '/tr/masajlar/sicak-tas.html', ''),
    ('site-haritasi.html', '/tr/masajlar/sirt-terapi.html', ''),
    ('site-haritasi.html', '/tr/masajlar/tetik-nokta.html', ''),
    ('site-haritasi.html', '/tr/masajlar/thai.html', ''),
    ('bio.html', 'assets/img/og-santis.webp', '/assets/img/og-standard.webp'),
    ('tr/masajlar/maderotherapie-bresilienne/index.html', '/tr/hamam/gelin-hamami.html', '/tr/hamam/index.html'),
    ('tr/masajlar/maderotherapie-bresilienne/index.html', '/tr/masajlar/anne-cocuk.html', '/tr/masajlar/anne-cocuk-masaji.html'),
    ('tr/rituals/sovereign-purification/index.html', '<link href="/assets/css/ritual-atmosphere.css" rel="stylesheet"/>', ''),
    ('trends/roman.html', 'assets img hero general webp src=', 'src="/assets/img/hero/santis_hero_general.webp"')
]

for file_path, broken, fixed in files_to_fix:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if broken in content:
            if fixed == '':
                # If fixed is empty, we want to remove the whole line (like the list item in site-haritasi)
                lines = content.split('\n')
                new_lines = [line for line in lines if broken not in line]
                content = '\n'.join(new_lines)
            else:
                content = content.replace(broken, fixed)
                
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'🩸 [PURGED] {broken} in {file_path}')
