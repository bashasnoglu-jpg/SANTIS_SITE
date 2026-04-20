
import os
import re
import argparse
from pathlib import Path

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

def load_template(template_path):
    if not template_path.exists():
        raise FileNotFoundError(f"Template not found: {template_path}")
    with open(template_path, "r", encoding="utf-8") as f:
        return f.read()

def process_targets(base_dir, template_path, args):
    print("Starting synchronization...")
    try:
        template_content = load_template(template_path)
    except Exception as e:
        print(f"Hata: {e}")
        return

    for target in TARGETS:
        target_path = base_dir / target["dir"]
        if not target_path.exists():
            print(f"Creating missing directory: {target_path}")
            if args.apply:
                target_path.mkdir(parents=True, exist_ok=True)
            
        print(f"Processing lang '{target['lang']}' in {target['dir']}...")
        
        if not target_path.exists():
            continue
            
        files = [f for f in os.listdir(target_path) if f.endswith(".html") and f != "index.html"]
        if not files:
            print(f"  No HTML files found in {target['dir']}.")
            continue

        for filename in files:
            file_path = target_path / filename
            slug = filename.replace(".html", "")
            
            content = template_content
            
            content = re.sub(r'lang="tr"', f'lang="{target["lang"]}"', content)
            content = re.sub(r'data-site-root="/"', f'data-site-root="{target["site_root"]}"', content)
            
            content = re.sub(r"window\.SERVICE_ID\s*=\s*'[^']+'", f"window.SERVICE_ID = '{slug}'", content)
            content = re.sub(r'data-service-id="[^"]+"', f'data-service-id="{slug}"', content)

            content = content.replace("| Santis Skin Care", f"| {target['title_suffix']}")
            
            new_canonical = f"https://santis-club.com/{target['dir']}/{filename}"
            content = re.sub(r'<link rel="canonical" href="[^"]+">', f'<link rel="canonical" href="{new_canonical}">', content)
            
            content = content.replace('/tr/index.html', target['home_url'])
            content = content.replace('Ana Sayfa', target['home_text'])
            content = content.replace('/tr/cilt-bakimi/index.html', target['cat_url'])
            content = content.replace('Cilt Bakımı', target['cat_text'])

            content = content.replace('KOLEKSİYONA DÖN', target['back_text'])
            content = content.replace('REZERVASYON YAP', target['book_text'])
            
            if args.apply:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"  [OK] Updated {filename}")
            else:
                print(f"  [DRY-RUN] Will update {filename}")
        
        print(f"  Completed {len(files)} files in {target['lang']}.")

def main():
    parser = argparse.ArgumentParser(description="Sync Skin Care Pages to all languages")
    default_root = Path(__file__).resolve().parents[1]
    
    parser.add_argument("--root", type=Path, default=default_root, help="Proje kök dizini (varsayılan: scriptin 2 üst dizini)")
    parser.add_argument("--apply", action="store_true", help="Değişiklikleri kaydeder")
    args = parser.parse_args()
    
    base_dir = args.root.resolve()
    template_path = base_dir / "tr" / "cilt-bakimi" / "classic-facial.html"
    
    process_targets(base_dir, template_path, args)
    
    if not args.apply:
        print("\n🔍 DRY-RUN aktif. Kaydetmek için --apply kullanın.")

if __name__ == "__main__":
    main()
