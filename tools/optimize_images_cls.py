import os
import re
from pathlib import Path
from bs4 import BeautifulSoup
from PIL import Image

def optimize_images():
    root_dir = Path(".")
    exclude_dirs = {".git", "node_modules", "tools", "_tools", "logs", "reports", "core", "test", "tests", "_deploy_stage", "_build", "_backup", "admin", "components", "_legacy_archive", "_legacy_content"}
    
    html_files = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs and not d.startswith('.')]
        for filename in filenames:
            if filename.endswith(".html"):
                html_files.append(Path(dirpath) / filename)

    modified_count = 0
    total_imgs_processed = 0
    missing_assets = 0
    
    for file_path in html_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        soup = BeautifulSoup(content, "html.parser")
        needs_save = False
        
        for img in soup.find_all("img"):
            src = img.get("src")
            if not src or src.startswith("data:") or src.startswith("http"):
                continue # Skip base64 and external images
                
            # Normalize path
            if src.startswith("/"):
                img_path = root_dir / src.lstrip("/")
            else:
                # relative to html file
                img_path = (file_path.parent / src).resolve()
                
            # Basic fallback for dynamic data bindings or angular/vue templates
            if "{" in src or "$" in src:
                continue
                
            # Check if image actually exists to read dimensions
            if img_path.exists() and img_path.is_file():
                try:
                    with Image.open(img_path) as photo:
                        width, height = photo.size
                        
                        # Apply Width / Height if missing to prevent CLS
                        if not img.get("width"):
                            img["width"] = str(width)
                            needs_save = True
                        if not img.get("height"):
                            img["height"] = str(height)
                            needs_save = True
                            
                        # Apply Lazy Loading & Async Decoding for Offscreen Images
                        # Rule: If it's the very first image (Hero), use fetchpriority="high", else lazy
                        # For simplicity, we assume hero images usually have a specific class or parent,
                        # but "lazy" globally is a good baseline except for classes containing 'hero'
                        
                        is_hero = False
                        classes = img.get("class", [])
                        parent_classes = img.parent.get("class", []) if img.parent else []
                        
                        if any("hero" in c.lower() for c in classes) or any("hero" in c.lower() for c in parent_classes):
                            is_hero = True
                            
                        # User Rule: For above-the-fold hero images, `loading="lazy"` should be avoided, and `fetchpriority="high"` can be used instead.
                        if is_hero:
                            if img.get("loading") == "lazy":
                                del img["loading"] # Remove lazy
                                needs_save = True
                            if not img.get("fetchpriority"):
                                img["fetchpriority"] = "high"
                                needs_save = True
                        else:
                            if not img.get("loading"):
                                img["loading"] = "lazy"
                                needs_save = True
                                
                        if not img.get("decoding"):
                            img["decoding"] = "async"
                            needs_save = True
                            
                        if needs_save:
                            total_imgs_processed += 1
                            
                except Exception as e:
                    pass
            else:
                missing_assets += 1

        if needs_save:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(str(soup))
            modified_count += 1
            print(f"Optimize Edildi ({total_imgs_processed} <img>): {file_path}")

    print(f"\n🚀 CLS Optimizasyonu Tamamlandı.")
    print(f"- {modified_count} dosyada toplam {total_imgs_processed} görsel etiketi zenginleştirildi (Width, Height, Lazy, Async, FetchPriority).")
    if missing_assets > 0:
        print(f"- Uyarı: Disk üzerinde bulunamayan veya dinamik linklenen {missing_assets} görsel (404 riski) tespit edildi.")

if __name__ == "__main__":
    optimize_images()
