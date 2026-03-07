import json
import os

data_dir = r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\data"

total_records = 0

def analyze_json(filename):
    global total_records
    filepath = os.path.join(data_dir, filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"\n--- {filename} ---")
            
            # common root keys
            for root_key in ["services", "products", "content", "pages"]:
                if root_key in data:
                    count = len(data[root_key])
                    total_records += count
                    print(f"[{root_key}] entries: {count}")
                    
            if "global" in data and "services" in data["global"]:
                count = len(data["global"]["services"])
                print(f"[global.services] entries: {count}")
            
            # Just count top level keys if no known nested structure
            if isinstance(data, dict):
                print(f"Root keys: {list(data.keys())}")
                if "slug" in data:
                    total_records += 1
                    print(f"  -> Single Object Record identified")

    except Exception as e:
        print(f"Error reading {filename}: {e}")

analyze_json("services.json")
analyze_json("product-data.json")
analyze_json("fallback-data.json")
analyze_json("home_data.json")

print(f"\nTotal Records Counted: {total_records}")
