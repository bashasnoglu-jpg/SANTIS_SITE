import os
from pathlib import Path
from bs4 import BeautifulSoup
import json

def generate_breadcrumb_jsonld(path_parts, lang, base_url="https://santisclub.com"):
    # path_parts = ['tr', 'masajlar', 'bali-masaji.html']
    items = []
    
    # 1. Home
    home_name = {"tr": "Ana Sayfa", "en": "Home", "de": "Startseite", "ru": "Главная", "fr": "Accueil"}.get(lang, "Home")
    items.append({
        "@type": "ListItem",
        "position": 1,
        "name": home_name,
        "item": f"{base_url}/{lang}/index.html" if lang else f"{base_url}/"
    })
    
    current_url = f"{base_url}/{lang}" if lang else base_url
    
    # Categories & Current Page
    for i, part in enumerate(path_parts):
        if part == lang and i == 0:
            continue
            
        is_last = (i == len(path_parts) - 1)
        name = part.replace(".html", "").replace("-", " ").title()
        
        # Translation maps for common categories
        if part == "masajlar" or part == "massages" or part == "massagen":
            name = {"tr": "Masaj Terapileri", "en": "Massage Therapies", "de": "Massagetherapien", "ru": "Массаж", "fr": "Massages"}.get(lang, name)
        elif part == "hamam" or part == "hammam":
            name = {"tr": "Hamam Ritüelleri", "en": "Hammam Rituals", "de": "Hammam Rituale", "ru": "Хаммам", "fr": "Hammam"}.get(lang, name)
        elif "cilt" in part or "skin" in part or "soins" in part or "haut" in part:
            name = {"tr": "Cilt Bakımı", "en": "Skincare", "de": "Hautpflege", "ru": "Уход за кожей", "fr": "Soins du Visage"}.get(lang, name)
        elif part == "index.html":
            continue # We already added the category link, index.html is essentially the category page itself
            
        current_url += f"/{part}"
        
        items.append({
            "@type": "ListItem",
            "position": len(items) + 1,
            "name": name,
            "item": current_url
        })
        
    schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items
    }
    return json.dumps(schema, ensure_ascii=False, indent=2)

def inject_breadcrumbs():
    root_dir = Path(".")
    exclude_dirs = {".git", "node_modules", "tools", "_tools", "logs", "reports", "core", "test", "tests", "_deploy_stage", "_build", "_backup", "assets", "data", "admin", "components"}
    
    injected_count = 0
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs and not d.startswith('.')]
        
        for filename in filenames:
            if filename.endswith(".html"):
                file_path = Path(dirpath) / filename
                rel_parts = file_path.relative_to(root_dir).parts
                
                if len(rel_parts) < 2: 
                    # Root files like index.html or 404.html don't need deep breadcrumbs
                    continue
                    
                lang = rel_parts[0] if rel_parts[0] in ["tr", "en", "de", "ru", "fr"] else "tr"
                
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    
                soup = BeautifulSoup(content, "html.parser")
                
                # Check if BreadcrumbList already exists
                existing_scripts = soup.find_all("script", type="application/ld+json")
                has_breadcrumb = False
                for script in existing_scripts:
                    if script.string and "BreadcrumbList" in script.string:
                        has_breadcrumb = True
                        break
                        
                if not has_breadcrumb:
                    json_ld = generate_breadcrumb_jsonld(rel_parts, lang)
                    
                    script_tag = soup.new_tag("script", type="application/ld+json")
                    script_tag.string = f"\n{json_ld}\n"
                    
                    head = soup.find("head")
                    if head:
                        head.append(script_tag)
                        
                        with open(file_path, "w", encoding="utf-8") as f:
                            f.write(str(soup))
                            
                        injected_count += 1
                        print(f"Enjekte edildi -> {file_path}")
                        
    print(f"\n✅ İşlem tamamlandı. Toplam {injected_count} dosyaya Breadcrumb Schema.org başarıyla eklendi.")

if __name__ == "__main__":
    inject_breadcrumbs()
