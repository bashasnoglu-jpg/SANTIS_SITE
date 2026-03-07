import os
import re

# THE GHOST PURGE - Sovereign Core Settings
TARGET_DIR = "."

def purge_ghost_links():
    print("🚀 PHASE 2: THE GHOST LINK PURGE ACTIVATED")
    fixed_files = 0
    
    # Hedef: "/_backup_legacy/" veya "/_backup_manual/" içeren tüm çürük rotalar
    # Örnek: "/tr/masajlar/_backup_legacy/shiatsu.html" -> "/tr/masajlar/shiatsu.html"
    pattern = re.compile(r'/_backup_(legacy|manual)/')

    for root, dirs, files in os.walk(TARGET_DIR):
        # Exclude large/system directories
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'venv', '.wrangler', '__pycache__']]
        for file in files:
            # HTML, JS ve JSON veri damarlarını tara
            if file.endswith((".html", ".js", ".json")):
                filepath = os.path.join(root, file)
                
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()

                    if pattern.search(content):
                        new_content = pattern.sub('/', content)
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        fixed_files += 1
                        print(f"  ✅ Purged ghost links in: {file}")
                except Exception as e:
                    print(f"  ❌ Error processing {file}: {e}")

    print(f"\n🛡️ PURGE COMPLETE. {fixed_files} files sanitized. 404 Massacre ended.")

if __name__ == "__main__":
    purge_ghost_links()
