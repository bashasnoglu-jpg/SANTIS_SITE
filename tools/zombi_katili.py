import os
import re

ROOT_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE"

def purge_zombie_links(dir_path):
    files_modified = 0
    links_fixed = 0
    
    # Hedefimiz: href="..." içerisindeki ?lang=en, &lang=en, ?lang=ru vb. kalıntıları silmek
    # Query parametrelerindeki lang anahtarını tamamen sileriz.
    pattern = re.compile(r'(href=["\'])([^"\']*)(\?|&)lang=[a-z]{2}(&)?([^"\']*)(["\'])')
    
    for root, dirs, files in os.walk(dir_path):
        # Admin ve yedek klasörlerini es geç
        if '_backup' in root or '.git' in root or 'node_modules' in root:
            continue
            
        for f in files:
            if f.endswith('.html'):
                filepath = os.path.join(root, f)
                with open(filepath, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                # Zombileri Bul ve Yok et
                def link_replacer(match):
                    nonlocal links_fixed
                    links_fixed += 1
                    
                    href_start = match.group(1) # href="
                    url_base = match.group(2)   # /masaj.html
                    sep = match.group(3)        # ? veya &
                    amp = match.group(4)        # & (başka parametre varsa)
                    rest = match.group(5)       # başka parametrelerin devamı
                    href_end = match.group(6)   # "
                    
                    # Eğer ?lang=en&foo=bar şeklindeyse -> ?foo=bar
                    # Eğer ?foo=bar&lang=en şeklindeyse -> ?foo=bar
                    # Eğer sadece ?lang=en ise -> sil
                    
                    new_url = url_base
                    if rest:
                        if sep == '?':
                            new_url += '?' + rest
                        else:
                            new_url += sep + rest
                            
                    return f"{href_start}{new_url}{href_end}"
                
                # RegEx'i dosya bitene kadar uygula
                new_content, count = pattern.subn(link_replacer, content)
                
                if count > 0:
                    with open(filepath, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    files_modified += 1
                    print(f"🧹 Temizlendi: {os.path.relpath(filepath, ROOT_DIR)} ({count} Zombi)")
                    
    print("\n" + "="*50)
    print(f"✅ SİSTEM ARINDIRILDI: ZOMBi LİNK KATLİAMI TAMAMLANDI")
    print(f"Toplam Onarılan Dosya: {files_modified}")
    print(f"Toplam Yok Edilen Zombi Link: {links_fixed}")
    print("="*50 + "\n")

if __name__ == '__main__':
    print("🚀 Sovereign Zombi Katili Başlatılıyor...")
    purge_zombie_links(ROOT_DIR)
