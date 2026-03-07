import os

ROOT_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE"
EXCLUDE_DIRS = {"_backup", "_dev_archives", "node_modules", ".git", ".history", "venv", "__pycache__"}
EXTENSIONS = {".html", ".js", ".json", ".py"}

count = 0
for root, dirs, files in os.walk(ROOT_DIR):
    # Exclude directories
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith("_backup_")]
    
    for file in files:
        if any(file.endswith(ext) for ext in EXTENSIONS):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                if "logo.png" in content:
                    new_content = content.replace("logo.png", "logo.png")
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Updated: {file_path}")
                    count += 1
            except Exception as e:
                print(f"Error reading {file_path}: {e}")

print(f"Total files updated: {count}")
