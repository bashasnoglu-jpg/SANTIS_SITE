import os

files_to_fix = [
    ('trends/roman.html', 'assets img hero general webp src="Santis">', '<img src="/assets/img/hero/santis_hero_general.webp" alt="Roman Spa" loading="lazy" decoding="async" class="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] hover:scale-105" />'),
    ('trends/japan.html', '/assets/img/cards/santis_card_zen.webp', '/assets/img/cards/santis_card_massage_v1.webp'),
    ('tr/masajlar/maderotherapie-bresilienne/index.html', '/fr/hammam/gelin-hamami.html', '/tr/hamam/gelin-hamami.html'),
    ('tr/masajlar/maderotherapie-bresilienne/index.html', '/fr/massages/anne-cocuk.html', '/tr/masajlar/anne-cocuk.html'),
    ('tr/masajlar/maderotherapie-bresilienne/index.html', '/fr/massages/massage-abhyanga/index.html', '/tr/hizmetler/abhyanga-masaji/index.html'),
    ('tr/masajlar/maderotherapie-bresilienne/index.html', '/fr/massages/shirodhara-flux-esprit/index.html', '/tr/hizmetler/shirodhara-mind-flow/index.html'),
    ('tr/masajlar/maderotherapie-bresilienne/index.html', '/fr/services/sculpture-vibro-g5/index.html', '/tr/hizmetler/g5-vibro-sculpting/index.html')
]

for file_path, broken, fixed in files_to_fix:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if broken in content:
            content = content.replace(broken, fixed)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'🩸 [FIXED] {file_path}')
