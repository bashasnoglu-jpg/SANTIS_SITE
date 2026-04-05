import os
import re
from pathlib import Path

# Hedef klasörler
TARGET_DIRS = [
    'assets/css',
    'admin/assets/css'
]

# Hedef dosya uzantıları
EXTENSIONS = ['.css']

# Değiştirilecek kurallar
# min-height: 100vh; -> min-height: 100vh; min-height: 100svh;
# height: 100vh; -> height: 100vh; height: 100svh;

def process_css_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # \d+vh yakalayabiliriz ama özellikle 100vh en büyük dert.
    # Regex: min-height:\s*100vh\s*;
    # Sadece bir kere eklenmesini garantiye almak için kontrol
    if "100svh" in content or "100lvh" in content or "100dvh" in content:
        # Eğer zaten eklenmişse atla
        pass
    else:
        # min-height: 100vh; -> min-height: 100vh;\n  min-height: 100svh;
        content = re.sub(
            r'(min-height:\s*100vh\s*;)',
            r'\1\n  min-height: 100svh;',
            content,
            flags=re.IGNORECASE
        )
        
        # height: 100vh; -> height: 100vh;\n  height: 100svh;
        content = re.sub(
            r'([^a-zA-Z-]?height:\s*100vh\s*;)',
            r'\1\n  height: 100svh;',
            content,
            flags=re.IGNORECASE
        )

    if original_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    workspace_root = os.getcwd()
    print(f"[*] Viewport Tarama Modülü Başlatıldı. Root: {workspace_root}")
    
    modified_files = []
    
    for d in TARGET_DIRS:
        target_path = os.path.join(workspace_root, d)
        if not os.path.exists(target_path):
            continue
            
        for root, dirs, files in os.walk(target_path):
            # _dev_archives veya benzeri eski kalıntıları yoksay
            if "_dev_archives" in root or "_quarantine" in root:
                continue
                
            for file in files:
                if any(file.endswith(ext) for ext in EXTENSIONS):
                    filepath = os.path.join(root, file)
                    if process_css_file(filepath):
                        modified_files.append(filepath)
                        print(f"[+] Düzeltildi: {filepath}")
                        
    print(f"\n[*] İşlem Tamamlandı. Toplam düzeltilen dosya: {len(modified_files)}")

if __name__ == '__main__':
    main()
