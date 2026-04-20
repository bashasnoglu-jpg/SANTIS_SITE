"""Create missing index.html for DE/FR/RU/SR from EN template"""
from pathlib import Path

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')

LANG_DATA = {
    'de': {
        'title': 'Santis Club &bull; Spa &amp; Wellness',
        'desc': 'Santis Club - Exklusives Luxus-Spa, Hammam und therapeutisches Wellness in Antalya.',
    },
    'fr': {
        'title': 'Santis Club &bull; Spa &amp; Bien-être',
        'desc': "Santis Club - Spa de luxe exclusif, hammam et bien-être thérapeutique à Antalya.",
    },
    'ru': {
        'title': 'Santis Club &bull; Спа &amp; Велнес',
        'desc': 'Santis Club - Эксклюзивный люкс-спа, хаммам и терапевтический велнес в Анталии.',
    },
    'sr': {
        'title': 'Santis Club &bull; Spa &amp; Velnes',
        'desc': 'Santis Club - Ekskluzivni luksuzni spa, hamam i terapeutski velnes u Antaliji.',
    },
}

en_content = (ROOT / 'en' / 'index.html').read_text(encoding='utf-8', errors='ignore')

for lang, data in LANG_DATA.items():
    content = en_content
    content = content.replace('lang="en"', f'lang="{lang}"')
    content = content.replace(
        'Santis Club • Spa &amp; Wellness',
        data['title']
    )
    content = content.replace(
        'Santis Club - Exclusive adult-only luxury spa, hammam, and therapeutic wellness. Antalya\'s premier well-being destination.',
        data['desc']
    )
    
    out = ROOT / lang / 'index.html'
    out.write_text(content, encoding='utf-8')
    print(f'Created: /{lang}/index.html ({len(content)} bytes)')

print('\nDone!')
