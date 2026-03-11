import os
import json
import re

MISSING_ROUTES_FILE = "missing_routes_full.txt"
PRODUCTS_JSON = "data/content/products.json"
TEMPLATE_FILE = "tr/masajlar/isvec-full-body.html"

# Ensure we have the base JSON
if not os.path.exists(PRODUCTS_JSON):
    print("Cannot find products.json.")
    exit(1)

with open(PRODUCTS_JSON, "r", encoding="utf-8") as f:
    products = json.load(f)

# Load the master template
with open(TEMPLATE_FILE, "r", encoding="utf-8") as f:
    master_html = f.read()

# Read the missing routes
if not os.path.exists(MISSING_ROUTES_FILE):
    print("Cannot find missing_routes_full.txt")
    exit(1)

with open(MISSING_ROUTES_FILE, "r", encoding="utf-8-sig") as f: # handle BOM just in case
    lines = f.readlines()

def generate_html_from_template(product, target_lang, slug):
    html = master_html
    # Replace language tags
    html = re.sub(r'<html lang="tr">', f'<html lang="{target_lang}">', html)
    
    # Replace Main Titles
    title_tr = "İsveç Full Body Masajı"
    title_new = product.get("title", slug.replace("-", " ").title())
    
    html = html.replace(f"<title>{title_tr} | Santis Club</title>", f"<title>{title_new} | Santis Club</title>")
    html = html.replace(f"content=\"{title_tr} | Santis Club\"", f"content=\"{title_new} | Santis Club\"")
    html = html.replace(f"<h1 class=\"cin-title\">{title_tr}</h1>", f"<h1 class=\"cin-title\">{title_new}</h1>")
    html = html.replace(f"alt=\"{title_tr}\"", f"alt=\"{title_new}\"")
    
    # Replace Description
    desc_tr = "Tüm vücudu kapsayan, İsveç tekniğiyle rahatlatma."
    desc_new = product.get("short_description", "")
    if not desc_new:
        desc_new = f"{title_new} ile ruhunuzu ve bedeninizi dinlendirin."
    html = html.replace(f"content=\"{desc_tr}\"", f"content=\"{desc_new}\"")
    html = html.replace(f"<p>{desc_tr}</p>", f"<p>{desc_new}</p>")
    
    # Breadcrumbs - Update "Isvec Full Body" text to new title
    html = html.replace(">Isvec Full Body<", f">{title_new}<")
    html = html.replace(">İsveç Full Body Masajı<", f">{title_new}<")
    
    # Replace URL in breadcrumbs/json-ld (simplistic)
    html = html.replace("isvec-full-body.html", f"{slug}.html")
    
    # Replace pricing/duration
    duration = product.get("duration", "60")
    html = html.replace("60 dk", f"{duration} dk")
    
    price = product.get("price", {}).get("amount", "100")
    # For now, simplistic price replacement... if TRY vs EUR
    html = html.replace("100 €", f"{price} ₺") 
    
    # Hero image replacement (if product has cover)
    cover = product.get("media", {}).get("cover", "/assets/img/cards/massage.webp")
    if cover:
         html = html.replace("/assets/img/cards/massage.webp", cover)

    return html

created_files = 0

for line in lines:
    url = line.strip()
    if not url or not url.startswith("http://localhost:8000"):
        continue
    
    # Example: http://localhost:8000/tr/masajlar/aromaterapi.html
    path = url.replace("http://localhost:8000/", "")
    
    if path.endswith(".html") and ("masajlar" in path or "massages" in path or "hamam" in path or "hammam" in path or "massagen" in path):
        parts = path.split("/")
        lang = parts[0]
        category = parts[1]
        filename = parts[2]
        slug = filename.replace(".html", "")
        
        # Determine product match
        matched_prod = next((p for p in products if p.get("slug") == slug), {})
        
        target_path = os.path.join(os.getcwd(), path.replace("/", os.sep))
        target_dir = os.path.dirname(target_path)
        
        if not os.path.exists(target_dir):
            os.makedirs(target_dir, exist_ok=True)
            
        if not os.path.exists(target_path):
            new_html = generate_html_from_template(matched_prod, lang, slug)
            with open(target_path, "w", encoding="utf-8") as out_f:
                out_f.write(new_html)
            created_files += 1
            print(f"Created: {path}")

print(f"\nDone! Generated {created_files} missing pages.")
