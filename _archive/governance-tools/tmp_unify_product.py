import json

with open("c:/Users/tourg/Desktop/SANTIS_SITE/assets/data/product-data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for item in data:
    if 'title' in item:
        if 'name' not in item:
            item['name'] = item['title']
        del item['title']
    if 'url' in item:
        if 'detailUrl' not in item:
            item['detailUrl'] = item['url']
        del item['url']
    if 'category' in item:
        if 'categoryId' not in item:
            item['categoryId'] = item['category']
        del item['category']

with open("c:/Users/tourg/Desktop/SANTIS_SITE/assets/data/product-data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
