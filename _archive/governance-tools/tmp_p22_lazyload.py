import os
import re
import struct

TARGET_DIR = r"c:/Users/tourg/Desktop/SANTIS_SITE"

def get_image_dimensions(filepath):
    try:
        with open(filepath, 'rb') as f:
            data = f.read(30)
            if data[:4] == b'\x89PNG':
                # PNG
                f.seek(16)
                w, h = struct.unpack('>LL', f.read(8))
                return w, h
            elif data[:2] == b'\xff\xd8':
                # JPEG
                f.seek(0)
                size = 2
                ftype = 0
                max_iterations = 50
                iter_i = 0
                while not (0xc0 <= ftype <= 0xcf and ftype not in (0xc4, 0xcc)) and iter_i < max_iterations:
                    iter_i += 1
                    f.seek(size, 1)
                    byte = f.read(1)
                    if not byte: break
                    while ord(byte) == 0xff: 
                        byte = f.read(1)
                        if not byte: break
                    if not byte: break
                    ftype = ord(byte)
                    s_bytes = f.read(2)
                    if len(s_bytes) < 2: break
                    size = struct.unpack('>H', s_bytes)[0] - 2
                if iter_i < max_iterations and (0xc0 <= ftype <= 0xcf and ftype not in (0xc4, 0xcc)):
                    f.seek(1, 1)
                    s_bytes = f.read(4)
                    if len(s_bytes) == 4:
                        h, w = struct.unpack('>HH', s_bytes)
                        return w, h
                return None, None
            elif data[:4] == b'RIFF' and data[8:12] == b'WEBP':
                # WEBP
                type_id = data[12:16]
                if type_id == b'VP8 ':
                    w, h = struct.unpack('<HH', data[26:30])
                    return w & 0x3fff, h & 0x3fff
                elif type_id == b'VP8L':
                    b0, b1, b2, b3 = data[21], data[22], data[23], data[24]
                    w = 1 + (((b1 & 0x3F) << 8) | b0)
                    h = 1 + (((b3 & 0xF) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6))
                    return w, h
                elif type_id == b'VP8X':
                    w = 1 + (data[24] | (data[25] << 8) | (data[26] << 16))
                    h = 1 + (data[27] | (data[28] << 8) | (data[29] << 16))
                    return w, h
    except Exception as e:
        pass
    return None, None

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Regex to match <img> tags
        img_re = re.compile(r'<img\s+([^>]+)>', re.IGNORECASE)

        def img_replacer(match):
            attrs_str = match.group(1)
            # Find src
            src_match = re.search(r'src=["\']([^"\']+)["\']', attrs_str, re.IGNORECASE)
            
            w_match = re.search(r'width=["\']([^"\']+)["\']', attrs_str, re.IGNORECASE)
            h_match = re.search(r'height=["\']([^"\']+)["\']', attrs_str, re.IGNORECASE)
            load_match = re.search(r'loading=["\']([^"\']+)["\']', attrs_str, re.IGNORECASE)
            dec_match = re.search(r'decoding=["\']([^"\']+)["\']', attrs_str, re.IGNORECASE)
            fetch_match = re.search(r'fetchpriority=["\']([^"\']+)["\']', attrs_str, re.IGNORECASE)
            class_match = re.search(r'class=["\']([^"\']+)["\']', attrs_str, re.IGNORECASE)

            new_attrs = attrs_str

            # Remove trailing slash if it exists
            if new_attrs.endswith('/'):
                new_attrs = new_attrs[:-1].rstrip()
            
            # Clean up the previous run's stray slash before decoding
            new_attrs = new_attrs.replace('/ decoding', 'decoding')

            # 1. Decoding async
            if not dec_match:
                new_attrs += ' decoding="async"'
            
            # 2. Loading lazy (if not fetchpriority high)
            is_hero = False
            if class_match and ('hero' in class_match.group(1).lower() or 'banner' in class_match.group(1).lower()):
                is_hero = True
            
            if fetch_match and fetch_match.group(1).lower() == 'high':
                pass # skip lazy
            elif is_hero and not load_match and not fetch_match:
                new_attrs += ' fetchpriority="high"'
            elif not load_match:
                new_attrs += ' loading="lazy"'

            # 3. Width/Height
            if (not w_match or not h_match) and src_match:
                src = src_match.group(1)
                if not src.startswith('http') and not src.startswith('//'):
                    q_idx = src.find('?')
                    if q_idx != -1: src = src[:q_idx]
                    
                    local_img_path = os.path.join(TARGET_DIR, src.lstrip('/'))
                    w, h = get_image_dimensions(local_img_path)
                    if w and h:
                        if not w_match:
                            new_attrs += f' width="{w}"'
                        if not h_match:
                            new_attrs += f' height="{h}"'
            
            # Avoid duplicate spaces before closing bracket
            new_attrs = new_attrs.rstrip()
            return f'<img {new_attrs}>'

        content = img_re.sub(img_replacer, content)

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            # print(f"Optimized Lazy/CLS: {filepath}")

    except Exception as e:
        print(f"Error in {filepath}: {e}")

for root, dirs, files in os.walk(TARGET_DIR):
    if '_archive' in root or 'node_modules' in root or '.git' in root or 'dist' in root or '_dev_archives' in root or 'tr\\' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))

