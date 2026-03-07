import os
import re
from bs4 import BeautifulSoup

def santis_auditor_fixer():
    root_dir = 'c:/Users/tourg/Desktop/SANTIS_SITE'
    exclude_dirs = ['_backup', '_dev_archives', 'node_modules', '.git', 'venv']
    
    fixed_files_count = 0
    total_links_fixed = 0
    total_alts_fixed = 0
    total_imgs_fixed = 0

    print("🦅 SANTIS_AUDITOR.py BAŞLATILDI - God Architecture v3 İnşa Ediliyor...\n")

    for root, dirs, files in os.walk(root_dir):
        # Exclude directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('_backup_')]
        
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, root_dir)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    soup = BeautifulSoup(content, 'html.parser')
                    modified = False

                    # 1. Kırık Link (#) İmhası -> data-route & javascript:void(0)
                    for a in soup.find_all('a'):
                        href = a.get('href', '')
                        if href == '#' or href == '':
                            a['href'] = 'javascript:void(0)'
                            a['data-route'] = 'unassigned_spa_route' # Neural Route Guard placeholder
                            total_links_fixed += 1
                            modified = True

                    # 2. Eksik ALT etiketlerinin Otonom Doldurulması
                    for img in soup.find_all('img'):
                        alt = img.get('alt', '')
                        src = img.get('src', '')
                        
                        # Generate alt text from src filename if missing or placeholder
                        if not alt or 'placeholder' in alt.lower():
                            if src:
                                filename = os.path.basename(src)
                                name_without_ext = os.path.splitext(filename)[0]
                                # Create a readable name (e.g. "luxury-spa" -> "Luxury Spa")
                                readable_alt = name_without_ext.replace('-', ' ').replace('_', ' ').title()
                                img['alt'] = readable_alt + ' - Santis Club Experience'
                            else:
                                img['alt'] = 'Santis Club Experience - Premium View'
                                
                            total_alts_fixed += 1
                            modified = True
                            
                        # 3. Placeholder görsel tespiti ve data-media etiketi ataması
                        if 'placeholder' in src.lower():
                            img['data-media'] = 'pending_neurova_luxury_asset'
                            total_imgs_fixed += 1
                            modified = True

                    if modified:
                        # Write back the changes
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(str(soup))
                        fixed_files_count += 1
                        print(f"✅ Onarıldı: {rel_path}")

                except Exception as e:
                    print(f"❌ Hata: {rel_path} - {e}")

    print("\n---------------------------------------------------")
    print("⚡ SANTIS_AUDITOR İNFAZ RAPORU ⚡")
    print("---------------------------------------------------")
    print(f"Müdahale Edilen Dosya Sayısı : {fixed_files_count}")
    print(f"Düzeltilen Kırık Linkler (#)  : {total_links_fixed}")
    print(f"Otonom Doldurulan Alt Tag'ler: {total_alts_fixed}")
    print(f"Mühürlenen Placeholder'lar   : {total_imgs_fixed}")
    print("---------------------------------------------------")
    print("God Architecture v3 Mühürlendi! 🛡️⚙️")

if __name__ == '__main__':
    santis_auditor_fixer()
