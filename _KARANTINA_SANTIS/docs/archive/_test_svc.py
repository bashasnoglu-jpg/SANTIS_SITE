import json
d = json.load(open('assets/data/services.json', 'r', encoding='utf-8'))
print(f'Items: {len(d)}')
for x in d[:10]:
    print(f'  id={str(x.get("id","-")):30s} slug={str(x.get("slug","-")):30s} cat={x.get("categoryId","-")}')
