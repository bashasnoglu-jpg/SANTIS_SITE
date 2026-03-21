import json

with open("c:/Users/tourg/Desktop/SANTIS_SITE/assets/data/services.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for item in data:
    # Handle 'title' -> 'name'
    if 'title' in item:
        if 'name' not in item:
            item['name'] = item['title']
        del item['title']
        
    # Handle 'url' -> 'detailUrl'
    if 'url' in item:
        if 'detailUrl' not in item:
            item['detailUrl'] = item['url']
        del item['url']
        
    # Handle 'category' -> 'categoryId'
    if 'category' in item:
        if 'categoryId' not in item:
            item['categoryId'] = item['category']
        del item['category']
        
    # Handle legacy 'image' / 'img' -> 'media.hero' (Optional but V18 compatible)
    if 'media' not in item:
        item['media'] = {}
    if 'image' in item:
        item['media']['hero'] = item['image'].split('/')[-1] # Convert to base filename as expected in V18
    if 'img' in item:
        item['media']['hero'] = item['img'].split('/')[-1]

with open("c:/Users/tourg/Desktop/SANTIS_SITE/assets/data/services.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Schema unification complete.")
