import os, re

pages = [
    'tr/hamam/index.html',
    'tr/masajlar/index.html',
    'tr/rituals/index.html',
    'tr/index.html',
    'tr/cilt-bakimi/index.html',
]
bridge = '<script defer src="/assets/js/santis-data-bridge.js"></script>'
app_tag = '<script defer src="/assets/js/app.js"'

for p in pages:
    if not os.path.exists(p):
        print('SKIP:', p); continue
    content = open(p, encoding='utf-8').read()
    if len(content) < 200:
        print('EMPTY-SKIP:', p); continue
    if 'santis-data-bridge' in content:
        print('ZATEN VAR:', p); continue

    if app_tag in content:
        new = content.replace(app_tag, bridge + '\n' + app_tag, 1)
    elif '</body>' in content:
        new = content.replace('</body>', bridge + '\n</body>', 1)
    else:
        print('ATLA:', p); continue

    # Güvenlik: yeni içerik boş olmamalı
    if len(new) < 500:
        print('GUVENLI-DEGIL:', p); continue

    open(p, 'w', encoding='utf-8').write(new)
    print(f'EKLENDI: {p} | {len(new)} bytes')
