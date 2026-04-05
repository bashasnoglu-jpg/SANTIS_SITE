import os
import re

css_dir = os.path.join('assets', 'css')

for root, _, files in os.walk(css_dir):
    for filename in files:
        if filename.endswith('.css'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'content-visibility:' in content:
                # Remove content-visibility declarations
                new_content = re.sub(r'\s*content-visibility:\s*auto;?', '', content)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                print(f'Fixed {filepath}')
print('CSS purge complete.')
