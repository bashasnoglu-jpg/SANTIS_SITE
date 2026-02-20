import os
from pathlib import Path
from bs4 import BeautifulSoup

BASE_URL = "https://santisclub.com"
DEFAULT_IMAGE = f"{BASE_URL}/assets/img/logo-santis.png"

def generate_meta_and_og():
    root_dir = Path(".")
    exclude_dirs = {".git", "node_modules", "tools", "_tools", "logs", "reports", "core", "test", "tests", "_deploy_stage", "_build", "_backup", "assets", "data", "admin", "components", "_legacy_archive", "_legacy_content"}
    
    html_files = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs and not d.startswith('.')]
        for filename in filenames:
            if filename.endswith(".html"):
                html_files.append(Path(dirpath) / filename)

    injected_count = 0
    
    for file_path in html_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        soup = BeautifulSoup(content, "html.parser")
        head = soup.find("head")
        if not head:
            continue
            
        needs_save = False
        
        # 1. Determine Title
        title_tag = soup.find("title")
        page_title = title_tag.string.strip() if title_tag and title_tag.string else "Santis Club | Premium Spa & Wellness"
        
        # 2. Determine Description
        meta_desc = soup.find("meta", attrs={"name": "description"})
        page_desc = meta_desc.get("content").strip() if meta_desc and meta_desc.get("content") else ""
        
        if not page_desc:
            # Fallback: Extract from first paragraph or relevant div
            first_p = soup.find("p")
            if first_p and first_p.text:
                page_desc = first_p.text.strip()[:150] + "..."
            else:
                page_desc = "Santis Club'ta ruhunuzu ve bedeninizi tazeleyecek özel spa, masaj, hamam ve cilt bakımı ritüellerini keşfedin."
                
            if not meta_desc:
                new_desc = soup.new_tag("meta", attrs={"name": "description", "content": page_desc})
                head.append(new_desc)
                needs_save = True
            else:
                meta_desc["content"] = page_desc
                needs_save = True

        # Determine Canonical URL for OG
        canonical_tag = soup.find("link", rel="canonical")
        page_url = canonical_tag.get("href") if canonical_tag and canonical_tag.get("href") else f"{BASE_URL}/{file_path.relative_to(root_dir).as_posix()}"
        
        # Determine Image
        page_img = DEFAULT_IMAGE
        first_img = soup.find("img", src=True)
        if first_img and not first_img["src"].startswith("data:"):
            img_src = first_img["src"]
            if img_src.startswith("http"):
                page_img = img_src
            elif img_src.startswith("/"):
                page_img = f"{BASE_URL}{img_src}"
            else:
                # relative
                page_img = f"{BASE_URL}/{img_src}"

        # 3. Open Graph Tags
        og_tags = {
            "og:type": "website",
            "og:title": page_title,
            "og:description": page_desc,
            "og:url": page_url,
            "og:image": page_img,
            "og:site_name": "Santis Club",
            
            # Twitter Card
            "twitter:card": "summary_large_image",
            "twitter:title": page_title,
            "twitter:description": page_desc,
            "twitter:image": page_img,
        }
        
        for property_name, content_val in og_tags.items():
            if property_name.startswith("og:"):
                existing = soup.find("meta", attrs={"property": property_name})
            else:
                existing = soup.find("meta", attrs={"name": property_name})
                
            if not existing:
                if property_name.startswith("og:"):
                    new_tag = soup.new_tag("meta", attrs={"property": property_name, "content": content_val})
                else:
                    new_tag = soup.new_tag("meta", attrs={"name": property_name, "content": content_val})
                head.append(new_tag)
                needs_save = True

        if needs_save:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(str(soup))
            injected_count += 1
            print(f"Meta/OG Eklendi: {file_path}")

    print(f"\n✅ İşlem Tamamlandı. Toplam {injected_count} sayfanın Meta ve Open Graph etiketleri zenginleştirildi.")

if __name__ == "__main__":
    generate_meta_and_og()
