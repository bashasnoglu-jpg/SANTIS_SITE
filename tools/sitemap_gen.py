"""
SANTIS SITEMAP GENERATOR v1.0
Generates a complete sitemap.xml with priority, lastmod, and changefreq.
"""
import os, re, datetime
from pathlib import Path

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')
DOMAIN = 'https://santis.club'
SKIP_DIRS = {'_legacy_archive','_legacy_content','_snapshots','backup','backups',
             'node_modules','admin','a4','components','venv','__pycache__',
             '.git','.vscode','_dev_archives','print','public','static','templates',
             'includes','reports','sr','assets'}

TODAY = datetime.date.today().isoformat()

def get_priority(rel):
    """Assign priority based on page depth and type."""
    if rel in ('index.html',):
        return '1.0'
    elif rel.startswith('tr/index') or rel.startswith('en/index'):
        return '0.9'
    elif '/index.html' in rel and rel.count('/') == 2:
        return '0.8'  # category pages
    elif '/index.html' in rel:
        return '0.7'
    elif rel.endswith('.html') and rel.count('/') <= 2:
        return '0.6'  # detail pages
    return '0.5'

def get_changefreq(rel):
    """Assign changefreq based on page type."""
    if 'index.html' in rel:
        return 'weekly'
    return 'monthly'

pages = []
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for f in fn:
        if not f.endswith('.html'): continue
        fp = Path(dp) / f
        rel = str(fp.relative_to(ROOT)).replace('\\', '/')
        # Get file modification time
        mtime = datetime.date.fromtimestamp(fp.stat().st_mtime).isoformat()
        pages.append({
            'loc': f'{DOMAIN}/{rel}',
            'lastmod': mtime,
            'changefreq': get_changefreq(rel),
            'priority': get_priority(rel),
        })

# Sort: higher priority first
pages.sort(key=lambda x: (-float(x['priority']), x['loc']))

# Generate XML
xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>']
xml_lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
for p in pages:
    xml_lines.append('  <url>')
    xml_lines.append(f'    <loc>{p["loc"]}</loc>')
    xml_lines.append(f'    <lastmod>{p["lastmod"]}</lastmod>')
    xml_lines.append(f'    <changefreq>{p["changefreq"]}</changefreq>')
    xml_lines.append(f'    <priority>{p["priority"]}</priority>')
    xml_lines.append('  </url>')
xml_lines.append('</urlset>')

sitemap_content = '\n'.join(xml_lines)

output_path = ROOT / 'sitemap.xml'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(sitemap_content)

print(f'sitemap.xml oluşturuldu: {len(pages)} URL')
print(f'Dosya boyutu: {len(sitemap_content)} byte')
print(f'\nÖncelik dağılımı:')
from collections import Counter
prio_counts = Counter(p['priority'] for p in pages)
for prio, count in sorted(prio_counts.items(), reverse=True):
    print(f'  priority={prio}: {count} URL')
