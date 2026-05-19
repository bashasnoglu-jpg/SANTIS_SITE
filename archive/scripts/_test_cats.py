import json
d = json.load(open('assets/data/services.json', 'r', encoding='utf-8'))
print(f'Total Items: {len(d)}')
print()

# Group by categoryId
cats = {}
for x in d:
    cat = x.get('categoryId', 'UNKNOWN')
    if cat not in cats:
        cats[cat] = []
    cats[cat].append(x)

for cat, items in sorted(cats.items()):
    print(f'\n=== {cat} ({len(items)} items) ===')
    for x in items:
        print(f'  id={x.get("id","?"):30s} slug={x.get("slug","?"):30s}')
