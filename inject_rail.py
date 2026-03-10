"""
Hamam ve masajlar sayfalarına:
  1. santis-matrix-container div'i (main içine)
  2. santis-v7-quantum-rail.js script'ini ekler
"""
import os, re

pages = {
    'tr/hamam/index.html':    'hammam',
    'tr/masajlar/index.html': 'massage',
}

CONTAINER = '<div id="santis-matrix-container" data-category="{cat}" style="opacity:1"></div>'
SCRIPT    = '<script defer src="/assets/js/santis-v7-quantum-rail.js"></script>'

for path, cat in pages.items():
    if not os.path.exists(path):
        print(f'DOSYA YOK: {path}'); continue
    html = open(path, encoding='utf-8').read()
    if len(html) < 200:
        print(f'BOŞ - ATLA: {path}'); continue

    changed = False

    # 1. Container ekle (yoksa <main> içine, body sonuna fallback)
    if 'santis-matrix-container' not in html:
        tag = CONTAINER.format(cat=cat)
        if '<main' in html:
            html = re.sub(r'(<main[^>]*>)', r'\1\n' + tag, html, count=1)
        elif '</body>' in html:
            html = html.replace('</body>', tag + '\n</body>', 1)
        changed = True
        print(f'  ✅ container eklendi: {path}')

    # 2. Script ekle (yoksa app.js defer'den önce)
    if 'santis-v7-quantum-rail' not in html:
        app_tag = '<script defer src="/assets/js/app.js"'
        if app_tag in html:
            html = html.replace(app_tag, SCRIPT + '\n' + app_tag, 1)
        elif '</body>' in html:
            html = html.replace('</body>', SCRIPT + '\n</body>', 1)
        changed = True
        print(f'  ✅ script eklendi: {path}')

    if changed:
        if len(html) < 500:
            print(f'  ⚠️ GÜVENLİ DEĞİL, ATLANDI: {path}'); continue
        open(path, 'w', encoding='utf-8').write(html)
        print(f'  💾 Kaydedildi: {path} ({len(html)} bytes)')
    else:
        print(f'  ⏭️ Değişiklik gerekmedi: {path}')
