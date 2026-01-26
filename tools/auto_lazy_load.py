import os
import re

# Dosyaların bulunduğu kök dizin
root_dir = r"c:\Users\tourg\Desktop\SANTIS_SITE"

# Lazy loading eklenmeyecek class'lar (Örn: Hero görseli hemen yüklenmeli)
exclude_classes = ['hero-img', 'main-banner', 'logo-icon']

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Regex: img etiketlerini bul
    # <img ... > yapısını yakalar
    # loading="lazy" zaten varsa atlar
    
    new_content = content
    
    # Basit bir değiştirme mantığı:
    # <img src="..." alt="..."> -> <img src="..." alt="..." loading="lazy">
    # Ancak "hero" class'ı varsa ekleme.
    
    def replacement(match):
        img_tag = match.group(0)
        
        # Zaten lazy var mı?
        if 'loading="lazy"' in img_tag or "loading='lazy'" in img_tag:
            return img_tag
            
        # Hero görseli mi? (Genellikle sayfanın üstündedir, manuel kontrol zordur ama hero class varsa atla)
        if 'hero' in img_tag or 'fetchpriority="high"' in img_tag:
            return img_tag
            
        # Kapatma taginden önceye loading="lazy" ekle
        if '/>' in img_tag:
            return img_tag.replace('/>', ' loading="lazy" decoding="async"/>')
        else:
            return img_tag.replace('>', ' loading="lazy" decoding="async">')

    # Regex: <img [^>]+>
    # Basitçe tüm img taglerini bulup fonksiyona sokuyoruz
    new_content = re.sub(r'<img\s+[^>]+>', replacement, content)

    if new_content != content:
        print(f"Optimized: {filepath}")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
    else:
        pass
        # print(f"Skipped (No changes): {filepath}")

def main():
    print("Starting Lazy Loading Optimization...")
    for subdir, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".html"):
                filepath = os.path.join(subdir, file)
                process_file(filepath)
    print("Optimization Complete!")

if __name__ == "__main__":
    main()
