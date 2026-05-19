import os

PWA_TAGS = '\n<meta name="theme-color" content="#000000">\n<link rel="manifest" href="/manifest.json">\n</head>'

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '/manifest.json' in content:
        return # Already injected
        
    head_end = content.find('</head>')
    if head_end == -1:
        return
        
    new_content = content.replace('</head>', PWA_TAGS)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'Injected: {file_path}')

for root, dirs, files in os.walk('c:/Users/tourg/Desktop/SANTIS_SITE'):
    if '_legacy' in root or '_dev_archives' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))
