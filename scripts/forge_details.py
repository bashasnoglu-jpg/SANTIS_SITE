import json
import os
import shutil

# Paths
JSON_PATH = "data/rituals.json"
TEMPLATE_PATH = "templates/ritual_detail.html"
OUTPUT_DIR = "tr/rituals"

def forge_details():
    if not os.path.exists(JSON_PATH):
        print(f"❌ Error: {JSON_PATH} not found.")
        return

    if not os.path.exists(TEMPLATE_PATH):
        print(f"❌ Error: {TEMPLATE_PATH} not found.")
        return

    # Load data
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Load template
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        template = f.read()

    # Process each category
    count = 0
    for category_key, rituals in data.items():
        for ritual in rituals:
            r_id = ritual["id"]
            r_title = ritual["title"]
            r_subtitle = ritual["subtitle"]
            r_img = ritual["hero_image"]

            # Create specific directory
            ritual_dir = os.path.join(OUTPUT_DIR, r_id)
            os.makedirs(ritual_dir, exist_ok=True)

            # Replace injection tags
            html = template.replace("{{RITUAL_ID}}", r_id)
            html = html.replace("{{RITUAL_TITLE}}", r_title)
            html = html.replace("{{RITUAL_SUBTITLE}}", r_subtitle)
            html = html.replace("{{RITUAL_IMAGE}}", r_img)

            out_path = os.path.join(ritual_dir, "index.html")
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(html)
            
            print(f"✅ Forged: {out_path}")
            count += 1
            
    print(f"🎉 Forge Complete: {count} Detail Pages Stamped.")

if __name__ == "__main__":
    forge_details()
