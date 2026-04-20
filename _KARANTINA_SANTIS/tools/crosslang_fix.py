"""
SANTIS CROSS-LANG LINK FIXER v1.0
Replaces TR-specific internal links inside EN/DE/FR/RU pages
with their correct language-specific counterparts.
Also fixes TR text (anchor labels) in EN pages.
"""
import os, re
from pathlib import Path

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')
SKIP_DIRS = {'_legacy_archive','_legacy_content','_snapshots','backup','backups',
             'node_modules','admin','a4','components','venv','__pycache__',
             '.git','.vscode','_dev_archives','print','public','static','templates',
             'includes','reports','assets','tools'}

# TR path → EN path mapping
TR_TO_EN_PATHS = {
    '/tr/masajlar/': '/en/massages/',
    '/tr/hamam/': '/en/hammam/',
    '/tr/cilt-bakimi/': '/en/skincare/',
    '/tr/urunler/': '/en/products/',
    '/tr/galeri/': '/en/gallery/',
    '/tr/hizmetler/': '/en/services/',
    '/tr/blog/': '/en/blog/',
    '/tr/bilgelik/': '/en/wisdom/',
    '/tr/ekibimiz/': '/en/team/',
    '/tr/hakkimizda/': '/en/about/',
    '/tr/rezervasyon/': '/en/booking/',
    '/tr/magaza/': '/en/shop/',
}

# For DE/FR/RU - just keep /tr/ links since we don't have translated directories
# But at minimum fix the related-services Turkish text
TR_TEXT_TO_EN = {
    'Benzer Hizmetler': 'Related Services',
    'Klasik Rahatlama Masajı': 'Classic Relaxation Massage',
    'Anti-Stress Masajı': 'Anti-Stress Massage',
    'Aromaterapi Masajı': 'Aromatherapy Massage',
    'Klasik Masaj': 'Classic Massage',
}

stats = {'path_fixed': 0, 'text_fixed': 0, 'files': 0}

for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for f in fn:
        if not f.endswith('.html'): continue
        fp = Path(dp) / f
        rel = str(fp.relative_to(ROOT)).replace('\\', '/')
        
        # Only process EN pages
        if not rel.startswith('en/'):
            continue
        
        with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
            content = fh.read()
        
        original = content
        
        # 1. Fix TR paths → EN paths (inside href attributes only, not hreflang)
        for tr_path, en_path in TR_TO_EN_PATHS.items():
            # Fix href="/tr/masajlar/..." but NOT hreflang references (those are correct)
            # Pattern: href="/tr/masajlar/..." but not inside hreflang or canonical
            def replace_href(match):
                full = match.group(0)
                # Skip hreflang and canonical links
                if 'hreflang' in full or 'rel="alternate"' in full or 'rel="canonical"' in full:
                    return full
                return full.replace(tr_path, en_path)
            
            pattern = re.compile(r'<(?:a|link)\s[^>]*href=["\'][^"\']*' + re.escape(tr_path) + r'[^"\']*["\'][^>]*>', re.I)
            new_content = pattern.sub(replace_href, content)
            if new_content != content:
                stats['path_fixed'] += 1
                content = new_content
        
        # 2. Fix Turkish anchor text in EN pages
        for tr_text, en_text in TR_TEXT_TO_EN.items():
            if tr_text in content:
                # Only replace when it's inside link text or heading text, not in meta/schema
                content = content.replace(f'>{tr_text}<', f'>{en_text}<')
                content = content.replace(f'>{tr_text}</a>', f'>{en_text}</a>')
                stats['text_fixed'] += 1
        
        if content != original:
            with open(fp, 'w', encoding='utf-8') as fh:
                fh.write(content)
            stats['files'] += 1

print(f'{"="*60}')
print(f'SONUÇLAR:')
print(f'  Path düzeltilen: {stats["path_fixed"]}')
print(f'  Metin düzeltilen: {stats["text_fixed"]}')
print(f'  Toplam dosya: {stats["files"]}')
print(f'{"="*60}')
