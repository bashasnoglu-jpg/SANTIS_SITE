import os
import re

files = ['masaj.html', 'hamam.html', 'cilt-bakimi.html', 'tr/index.html']

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove content-visibility: auto; contain-intrinsic-size: ...;
        new_content = re.sub(r' content-visibility:\s*auto;\s*contain-intrinsic-size:[^;]+;', '', content)
        new_content = re.sub(r'content-visibility:\s*auto;\s*contain-intrinsic-size:[^;\"\']+[;]?', '', new_content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f'Fixed {filepath}')
    else:
        print(f'File {filepath} not found')
