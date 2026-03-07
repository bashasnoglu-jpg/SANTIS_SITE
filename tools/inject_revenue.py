import os
import glob

# Hedef HTML dosyaları (Tüm dillerin index.html dosyaları)
target_files = glob.glob('*/index.html')

insert_string = '<script defer src="/assets/js/santis-revenue-brain.js?v=9.1"></script>\n'
target_anchor = '<script defer src="/assets/js/santis-v10-core.js?v=9.1"></script>'

for file_path in target_files:
    if file_path == 'index.html': continue  # Ana gateway zaten yapıldı
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'santis-revenue-brain' in content:
        print(f"⏩ {file_path} is already updated.")
        continue
        
    if target_anchor in content:
        new_content = content.replace(target_anchor, target_anchor + '\n    ' + insert_string)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ Injected into: {file_path}")
    else:
        print(f"⚠️ Anchor not found in: {file_path}")
