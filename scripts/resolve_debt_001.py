import os
import re

base_dir = r"C:\Users\tourg\Desktop\SANTIS_SITE"
excluded_dirs = {'dist', 'node_modules', '.git', 'backend', '.gemini', 'scripts', 'assets'}

def fix_scripts(html_content):
    scripts = re.findall(r'<script\b[^>]*>', html_content, re.IGNORECASE)
    new_content = html_content
    for script in scripts:
        if 'src=' in script and ('type="module"' not in script and "type='module'" not in script):
            new_script = script.replace('<script', '<script type="module"', 1)
            new_content = new_content.replace(script, new_script)
    return new_content

print("🦅 [V8 OMEGA] DEBT-001 Temizleyici (PHASE 2 & 3) Başlatıldı - Hedef: Tüm Kök ve /tr/ Klasörleri\n")

files_modified = 0
for root, dirs, files in os.walk(base_dir):
    # Dışlanan klasörleri atla
    dirs[:] = [d for d in dirs if d not in excluded_dirs]
    for filename in files:
        if filename.endswith('.html'):
            filepath = os.path.join(root, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                updated_content = fix_scripts(content)
                if updated_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(updated_content)
                    files_modified += 1
                    short_path = filepath.split('SANTIS_SITE\\')[-1]
                    print(f"✔ Mühürlendi: {short_path}")
            except Exception as e:
                pass

print(f"\n✅ Tüm Kıta Temizliği Tamamlandı! Toplam {files_modified} HTML dosyası daha zırhlandı!")
