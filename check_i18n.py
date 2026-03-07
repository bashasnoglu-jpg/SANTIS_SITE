import os
import csv
from collections import defaultdict

root_dir = 'c:/Users/tourg/Desktop/SANTIS_SITE'
exclude_dirs = ['_backup', '_dev_archives', 'node_modules', '.git', 'venv']
lang_stats = defaultdict(lambda: {'tr': 0, 'en': 0, 'de': 0, 'fr': 0, 'ru': 0})

def check_i18n():
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('_backup_')]
        for file in files:
            if file.endswith('.html'):
                path = os.path.join(root, file)
                rel_path = os.path.relpath(path, root_dir)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'data-lang="tr"' in content: lang_stats[rel_path]['tr'] = 1
                        if 'data-lang="en"' in content: lang_stats[rel_path]['en'] = 1
                        if 'data-lang="de"' in content: lang_stats[rel_path]['de'] = 1
                        if 'data-lang="fr"' in content: lang_stats[rel_path]['fr'] = 1
                        if 'data-lang="ru"' in content: lang_stats[rel_path]['ru'] = 1
                except:
                    pass

    missing_langs = []
    for file, stats in lang_stats.items():
        if sum(stats.values()) > 0 and sum(stats.values()) < 5:
            missing_langs.append({
                'File': file,
                'Missing': [lang for lang, present in stats.items() if not present]
            })
            
    print('--- I18N DATA-LANG ANALİZİ ---')
    print(f'data-lang etiketi içeren toplam dosya: {len(lang_stats)}')
    print(f'Eksik dil çevirisi barındıran dosya: {len(missing_langs)}')
    
    # Detayları CSV'ye yazdır.
    output_csv = os.path.join(root_dir, 'i18n_report.csv')
    with open(output_csv, 'w', newline='', encoding='utf-8-sig') as csvfile:
        fieldnames = ['File', 'Missing_Languages']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for item in missing_langs:
            writer.writerow({'File': item['File'], 'Missing_Languages': ', '.join(item['Missing'])})
            
    print(f"Rapor şuraya kaydedildi: {output_csv}")

if __name__ == '__main__':
    check_i18n()
