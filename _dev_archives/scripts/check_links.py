import json, os

d = json.load(open('assets/data/services.json', encoding='utf-8'))

pages = {
    'masajlar':    [f.replace('.html','') for f in os.listdir('tr/masajlar')    if f.endswith('.html') and f != 'index.html'],
    'hamam':       [f.replace('.html','') for f in os.listdir('tr/hamam')       if f.endswith('.html') and f != 'index.html'],
    'cilt-bakimi': [f.replace('.html','') for f in os.listdir('tr/cilt-bakimi') if f.endswith('.html') and f != 'index.html'],
}
print('Fiziksel detay:', {k: len(v) for k,v in pages.items()})

matched = broken = no_slug = 0
broken_list = []

for item in d:
    slug = (item.get('slug') or '').strip()
    cat  = (item.get('category') or '').lower()
    if not slug:
        no_slug += 1
        continue

    if 'hammam' in cat or 'hamam' in cat:
        folder = pages['hamam']
        section = 'hamam'
    elif 'massage' in cat:
        folder = pages['masajlar']
        section = 'masajlar'
    elif 'skincare' in cat or 'sothys' in cat:
        folder = pages['cilt-bakimi']
        section = 'cilt-bakimi'
    else:
        continue

    if slug in folder:
        matched += 1
    else:
        broken += 1
        broken_list.append({'slug': slug, 'cat': cat, 'section': section})

print(f'Eslesen: {matched} | Kirik: {broken} | Slug yok: {no_slug}')
print('Kirik linkler:')
for b in broken_list:
    print(f"  /tr/{b['section']}/{b['slug']}.html  [{b['cat']}]")
