import os
import shutil
from pathlib import Path
from PIL import Image

# SANTIS IMAGE OPTIMIZER & CLS SHIELD (V23)
# The Sovereign WebP Converter

ROOT_PATH = Path("c:/Users/tourg/Desktop/SANTIS_SITE")
IMG_DIR = ROOT_PATH / "assets" / "img"
BACKUP_DIR = ROOT_PATH / "backup_assets" / "img"

SUPPORTED_FORMATS = {".jpg", ".jpeg", ".png"}

def optimize_images():
    print("Sovereign Protocol: Starting Visual Armor (WebP Conversion)...")
    
    if not IMG_DIR.exists():
        print("No image directory found at", IMG_DIR)
        return
        
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    
    count = 0
    errors = 0
    
    # Rekürsif olarak tüm görselleri bul
    for current_root, dirs, files in os.walk(IMG_DIR):
        for file in files:
            file_path = Path(current_root) / file
            if file_path.suffix.lower() in SUPPORTED_FORMATS:
                try:
                    # Yeni WebP yolu
                    webp_path = file_path.with_suffix(".webp")
                    
                    # Eğer WebP zaten var ise atla
                    if webp_path.exists():
                        continue
                        
                    # Backup Yolu oluştur (aynı dizin yapısını koruyarak)
                    rel_path = file_path.relative_to(IMG_DIR)
                    backup_file_path = BACKUP_DIR / rel_path
                    backup_file_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Orijinal dosyayı yedekle
                    shutil.copy2(file_path, backup_file_path)
                    
                    # RGBA to RGB (Jpeg çevrimi / WebP alpha desteği vardır ama save için)
                    with Image.open(file_path) as img:
                        # %85-90 kalite, optimize edilmiş
                        img.save(webp_path, "WEBP", quality=85, method=6)
                    
                    print(f"✓ Optimized: {rel_path} -> {webp_path.name}")
                    count += 1
                    
                    # Çevrim bittikten sonra eski jpeg/png dosyasını sil (Sovereign Temizlik)
                    file_path.unlink()
                except Exception as e:
                    print(f"⚠️ Error converting {file_path.name}: {e}")
                    errors += 1
                    
    print(f"\\n✅ The Visual Forge Complete. {count} images converted to WebP. {errors} errors.")
    print(f"Originals safely sealed in {BACKUP_DIR}")

if __name__ == "__main__":
    optimize_images()
