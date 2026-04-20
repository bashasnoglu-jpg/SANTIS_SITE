"""
SANTIS i18n DEEP SCANNER v1.0
Scans ALL JS files for hardcoded /tr/ paths, replace patterns, and language-switching logic.
"""
import os, re
from pathlib import Path

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE\assets\js')
SKIP = {'node_modules','venv','__pycache__','.git'}

patterns = [
    ('HARDCODED_PATH', re.compile(r'''['"/]/tr/[a-z-]+/''', re.I)),
    ('REPLACE_TR',     re.compile(r'''\.replace\([^)]*['"/]tr['"/]''', re.I)),
    ('INCLUDES_TR',    re.compile(r'''\.includes\([^)]*['"/]tr['"/]''', re.I)),
    ('STARTS_WITH_TR', re.compile(r'''startsWith\([^)]*['"/]tr['"/]''', re.I)),
]

results = {}

for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP]
    for f in fn:
        if not f.endswith('.js'): continue
        fp = Path(dp) / f
        rel = str(fp.relative_to(ROOT)).replace('\\','/')
        
        with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
            lines = fh.readlines()
        
        file_hits = []
        for n, line in enumerate(lines, 1):
            for pname, pat in patterns:
                if pat.search(line):
                    file_hits.append({
                        'line': n,
                        'type': pname,
                        'text': line.strip()[:120]
                    })
        
        if file_hits:
            results[rel] = file_hits

# Print summary
total = 0
for fname in sorted(results.keys()):
    hits = results[fname]
    types = {}
    for h in hits:
        types[h['type']] = types.get(h['type'], 0) + 1
    type_str = ', '.join(f'{v}x {k}' for k,v in types.items())
    print(f'\n=== {fname} ({len(hits)} hits: {type_str}) ===')
    for h in hits[:8]:
        print(f'  L{h["line"]:4d} [{h["type"]:<16}]: {h["text"]}')
    if len(hits) > 8:
        print(f'  ... +{len(hits)-8} more')
    total += len(hits)

print(f'\n{"="*60}')
print(f'TOTAL: {total} hits in {len(results)} files')
print(f'{"="*60}')

# Also scan EN/DE/FR/RU directory structure
print('\n\n=== MEVCUT DİZİN YAPISI ===')
site_root = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')
for lang in ['tr','en','de','fr','ru']:
    lang_dir = site_root / lang
    if lang_dir.exists():
        subdirs = [d.name for d in sorted(lang_dir.iterdir()) if d.is_dir()]
        print(f'  /{lang}/: {", ".join(subdirs)}')
    else:
        print(f'  /{lang}/: NOT FOUND')
