import os
import sys
import json
import argparse
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

# [SOVEREIGN SEAL: THE UNIVERSE BUILDER (SSG MUSCLE) - PHASE 54]

BASE_DIR = Path(__file__).resolve().parent.parent
UNIVERSE_DATA = BASE_DIR / "ai" / "content_universe.json"
TEMPLATES_DIR = BASE_DIR / "templates"
PUBLIC_DIR = BASE_DIR # The user usually puts output directly in the project root like de/ or tr/

def build_node(node_id: str, node_data: dict):
    """Fiziksel HTML formasyonunu (Jinja2) yürütür."""
    # Varsayılan template
    template_name = node_data.get("template", "market_expansion") + ".html"
    
    # Jinja2 Motoru Yüklemesi
    env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))
    
    try:
        template = env.get_template(template_name)
    except Exception as e:
        print(f"🚨 [TEMPLATE NOT FOUND] '{template_name}' bulunamadı. Hata: {e}")
        return False
        
    # URL Rotasını Çıkar (Örn: /de/wien-exclusive)
    # Eğer url yoksa, node_id'den türet: /Market_Expansion/node_id
    route = node_data.get("url", f"/{node_id}")
    if route.startswith("/"):
        route = route[1:] # baştaki slash'ı sil
        
    # Fiziksel Yolu Hesapla (Örn: c:\SANTIS_SITE\de\wien-exclusive\index.html)
    output_dir = PUBLIC_DIR / route
    output_file = output_dir / "index.html"
    
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Render işlemini gerçeklesitir
        html_content = template.render(node=node_data, node_id=node_id)
        
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        print(f"👑 [SSG BUILD] '{node_id}' Mühürlendi -> {output_file}")
        return True
    except Exception as e:
        print(f"🚨 [RENDER FAILED] '{node_id}' inşası çöktü: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Santis OS Universe Builder (SSG)")
    parser.add_argument("--build-single", type=str, help="Sadece belirli bir JSON node_id'sini (veya filename) render eder.")
    args = parser.parse_args()

    # 1. Matrisi Oku
    if not UNIVERSE_DATA.exists():
        print(f"🚨 [MATRIX OFFLINE] {UNIVERSE_DATA} bulunamadı.")
        sys.exit(1)
        
    with open(UNIVERSE_DATA, "r", encoding="utf-8") as f:
        try:
            universe = json.load(f)
            pages = universe.get("pages", {})
        except json.JSONDecodeError:
            print("🚨 [MATRIX CORRUPTED] content_universe.json okunamadı.")
            sys.exit(1)

    if args.build_single:
        # 2. --build-single komutu ile geliyorsa (.json uzantısı olabilir kaldır)
        target = args.build_single.replace(".json", "")
        if target in pages:
            build_node(target, pages[target])
        else:
            print(f"🚨 [NODE ABSENT] '{target}' Kuantum Vadisinde bulunamadı.")
    else:
        # 3. Tüm Evreni Baştan İnşa Et
        print(f"🌌 [UNIVERSE EXPANSION] Toplam {len(pages)} şaheser inşa ediliyor...")
        success_count = 0
        for node_id, data in pages.items():
            if build_node(node_id, data):
                success_count += 1
        print(f"✅ [BUILD COMPLETE] {success_count}/{len(pages)} sayfa Matrix'e yüklendi.")

if __name__ == "__main__":
    main()
