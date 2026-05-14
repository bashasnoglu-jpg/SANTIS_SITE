
import os
import re

# Source Template (TR)
TEMPLATE_PATH = r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\cilt-bakimi\classic-facial.html"
BASE_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE"

# Configuration for other languages
TARGETS = [
    {
        "dir": "en/skincare",
        "lang": "en",
        "site_root": "/en/",
        "title_suffix": "Santis Skin Care",
        "home_url": "/en/index.html",
        "home_text": "Home",
        "cat_url": "/en/skincare/index.html",
        "cat_text": "Skincare",
        "back_text": "BACK TO COLLECTION",
        "book_text": "BOOK NOW"
    },
    {
        "dir": "de/hautpflege",
        "lang": "de",
        "site_root": "/de/",
        "title_suffix": "Santis Hautpflege", 
        "home_url": "/de/index.html",
        "home_text": "Startseite",
        "cat_url": "/de/hautpflege/index.html",
        "cat_text": "Hautpflege",
        "back_text": "ZURÜCK",
        "book_text": "JETZT BUCHEN"
    },
    {
        "dir": "fr/soins-visage",
        "lang": "fr",
        "site_root": "/fr/",
        "title_suffix": "Santis Soins Visage",
        "home_url": "/fr/index.html",
        "home_text": "Accueil",
        "cat_url": "/fr/soins-visage/index.html",
        "cat_text": "Soins Visage",
        "back_text": "RETOUR",
        "book_text": "RÉSERVER"
    },
    {
        "dir": "ru/skincare",
        "lang": "ru",
        "site_root": "/ru/",
        "title_suffix": "Santis Skin Care",
        "home_url": "/ru/index.html",
        "home_text": "Главная",
        "cat_url": "/ru/skincare/index.html",
        "cat_text": "Уход за лицом",
        "back_text": "НАZAД",
        "book_text": "ЗАБРОНИРОВАТЬ"
    }
]

def load_template():
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError(f"Template not found: {TEMPLATE_PATH}")
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        return f.read()

def process_targets():
    print("Starting synchronization...")
    template_content = load_template()
    
    # Pre-clean the template of specific TR values to make it a generic format string if needed
    # But direct replace is safer for context.

    for target in TARGETS:
        target_path = os.path.join(BASE_DIR, target["dir"])
        if not os.path.exists(target_path):
            print(f"Creating missing directory: {target_path}")
            os.makedirs(target_path, exist_ok=True)
            
        print(f"Processing lang '{target['lang']}' in {target['dir']}...")
        
        # We iterate over files in the target directory. 
        # If the directory is empty or missing files that exist in TR, we should ideally CREATE them.
        # For now, let's assuming we update existing files. 
        # BUT, if we want to be thorough, we should iterate the TR directory and replicate to others?
        # The user said "Apply TR changes to all languages". Usually implies updating existing pages.
        # Let's stick to updating existing files found in the target directory to avoid creating ghost files.
        
        files = [f for f in os.listdir(target_path) if f.endswith(".html") and f != "index.html"]
        if not files:
            print(f"  No HTML files found in {target['dir']}.")
            continue

        for filename in files:
            file_path = os.path.join(target_path, filename)
            slug = filename.replace(".html", "")
            
            # Prepare new content
            content = template_content
            
            # 1. Update <html> tag
            # <html lang="tr" data-site-root="/" data-service-id="classic-facial">
            content = re.sub(r'lang="tr"', f'lang="{target["lang"]}"', content)
            content = re.sub(r'data-site-root="/"', f'data-site-root="{target["site_root"]}"', content)
            
            # 2. Update Service ID
            # window.SERVICE_ID = 'classic-facial';
            # Also in data-service-id attribute
            content = re.sub(r"window\.SERVICE_ID\s*=\s*'[^']+'", f"window.SERVICE_ID = '{slug}'", content)
            content = re.sub(r'data-service-id="[^"]+"', f'data-service-id="{slug}"', content)

            # 3. Update Title
            # <title>Classic Facial | Santis Skin Care</title>
            # We assume title structure is "{Service Name} | {Suffix}"
            # TR template has "Classic Facial". We can try to keep the Service Name from the file if we parsed it, 
            # but here we are overwriting with the TR template's title "Classic Facial".
            # The JS logic overwrites document.title anyway! So the HTML title is a placeholder/fallback.
            # Let's just update the Suffix.
            content = content.replace("| Santis Skin Care", f"| {target['title_suffix']}")
            
            # 4. Update Canonical
            # <link rel="canonical" href="https://santis-club.com/tr/cilt-bakimi/classic-facial.html">
            new_canonical = f"https://santis-club.com/{target['dir']}/{filename}"
            content = re.sub(r'<link rel="canonical" href="[^"]+">', f'<link rel="canonical" href="{new_canonical}">', content)
            
            # 5. Update Breadcrumbs (HTML fallback)
            # <a href="/tr/index.html">Ana Sayfa</a> / <a href="/tr/cilt-bakimi/index.html">Cilt Bakımı</a>
            content = content.replace('/tr/index.html', target['home_url'])
            content = content.replace('Ana Sayfa', target['home_text'])
            content = content.replace('/tr/cilt-bakimi/index.html', target['cat_url'])
            content = content.replace('Cilt Bakımı', target['cat_text'])

            # 6. Update Noscript Nav
            # Already handled by above string replacements mostly, but check context.
            
            # 7. Update Actions (Fallback text before JS kicks in)
            # KOLEKSİYONA DÖN -> target['back_text']
            # REZERVASYON YAP -> target['book_text']
            content = content.replace('KOLEKSİYONA DÖN', target['back_text'])
            content = content.replace('REZERVASYON YAP', target['book_text'])
            
            # 8. CSS Paths
            # The template uses /assets/css/... which is absolute, so it works everywhere.
            # /assets/img/... also absolute.
            
            # WRITE
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
                
            # print(f"  Updated {filename}")
        
        print(f"  Completed {len(files)} files in {target['lang']}.")

if __name__ == "__main__":
    process_targets()
