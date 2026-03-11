import os
import csv
from bs4 import BeautifulSoup
from collections import defaultdict

root_dir = r"c:\\Users\\tourg\\Desktop\\SANTIS_SITE"
exclude_dirs = ['_backup', '_dev_archives', 'node_modules', '.git', 'venv', '_archive', '.vscode', '.github', 'alembic', '__pycache__', 'reports']

issues = []
all_html_files = []
all_assets = set()

for root, dirs, files in os.walk(root_dir):
    dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('_backup_')]
    for file in files:
        file_path = os.path.join(root, file)
        rel_path = os.path.relpath(file_path, root_dir).replace('\\\\', '/')
        if rel_path.endswith('.html'):
            all_html_files.append(rel_path)
        elif file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.mp4')):
            all_assets.add(rel_path)

html_components = defaultdict(list)
for rel_path in all_html_files:
    fname = os.path.basename(rel_path)
    if 'component' in rel_path.lower() or 'layout' in rel_path.lower() or fname.startswith('nav') or fname.startswith('footer'):
        html_components[fname].append(rel_path)

for fname, paths in html_components.items():
    if len(paths) > 1:
        for p in paths:
             issues.append({
                 'File': p,
                 'Category': 'Duplicate Components',
                 'Issue': f'Duplicate component found: {fname}',
                 'Element': 'File Level'
             })

used_assets = set()

for rel_path in all_html_files:
    file_path = os.path.join(root_dir, rel_path)
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            soup = BeautifulSoup(content, 'html.parser')

            # 1. Navigation Issues
            for a in soup.find_all('a'):
                href = a.get('href')
                elem_str = str(a)[:150].replace('\\n', ' ')
                if href is None or href.strip() == '':
                    issues.append({'File': rel_path, 'Category': 'Navigation', 'Issue': 'Empty href', 'Element': elem_str})
                elif href in ['#', '/']:
                    issues.append({'File': rel_path, 'Category': 'Navigation', 'Issue': f'Placeholder link ({href})', 'Element': elem_str})
                elif href.startswith('/') and not href.startswith('//'):
                    target_path = href.lstrip('/')
                    if target_path and target_path.endswith('.html') and target_path not in all_html_files:
                        issues.append({'File': rel_path, 'Category': 'Navigation', 'Issue': 'Broken internal navigation', 'Element': elem_str})

            # 2, 5, 6, 7. Media and Images
            for img in soup.find_all('img'):
                src = img.get('src')
                data_media = img.get('data-media')
                elem_str = str(img)[:150].replace('\\n', ' ')
                
                if data_media:
                    issues.append({'File': rel_path, 'Category': 'UI / Media', 'Issue': 'Dynamic injection target (data-media)', 'Element': elem_str})
                
                if src:
                    src_clean = src.split('?')[0].lstrip('/')
                    if 'placeholder' in src.lower():
                        issues.append({'File': rel_path, 'Category': 'UI / Media', 'Issue': 'Placeholder image', 'Element': elem_str})
                    elif not src.startswith(('http', 'data:')):
                        bn = os.path.basename(src_clean)
                        found = any(a.endswith(bn) for a in all_assets)
                        if not found and src_clean:
                            issues.append({'File': rel_path, 'Category': 'Phantom Assets', 'Issue': f'Missing physical file: {src}', 'Element': elem_str})
                        else:
                            used_assets.add(src_clean)

                if not img.get('loading') and not img.get('fetchpriority') and not data_media:
                     issues.append({'File': rel_path, 'Category': 'Performance Risks', 'Issue': 'Missing lazy loading or fetchpriority', 'Element': elem_str})
                
                # Check corrupted attributes like and=""
                for attr, val in img.attrs.items():
                    if attr == 'and' and val == '':
                        issues.append({'File': rel_path, 'Category': 'HTML Structure', 'Issue': 'Corrupted attribute (and="")', 'Element': elem_str})

    except Exception as e:
        pass

output_csv = os.path.join(root_dir, 'reports', 'detailed_audit_report.csv')
with open(output_csv, 'w', newline='', encoding='utf-8-sig') as csvfile:
    fieldnames = ['File', 'Category', 'Issue', 'Element']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(issues)

print(f"Detailed Audit Complete. Output saved to {output_csv}")
