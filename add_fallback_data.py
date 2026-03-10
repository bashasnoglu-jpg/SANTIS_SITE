import re, os

pages = [
    'tr/cilt-bakimi/index.html',
    'tr/hamam/index.html',
    'tr/masajlar/index.html',
    'tr/rituals/index.html',
    'tr/index.html',
]
tag = '<script src="/assets/js/fallback_data.js"></script>'

for p in pages:
    if not os.path.exists(p):
        print('SKIP:', p); continue
    html = open(p, encoding='utf-8').read()
    if len(html) < 200:
        print('EMPTY:', p); continue
    if 'fallback_data' in html:
        print('ZATEN VAR:', p); continue

    # loader.js'ten sonra ekle (erken, head içi)
    if 'loader.js' in html:
        new = html.replace(
            '<script src="/assets/js/loader.js"></script>',
            '<script src="/assets/js/loader.js"></script>\n' + tag,
            1
        )
    elif '</head>' in html:
        new = html.replace('</head>', tag + '\n</head>', 1)
    else:
        new = html.replace('</body>', tag + '\n</body>', 1)

    if len(new) > 500:
        open(p, 'w', encoding='utf-8').write(new)
        print('EKLENDI:', p, '|', len(new), 'bytes')
    else:
        print('GUVENLI DEGIL - ATLANDI:', p)
