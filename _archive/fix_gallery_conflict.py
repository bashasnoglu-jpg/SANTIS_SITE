import os
import re

targets = ['fallback_data.js', 'gallery-data.js', 'gallery-loader.js']

count = 0
for r, d, f in os.walk('.'):
    # Skip non-essential dirs
    d[:] = [x for x in d if x not in ['.git', 'node_modules', 'venv', '_backup', 'reports']]
    for file in f:
        if file == 'index.html' and 'galeri' in r.lower() or 'gallery' in r.lower():
            if not file.endswith('.html'): continue
            filepath = os.path.join(r, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as fh:
                    content = fh.read()
                
                original = content
                for target in targets:
                    # Remove anything like <script src="/assets/js/fallback_data.js"></script>
                    content = re.sub(r'<script\s+[^>]*src="[^"]*' + target + r'"[^>]*></script>\s*', '', content)

                if original != content:
                    with open(filepath, 'w', encoding='utf-8') as fh:
                        fh.write(content)
                    print(f"Fixed double-engine conflict in {filepath}")
                    count += 1
            except Exception as e:
                pass

print(f"Total files patched: {count}")
