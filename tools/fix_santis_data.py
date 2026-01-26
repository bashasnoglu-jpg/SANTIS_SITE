import json
import os

# Paths
source_path = 'data/services_spa.json'
target_path = 'santis-hotels.json'

def run():
    if not os.path.exists(source_path) or not os.path.exists(target_path):
        print("Files not found.")
        return

    with open(source_path, 'r', encoding='utf-8') as f:
        source_data = json.load(f)

    with open(target_path, 'r', encoding='utf-8') as f:
        target_data = json.load(f)

    # 1. Prepare Target Structures
    if 'services' not in target_data:
        target_data['services'] = {}
    
    # Ensure localized nav/categories exist for service.html title rendering
    # service.html looks for data['tr']['nav']['categoryId']
    langs = ['tr', 'en', 'de', 'fr', 'ru']
    
    # Headers for Extra Effective
    headers = {
        'tr': "Extra & Effective",
        'en': "Extra & Effective",
        'de': "Extra & Effektiv",
        'fr': "Extra & Efficace",
        'ru': "Экстра & Эффективно"
    }

    for lang in langs:
        if lang not in target_data:
            target_data[lang] = {}
        if 'nav' not in target_data[lang]:
            target_data[lang]['nav'] = {}
        
        # Add the category title if missing
        if 'extraEffective' not in target_data[lang]['nav']:
            target_data[lang]['nav']['extraEffective'] = headers.get(lang, headers['en'])

    # 2. Migrate Services
    # Source: "extraEffective": [ ... ]
    if 'extraEffective' in source_data:
        items = source_data['extraEffective']
        print(f"Found {len(items)} items in extraEffective.")

        for item in items:
            s_id = item.get('id')
            if not s_id: continue
            
            # Check if already exists to avoid overwrite or dupes? 
            # We want to enable them, so overwrite is okay if we are fixing.
            
            # Map fields
            # Source: name: { tr: "..." }
            # Target needs en, de etc. We will populate 'en' with 'tr' if missing as fallback.
            
            name_tr = item.get('name', {}).get('tr', '')
            desc_tr = item.get('content', {}).get('tr', {}).get('intro', item.get('desc', {}).get('tr', ''))
            
            duration = item.get('duration', 30)
            
            # Construct target object
            new_service = {
                "categoryId": "extraEffective",
                "name": {
                    "tr": name_tr,
                    "en": name_tr, # Fallback
                    "de": name_tr,
                    "fr": name_tr,
                    "ru": name_tr
                },
                "desc": {
                    "tr": desc_tr,
                    "en": desc_tr, # Fallback
                    "de": desc_tr,
                    "fr": desc_tr,
                    "ru": desc_tr
                },
                "durationMin": duration,
                "price": 60 if duration <= 30 else 90, # Basic logic
                "currency": "EUR",
                "hotelSlugs": ["alba-resort", "alba-queen", "alba-royal", "iberostar-bellevue"] # Enable for all
            }
            
            target_data['services'][s_id] = new_service
            print(f"Added/Updated service: {s_id}")

    # 3. Save
    with open(target_path, 'w', encoding='utf-8') as f:
        json.dump(target_data, f, indent=2, ensure_ascii=False)
    
    print("Migration complete.")

if __name__ == "__main__":
    run()
