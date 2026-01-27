import json
import re
import os

# Paths
workbench_path = r"c:\Users\tourg\Desktop\SANTIS_SITE\_PROMPT_WORKBENCH.json"
db_path = r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\js\db.js"
menu_path = r"c:\Users\tourg\Desktop\SANTIS_SITE\tools\panel_menu.json"

def extract_json_arrays(text):
    # Find all JSON arrays enclosed in ```json ... ``` or just [...] blocks
    # This regex is a simplistic attempt to capture large JSON blocks
    matches = re.findall(r'```json\s*(\[\s*\{.*?\})\s*```', text, re.DOTALL)
    if not matches:
        # Try finding raw arrays without markdown code blocks if any
        pass
    return matches

def main():
    try:
        with open(workbench_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        json_blocks = extract_json_arrays(content)
        
        if len(json_blocks) < 2:
            print("Error: Could not find enough JSON blocks in workbench file.")
            # Fallback: manually define the new Sothys data based on what I read to ensure it works
            # Since regex on large files can be tricky, I will construct the data directly in this script 
            # if extraction fails, OR better, I will write the known data directly to avoid parsing errors.
            return

        # Block 1: Panel Menu Tree (usually the first complex one in the prompt if ordered, 
        # but let's look at the content to identify)
        
        # Actually, looking at the prompt content provided in history:
        # The prompt has:
        # 1. Panel Menu Tree (Section 4) -> This is the Menu
        # 2. Sothys Products (Section 5) -> This is the DB
        
        # Let's try to identify by content
        menu_json = None
        products_json = None
        
        for block in json_blocks:
            parsed = json.loads(block)
            if isinstance(parsed, list) and len(parsed) > 0:
                first_item = parsed[0]
                if "children" in first_item or "routes" in first_item:
                    menu_json = parsed
                elif "sku" in first_item or "brand" in first_item:
                    products_json = parsed
        
        # 1. Update Panel Menu
        if menu_json:
            with open(menu_path, 'w', encoding='utf-8') as f:
                json.dump(menu_json, f, indent=4, ensure_ascii=False)
            print("Updated tools/panel_menu.json")
            
        # 2. Update DB.js
        if products_json:
            # We need to convert this 'products_json' (which has 'sku', 'labels' format) 
            # to the 'db.js' format (id, cat, name, desc) OR verify if we can use it as is.
            # The prompt implies this IS the new format.
            
            # Let's map it to ensure compatibility with existing JS app logic if needed, 
            # or extend the JS logic. For now, let's append it as 'window.sothysCatalog' or similar
            # to keep it clean, then merge.
            
            # Transform to match db.js structure roughly so app.js can read it
            # db.js structure: { id, cat, name: {tr, en...}, desc: {tr...}, price, img }
            
            js_products = []
            for p in products_json:
                new_item = {
                    "id": p.get("sku"),
                    "cat": "skincare", # mapping brand/collection to category logic
                    "subcat": p.get("collection"),
                    "brand": p.get("brand"),
                    "type": p.get("type"),
                    "size": p.get("size"),
                    "name": {},
                    "desc": {},
                    "price": 0, # TBD as per user
                    "slug": p.get("slug"),
                    "img": f"images/sothys/{p.get('slug')}.jpg" # Placeholder path
                }
                
                # Map labels to name/desc
                if "labels" in p:
                    for lang, texts in p["labels"].items():
                        new_item["name"][lang] = texts.get("title")
                        new_item["desc"][lang] = texts.get("subtitle")
                
                js_products.append(new_item)
            
            # Read existing db.js
            with open(db_path, 'r', encoding='utf-8') as f:
                db_content = f.read()
            
            # Remove the previous Sothys block I added (if any) or just append deeply
            # A simple way is to remove the last block we added.
            # But regex replacement is safer.
            
            # Let's just create a valid JS string for the new array
            js_str = json.dumps(js_products, indent=2, ensure_ascii=False)
            # Remove enclosing [ ] to paste inside the main array
            js_inner = js_str[1:-1] # strip [ ]
            
            # We want to REPLACE the Sothys section we added before.
            # Identifier: "// --- 2. SOTHYS PARIS SKINCARE COLLECTION"
            
            marker = "// --- 2. SOTHYS PARIS SKINCARE COLLECTION"
            if marker in db_content:
                # Truncate content at marker and append new
                split_content = db_content.split(marker)[0]
                new_db_content = split_content + marker + " (UPDATED) ---\n" + "," + js_inner + "\n];"
            else:
                # Just append before the last ];
                last_bracket = db_content.rfind('];')
                new_db_content = db_content[:last_bracket] + ",\n" + marker + " ---\n" + js_inner + "\n];"

            with open(db_path, 'w', encoding='utf-8') as f:
                f.write(new_db_content)
            print("Updated assets/js/db.js with new Sothys data")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
