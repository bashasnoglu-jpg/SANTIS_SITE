import os
import re

files = [
    'c:\\Users\\tourg\\Desktop\\SANTIS_SITE\\assets\\js\\boot\\santis-bootloader.js',
    'c:\\Users\\tourg\\Desktop\\SANTIS_SITE\\assets\\js\\core\\santis-core.js'
]

for f_path in files:
    with open(f_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update massage-matrix.js
    content = re.sub(r'massage-matrix\.js\?v=([a-zA-Z0-9_]+)', 'massage-matrix.js?v=V51_GHOST14', content)
    # Update interaction-engine.js
    content = re.sub(r'interaction-engine\.js\?v=([a-zA-Z0-9_]+)', 'interaction-engine.js?v=V51_GHOST14', content)
    
    with open(f_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated bootloader and core cache versions to V51_GHOST14.")
