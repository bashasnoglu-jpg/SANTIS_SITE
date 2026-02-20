import os

root = os.getcwd()
missing_paths = [
    "tr/galeri/index.html",
    "tr/urunler/index.html",
    "tr/masajlar/index.html",
    "tr/hamam/index.html",
    "service-detail.html",
    "tr/cilt-bakimi/index.html",
    "tr/urunler/detay.html",
    "admin/gallery-data.js"
]

print(f"Fixing files in {root}...")

for path in missing_paths:
    full_path = os.path.join(root, path)
    dir_name = os.path.dirname(full_path)
    
    if not os.path.exists(dir_name):
        try:
            os.makedirs(dir_name)
            print(f"Created dir: {dir_name}")
        except Exception as e:
            print(f"Error creating dir {dir_name}: {e}")
            
    if not os.path.exists(full_path):
        try:
            with open(full_path, "w", encoding="utf-8") as f:
                if path.endswith(".js"):
                    f.write("const galleryData = [];")
                else:
                    f.write("<!DOCTYPE html><html><body><h1>Santis Placeholder</h1></body></html>")
            print(f"Created file: {path}")
        except Exception as e:
            print(f"Error creating file {path}: {e}")
    else:
        print(f"Exists: {path}")

print("Fix Complete.")
