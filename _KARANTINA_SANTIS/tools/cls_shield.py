import os
import re
from PIL import Image

ROOT_DIR = "c:/Users/tourg/Desktop/SANTIS_SITE"

# <img ... > taglerini yakalayan regex
img_pattern = re.compile(r'<img\s+([^>]+)>', re.IGNORECASE)
src_pattern = re.compile(r'src=["\']([^"\']+)["\']', re.IGNORECASE)

def parse_attrs(attr_str):
    # Basit attribute parse
    attrs = {}
    tokens = re.findall(r'(\w+)=["\']([^"\']*)["\']|(\w+)', attr_str)
    for t in tokens:
        if t[0] and t[1] is not None:
            attrs[t[0].lower()] = t[1]
        elif t[2]:
            attrs[t[2].lower()] = ""
    return attrs

def reconstruct_img(attrs):
    parts = []
    for k, v in attrs.items():
        if v == "":
            parts.append(k)
        else:
            parts.append(f'{k}="{v}"')
    return "<img " + " ".join(parts) + ">"

def process_html_files():
    print("Sovereign Protocol: Starting CLS Shield (Image Attribute Injector)...")
    updated_files = 0
    
    for current_root, dirs, files in os.walk(ROOT_DIR):
        if 'node_modules' in current_root or 'venv' in current_root or 'backup' in current_root or '.git' in current_root:
            continue
            
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(current_root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    original_content = content
                    idx_offset = 0
                    
                    # Sayfadaki ilk resim hero sayılabilir veya "hero" kelimesi geçenler
                    img_count = 0
                    
                    def img_repl(match):
                        nonlocal img_count
                        img_count += 1
                        
                        attr_str = match.group(1)
                        attrs = parse_attrs(attr_str)
                        
                        src = attrs.get('src', '')
                        if not src:
                            return match.group(0) # Src yoksa dokunma
                            
                        # Resim dosyasının fiziksel yolunu bul
                        local_path = None
                        if src.startswith('http') or src.startswith('data:'):
                            pass # Harici resim veya base64
                        elif src.startswith('/'):
                            local_path = os.path.join(ROOT_DIR, src.lstrip('/'))
                        elif src.startswith('../'):
                            # Basit relative resolution
                            parts = src.split('/')
                            ups = parts.count('..')
                            base_dir = current_root
                            for _ in range(ups):
                                base_dir = os.path.dirname(base_dir)
                            local_path = os.path.join(base_dir, *[p for p in parts if p != '..'])
                        else:
                            local_path = os.path.join(current_root, src)
                            
                        # Width ve Height Ekle
                        if local_path and os.path.exists(local_path):
                            try:
                                with Image.open(local_path) as img:
                                    w, h = img.size
                                    if 'width' not in attrs: attrs['width'] = str(w)
                                    if 'height' not in attrs: attrs['height'] = str(h)
                            except Exception:
                                pass
                                
                        # Sovereign 4-Template Loading Logic
                        attrs['decoding'] = "async"
                        
                        is_hero = img_count <= 2 or 'hero' in attrs.get('class', '').lower()
                        
                        if is_hero:
                            if 'loading' in attrs: del attrs['loading']
                            attrs['fetchpriority'] = "high"
                        else:
                            if 'fetchpriority' in attrs: del attrs['fetchpriority']
                            attrs['loading'] = "lazy"
                            
                        # Reconstruct
                        return reconstruct_img(attrs)
                        
                    new_content = img_pattern.sub(img_repl, content)
                    
                    if new_content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        updated_files += 1
                except Exception as e:
                    print(f"Error processing HTML {file_path}: {e}")
                    
    print(f"✓ CLS Shield Mühürlendi. Toplam {updated_files} HTML dosyasına Sovereign Image Standartları uygulandı.")

if __name__ == "__main__":
    process_html_files()
