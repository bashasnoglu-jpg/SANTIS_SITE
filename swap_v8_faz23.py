"""FAZ 2+3: hamam ve cilt-bakimi sayfalarında eski motorları kaldır, V8 ekle."""
import os

pages = {
    'tr/hamam/index.html':       ['home-products.js', 'santis-v7-quantum-rail.js'],
    'tr/cilt-bakimi/index.html': ['home-products.js', 'santis-v5-virtual-engine.js'],
}

V8_TAG = '<script defer src="/assets/js/santis-v8-engine.js"></script>'

for path, remove_list in pages.items():
    if not os.path.exists(path):
        print('DOSYA YOK:', path); continue
    html = open(path, encoding='utf-8').read()
    if len(html) < 500:
        print('BOŞ – ATLANDI:', path); continue

    changed = False
    # V8 zaten ekliyse atlama
    if 'santis-v8-engine' in html:
        print('V8 ZATEN VAR:', path)
    else:
        # home-products.js'i V8 ile değiştir
        for line in html.splitlines():
            stripped = line.strip()
            if 'home-products.js' in stripped:
                html = html.replace(line, V8_TAG, 1)
                changed = True
                print('  V8 yerleştirildi:', path)
                break

    # Diğer kaldırılacak motorları tamamen sil
    for old in remove_list:
        if old == 'home-products.js':
            continue  # zaten yukarıda hallettik
        for line in html.splitlines():
            if old in line and '<script' in line:
                html = html.replace(line + '\n', '', 1)
                html = html.replace(line + '\r\n', '', 1)
                html = html.replace(line, '', 1)
                changed = True
                print(f'  {old} kaldırıldı:', path)

    if changed:
        if len(html) < 500:
            print('GÜVENLİ DEĞİL – ATLANDI:', path); continue
        open(path, 'w', encoding='utf-8').write(html)
        print('  KAYDEDILDI:', path, '|', len(html), 'bytes')
    else:
        print('Değişiklik gerekmedi:', path)
