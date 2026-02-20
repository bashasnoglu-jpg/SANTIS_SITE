import os

root_dir = r"C:\Users\tourg\Desktop\SANTIS_SITE"
target = "/tr/cilt-bakimi/derin-temizlik.html"
replacement = "/tr/cilt-bakimi/deep-cleanse.html"

count = 0
for subdir, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".html"):
            path = os.path.join(subdir, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            if target in content:
                content = content.replace(target, replacement)
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                count += 1
                
print(f"Fixed {count} files.")
