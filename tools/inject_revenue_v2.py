import os
import glob
import re

# Hedef HTML dosyaları (Tüm dillerin index.html dosyaları)
target_files = glob.glob('*/index.html')

insert_string = '<script defer src="/assets/js/santis-revenue-brain.js?v=9.1"></script>\n'
target_anchor_regex = r'(<script\s+defer(?:\s*="")?\s+src="[^"]*santis-nav\.js[^"]*"></script>)'

for file_path in target_files:
    if file_path == 'index.html': continue  # Ana gateway zaten yapıldı
    if file_path == 'tr\\index.html' or file_path == 'tr/index.html': continue # TR yapıldı
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'santis-revenue-brain' in content:
        print(f"⏩ {file_path} is already updated.")
        continue
        
    if re.search(target_anchor_regex, content):
        # santis-nav.js'in bulunduğu satırın hemen altına ekler
        new_content = re.sub(target_anchor_regex, r'\1\n<script defer src="/assets/js/santis-revenue-brain.js?v=9.1"></script>', content)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ Injected into: {file_path}")
    else:
        print(f"⚠️ Anchor (santis-nav) not found in: {file_path}")
