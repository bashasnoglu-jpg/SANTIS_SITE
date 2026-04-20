import os
import json
import re

# [SOVEREIGN SEAL: THE EYE OF PROVIDENCE - ZERO DEPENDENCY HTML SLOT SCANNER]
# Faz 49.1 - Göz: Sistemdeki HTML dosyalarında bulunan ancak fiziksel olarak
# 'assets/img/' klasöründe karşılığı olmayan eksik görselleri tespit eder.
# Üçüncü parti kütüphane (BeautifulSoup vb.) KULLANMAZ.

HTML_ROOT = "./"
ASSET_ROOT = "./assets/img"
OUTPUT_FILE = "missing_assets.json"

missing_assets = []

# HTML içindeki img etiketlerini ve src niteliklerini yakalayan regex
img_pattern = re.compile(r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>')
slot_pattern = re.compile(r'data-santis-slot=["\']([^"\']+)["\']')
alt_pattern = re.compile(r'alt=["\']([^"\']+)["\']')

def scan_html(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"⚠️ Hata (Okunamadı): {file_path} - {e}")
        return

    # Tüm <img> etiketlerini bul
    for match in re.finditer(r'<img[^>]+>', content):
        img_tag = match.group(0)
        
        # src niteliğini çıkar
        src_match = re.search(r'src=["\']([^"\']+)["\']', img_tag)
        if not src_match:
            continue
            
        src = src_match.group(1)

        # Sadece '/assets' ile başlayan lokal görselleri denetle
        if not src.startswith("/assets"):
            continue

        # Mutlak yolu projenin kök dizinine göre (relative) ayarla
        asset_path = "." + src

        if not os.path.exists(asset_path):
            # Alt ve Slot ID varsa çıkar (AI Prompting için faydalı olacak)
            slot_match = slot_pattern.search(img_tag)
            slot_id = slot_match.group(1) if slot_match else "Tanımsız"
            
            alt_match = alt_pattern.search(img_tag)
            alt_text = alt_match.group(1) if alt_match else "Bilinmiyor"
            
            missing_assets.append({
                "source_html": file_path,
                "missing_file": src,
                "alt_text": alt_text,
                "slot_id": slot_id
            })

def scan_project():
    print("👁️ [THE EYE OF PROVIDENCE] Zero-Dependency Sistem Taraması Başlatılıyor...")
    scanned_files = 0
    
    ignored_dirs = ['.git', 'node_modules', '.venv', '__pycache__', 'admin-panel']
    
    for root, dirs, files in os.walk(HTML_ROOT):
        # Klasörleri in-place modify ederek os.walk'un diplere inmesini engelle
        dirs[:] = [d for d in dirs if d not in ignored_dirs]

        for file in files:
            if file.endswith(".html"):
                full_path = os.path.join(root, file)
                scan_html(full_path)
                scanned_files += 1

    print(f"✅ Tarama Tamamlandı. Toplam {scanned_files} HTML dosyası incelendi.")

if __name__ == "__main__":
    scan_project()

    # Çıktıyı JSON olarak mühürle (Genesis Core bu dosyayı okuyacak)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(missing_assets, f, indent=4, ensure_ascii=False)

    print("\n--- 🚨 TESPİT EDİLEN EKSİK GÖRSELLER ---")
    if not missing_assets:
        print("Sistem kusursuz. Tüm fiziksel materyaller yerli yerinde.")
    else:
        for idx, m in enumerate(missing_assets, 1):
            print(f"{idx}. {m['missing_file']} (Slot: {m['slot_id']} | Kaynak: {m['source_html']})")
        print(f"\n📁 Genesis Core (Yaratım Motoru) için '{OUTPUT_FILE}' kayıt defteri oluşturuldu.")
