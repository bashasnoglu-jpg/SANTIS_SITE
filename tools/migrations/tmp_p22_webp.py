import os
import re

TARGET_DIR = r"c:/Users/tourg/Desktop/SANTIS_SITE"

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Replace png/jpg with webp if the webp file exists
        def img_replacer(match):
            full_match = match.group(0)
            src_str = match.group(1)
            ext = src_str.lower().split('.')[-1]
            if ext in ['png', 'jpg', 'jpeg']:
                # See if a webp version exists
                src_clean = src_str
                if src_clean.startswith('/') and not src_clean.startswith('//'):
                    q_idx = src_clean.find('?')
                    if q_idx != -1: src_clean = src_clean[:q_idx]
                    
                    local_img_path = os.path.join(TARGET_DIR, src_clean.lstrip('/'))
                    webp_path = local_img_path.rsplit('.', 1)[0] + '.webp'
                    
                    if os.path.exists(webp_path):
                        return full_match.replace(src_str, src_str.rsplit('.', 1)[0] + '.webp')
            return full_match

        # Matches src="..." inside an img or source tag (not data uris)
        content = re.sub(r'src=["\'](?!data:)([^"\']{1,250}\.(?:png|jpg|jpeg))["\']', img_replacer, content, flags=re.IGNORECASE)

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Upgraded to WebP: {filepath}")

    except Exception as e:
        pass

for root, dirs, files in os.walk(TARGET_DIR):
    if '_archive' in root or 'node_modules' in root or '.git' in root or 'dist' in root or '_dev_archives' in root or 'tr\\' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))
