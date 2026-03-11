import os
from bs4 import BeautifulSoup
import csv

def run_audit():
    root_dir = 'c:/Users/tourg/Desktop/SANTIS_SITE'
    exclude_dirs = ['_backup', '_dev_archives', 'node_modules', '.git', 'venv']
    
    issues = []
    
    for root, dirs, files in os.walk(root_dir):
        # Klasör filtreleme
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('_backup_')]
        
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, root_dir)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        soup = BeautifulSoup(f.read(), 'html.parser')
                        
                        # 1. Boş veya Placeholder Linkler
                        for a in soup.find_all('a'):
                            href = a.get('href', '')
                            if href in ['#', '', '/', 'javascript:void(0)']:
                                issues.append({
                                    'File': rel_path,
                                    'Category': 'Navigation',
                                    'Element': str(a)[:100],
                                    'Issue': f'Boş href: "{href}"'
                                })
                                
                        # 2. Resim Alt Etiketleri (Erişilebilirlik ve SEO)
                        for img in soup.find_all('img'):
                            alt = img.get('alt', '')
                            if not alt or 'placeholder' in alt.lower():
                                issues.append({
                                    'File': rel_path,
                                    'Category': 'SEO / Erişilebilirlik',
                                    'Element': str(img)[:100],
                                    'Issue': 'Eksik veya yer tutucu alt etiketi'
                                })

                        # 3. Yüklenmeyen Resimler (Placeholderlar)
                        for img in soup.find_all('img'):
                            src = img.get('src', '')
                            if 'placeholder' in src.lower():
                                issues.append({
                                    'File': rel_path,
                                    'Category': 'UI / Media',
                                    'Element': str(img)[:100],
                                    'Issue': 'Placeholder resim kullanılıyor'
                                })
                except Exception as e:
                    print(f"Hata okunurken: {rel_path} - {e}")
                    
    # Sonuçları CSV'ye dök
    output_csv = os.path.join(root_dir, 'audit_report.csv')
    with open(output_csv, 'w', newline='', encoding='utf-8-sig') as csvfile:
        fieldnames = ['File', 'Category', 'Issue', 'Element']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        writer.writerows(issues)
        
    print(f"Denetim tamamlandı. Toplam {len(issues)} sorun bulundu.")
    print(f"Rapor kaydedildi: {output_csv}")

if __name__ == '__main__':
    run_audit()
