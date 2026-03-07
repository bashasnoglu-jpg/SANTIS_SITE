import os
import re
from pathlib import Path

targets = ['fallback_data.js', 'app.js']

count = 0
for r, d, f in os.walk('.'):
    d[:] = [x for x in d if x not in ['.git', 'node_modules', 'venv', '_backup', 'reports']]
    for file in f:
        # Check all category indexes (hamam, massage, skincare, products, hammam)
        if file == 'index.html' and any(cat in r.lower() for cat in ['hamam', 'hammam', 'masaj', 'massage', 'cilt', 'skincare', 'urunler', 'products']):
            filepath = os.path.join(r, file)
            # Exclude root index.html
            if len(Path(filepath).parts) <= 2:
                continue

            try:
                with open(filepath, 'r', encoding='utf-8') as fh:
                    content = fh.read()
                
                original = content

                # Remove fallback_data.js entirely
                content = re.sub(r'<script\s+[^>]*src="[^"]*fallback_data\.js"[^>]*></script>\s*', '', content)
                
                # Check for double app.js injection (keep the first, remove the second)
                appjs_count = content.count('src="/assets/js/app.js"')
                if appjs_count > 1:
                    # Remove the exact string of the duplicate
                    content = content.replace('<script defer="" src="/assets/js/app.js"></script>', '', 1) 
                    print(f"Removed duplicate app.js in {filepath}")

                if original != content:
                    with open(filepath, 'w', encoding='utf-8') as fh:
                        fh.write(content)
                    print(f"Patched scripts in {filepath}")
                    count += 1
            except Exception as e:
                pass

print(f"Total files script-patched: {count}")
