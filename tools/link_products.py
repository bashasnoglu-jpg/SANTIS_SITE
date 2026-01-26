import json
import os

def run():
    target = 'c:/Users/tourg/Desktop/SANTIS_SITE/data/services_spa.json'
    try:
        with open(target, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Mapping rules
        # faceSothys -> hydra serum, youth cream
        # hamam -> body scrub
        # massage -> massage oil
        
        mapping = {
            "faceSothys": ["sothys-hydra-serum", "sothys-youth-cream"],
            "hammam": ["sothys-body-scrub"],
            "classicMassages": ["sothys-massage-oil"],
            "asianMassages": ["sothys-massage-oil"],
            "ayurveda": ["sothys-massage-oil"],
            "sportsTherapy": ["sothys-massage-oil"],
            "signatureCouples": ["sothys-massage-oil"]
        }

        count = 0
        for category, products in mapping.items():
            if category in data:
                for service in data[category]:
                    service['relatedProducts'] = products
                    count += 1
        
        with open(target, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"Updated {count} services with related products.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run()
