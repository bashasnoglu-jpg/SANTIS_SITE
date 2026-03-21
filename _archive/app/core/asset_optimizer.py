import os
import sqlite3
import shutil
import re
from pathlib import Path
from PIL import Image

IMAGE_DIR = Path("assets/img")
BACKUP_DIR = Path("_dev_archives/originals")
DB_PATH = Path("santis.db")
QUALITY = 82  # Sovereign Balance (Hız + Kalite)
MIN_SIZE_KB = 150 # Sadece bu boyuttan büyükleri çevir

def h1_optimize_assets():
    print(f"\\n--- ⚓ H1: THE SOVEREIGN COMPRESSOR ---")
    if not BACKUP_DIR.exists():
        BACKUP_DIR.mkdir(parents=True)

    optimized_count = 0
    saved_bytes = 0

    for filepath in IMAGE_DIR.rglob("*"):
        if filepath.is_file() and filepath.suffix.lower() in ['.png', '.jpg', '.jpeg']:
            original_size = filepath.stat().st_size
            
            # 150 KB altındaki ufak ikonları elleme
            if original_size < (MIN_SIZE_KB * 1024):
                continue
                
            webp_path = filepath.with_suffix('.webp')
            
            try:
                # 1. Convert to WebP
                with Image.open(filepath) as img:
                    # Convert RGBA PNG to RGB for JPEG-like WebP compression if needed
                    # but WebP supports alpha, so we keep RGBA if present.
                    img.save(webp_path, "WEBP", quality=QUALITY, method=6)
                
                new_size = webp_path.stat().st_size
                
                # Sadece gerçekten küçüldüyse orijinali yedekle ve sil
                if new_size < original_size:
                    relative_path = filepath.relative_to(IMAGE_DIR)
                    backup_file_path = BACKUP_DIR / relative_path
                    backup_file_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    shutil.move(str(filepath), str(backup_file_path))
                    saved_bytes += (original_size - new_size)
                    optimized_count += 1
                    print(f"✅ {filepath.name} -> {webp_path.name} (Saved: {(original_size - new_size)/1024:.1f} KB)")
                else:
                    # WebP daha büyük olduysa, WebP'yi sil, orijinali bırak
                    webp_path.unlink()
                    
            except Exception as e:
                print(f"❌ Error converting {filepath.name}: {e}")

    print(f"\\n✨ H1 COMPLETE: Optimized {optimized_count} images. Saved total: {saved_bytes / (1024*1024):.2f} MB")
    return optimized_count > 0


def h2_update_database():
    print(f"\\n--- ⚓ H2: DATABASE REFERENCE UPDATE ---")
    if not DB_PATH.exists():
        print("❌ santis.db not found. Skipping H2.")
        return

    try:
        con = sqlite3.connect(DB_PATH)
        cursor = con.cursor()
        
        # Sadece services tablosunda image_url kolonu var, varsa onu güncelle
        # "santis.db" şeması kontrolü
        cursor.execute("PRAGMA table_info(services)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "image_url" in columns:
            cursor.execute('''
                UPDATE services 
                SET image_url = REPLACE(REPLACE(REPLACE(image_url, '.png', '.webp'), '.jpg', '.webp'), '.jpeg', '.webp')
                WHERE image_url LIKE '%.png' OR image_url LIKE '%.jpg' OR image_url LIKE '%.jpeg'
            ''')
            con.commit()
            print(f"✅ Updated {cursor.rowcount} rows in 'services' table.")
        else:
            print("⚠️ 'image_url' column not found in 'services', skipping DB update.")
            
        con.close()
    except Exception as e:
        print(f"❌ DB Update Error: {e}")


def h3_lazy_load_injection():
    print(f"\\n--- ⚓ H3: LAZY-LOAD & ASYNC INJECTION ---")
    html_files = list(Path('.').rglob('*.html'))
    modified_count = 0
    
    # <img> etiketlerini bul. loading veya decoding yoksa ekle.
    # class="... nv-hero ..." gibi şeyler varsa loading="lazy" koymamalıyız (fetchpriority="high" olmalı).
    # Ancak bu script basitçe eksik lazy/async'leri ekleyecek güvenlik ağı gibi çalışır.
    
    for filepath in html_files:
        # Ignore _dev_archives and node_modules
        if "_dev_archives" in filepath.parts or "node_modules" in filepath.parts:
            continue
            
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            original_content = content
            
            # Çok kaba regex değil, öznitelikleri arayan esnek mantık
            # img etiketlerini teker teker işle
            def inject_attrs(match):
                img_tag = match.group(0)
                # Eğer hero/priority resmi ise ellemiyoruz
                if 'fetchpriority="high"' in img_tag or 'loading="eager"' in img_tag or 'hero' in img_tag.lower():
                    # Sadece decoding="async" yoksa ekle
                    if 'decoding="async"' not in img_tag:
                        return img_tag.replace('<img', '<img decoding="async"')
                    return img_tag
                
                new_tag = img_tag
                if 'loading=' not in new_tag:
                    new_tag = new_tag.replace('<img', '<img loading="lazy"')
                if 'decoding=' not in new_tag:
                    new_tag = new_tag.replace('<img', '<img decoding="async"')
                    
                # Eğer .png/.jpg ise .webp'ye çevir (.html içindeki linkler)
                new_tag = new_tag.replace('.png', '.webp').replace('.jpg', '.webp').replace('.jpeg', '.webp')
                return new_tag

            # Replace <img> tags
            content = re.sub(r'<img[^>]+>', inject_attrs, content)
            
            # CSS background veya inline style'lardaki .png/.jpg'leri .webp yap (dikkatle)
            # content = re.sub(r'(url\([\'"]?[^)]+)\.(png|jpg|jpeg)([\'"]?\))', r'\1.webp\3', content, flags=re.IGNORECASE)

            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                modified_count += 1
                
        except Exception as e:
            print(f"❌ Error processing {filepath}: {e}")
            
    print(f"✅ Injected optimal attributes to {modified_count} HTML files.")

if __name__ == "__main__":
    print("🚀 PHASE 26: ASSET AUTO-COMPRESS INITIATED")
    images_optimized = h1_optimize_assets()
    
    if images_optimized:
        h2_update_database()
        
    h3_lazy_load_injection()
    print("\\n💎 PHASE 26 SEALED: Sovereign Speed Achieved.\\n")
