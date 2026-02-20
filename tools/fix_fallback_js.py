import os
import json
import re
from fix_duplicate_skincare_content import skincare_unique_data

def update_js_fallback_file(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return False
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the object that starts after window.SANTIS_FALLBACK = window.SANTIS_FALLBACK || {
    # It's an assignment. We can find the first { and the last } matching it.
    
    start_idx = content.find('{')
    if start_idx == -1:
        return False
        
    # To be safe, let's just parse the content manually if it's tricky.
    # We can use javascript evaluation or simple text replacement.
    
    # Since it's a JS object, let's just find the services object and replace inside it using string manipulation or regex
    # But it's easier to find the JSON string if it is valid JSON. fallback_data.js keys are quoted?
    # Usually yes. Let's try json.loads on a cleaned string.
    
    clean_str = content[content.find('=') + 1:].strip()
    if clean_str.startswith('window.SANTIS_FALLBACK ||'):
        clean_str = clean_str[len('window.SANTIS_FALLBACK ||'):].strip()
        
    if clean_str.endswith(';'):
        clean_str = clean_str[:-1]
        
    try:
        data = json.loads(clean_str)
        modified = False
        
        # update data
        if "services" in data:
            for key, service in data["services"].items():
                slug = service.get("slug", key)
                for match_slug, unique_data in skincare_unique_data.items():
                    if match_slug in slug or match_slug in key:
                        if "content" not in service:
                             service["content"] = {}
                        if "tr" not in service["content"]:
                             service["content"]["tr"] = {}
                        
                        service["content"]["tr"]["steps"] = unique_data["steps"]
                        service["content"]["tr"]["effects"] = unique_data["effects"]
                        service["content"]["tr"]["tagline"] = unique_data["tagline"]
                        modified = True
                        break

        if modified:
            new_json_str = json.dumps(data, ensure_ascii=False, indent=4)
            # Reconstruct JS file
            new_content = 'window.SANTIS_FALLBACK = window.SANTIS_FALLBACK || ' + new_json_str + ';\n'
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
                
            print(f"✅ fallback_data.js başarıyla güncellendi.")
            return True
    except Exception as e:
        print(f"Regex parsing failed, error: {e}")
        return False

if __name__ == "__main__":
    update_js_fallback_file("assets/js/fallback_data.js")
