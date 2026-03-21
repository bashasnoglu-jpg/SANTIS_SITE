"""
SANTIS ES Module Audit
======================
HTML dosyalarında export kullanan JS'leri <script> (module olmadan) yükleyen yerleri tespit eder.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Riskli dosyalar (export kullanan ama ESM olarak yüklenmeyen)
RISKY_FILES = [
    'hamam-engine', 'neuro-db', 'neuro-sync', 'routes.js',
    'santis-cache', 'santis-bus', 'santis-core', 'santis-cursor',
    'santis-data-sanitizer', 'santis-data-middleware', 'santis-diff-v2',
    'santis-ghost-forge-v2', 'santis-gpu-field', 'santis-intent-engine',
    'santis-kill-room', 'santis-layout-mesh', 'santis-ritual-renderer',
    'santis-router', 'santis-store', 'santis-cache',
    'bin-packing', 'focal-point', 'motion-guard', 'mega-menu', 'gpu-effects',
    'kinetic-grid', 'santis-forge-injector', 'santis-forge-injector',
    'hammam-page-init', 'home-page', 'massages-page-init', 'rituals.js',
    'skincare.js', 'rail-page', 'massage-matrix', 'job-queue',
    'santis-aurelia-v2', 'sovereign-bus', 'santis-event-kernel',
]

SKIP_DIRS = {'_dev_archives', '_archive', '_backup', 'backups', 'node_modules',
             '.git', 'venv', '__pycache__', 'SantisV5.5_Backup_20260221_122443',
             '_deploy_stage', 'dist', 'Quarantine', 'quarantine_zone'}

SCRIPT_TAG_RE = re.compile(r'<script([^>]*)src=["\']([^"\']+\.js)["\']([^>]*)>', re.IGNORECASE)

hits = []

for dirpath, dirnames, filenames in os.walk(ROOT):
    # Gereksiz klasörleri atla
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    
    for fname in filenames:
        if not fname.endswith('.html'):
            continue
        fpath = os.path.join(dirpath, fname)
        rel = os.path.relpath(fpath, ROOT)
        
        try:
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception:
            continue
        
        for m in SCRIPT_TAG_RE.finditer(content):
            attrs_before = m.group(1)
            src = m.group(2)
            attrs_after = m.group(3)
            full_attrs = (attrs_before + attrs_after).lower()
            
            # type="module" yoksa → risk
            is_module = 'type="module"' in full_attrs or "type='module'" in full_attrs
            if is_module:
                continue
            
            # Riskli dosya mı?
            matched = [r for r in RISKY_FILES if r in src]
            if not matched:
                continue
            
            line_no = content[:m.start()].count('\n') + 1
            hits.append({
                'file': rel,
                'line': line_no,
                'src': src.split('/')[-1],
                'risk': matched[0],
            })

print(f"\n{'='*70}")
print(f"  SANTIS ES Module Audit — {len(hits)} Riskli Yükleme Tespit Edildi")
print(f"{'='*70}\n")

if not hits:
    print("✅ Hiçbir ES Module karışıklığı bulunamadı!")
else:
    # Dosyaya göre grupla
    from collections import defaultdict
    by_file = defaultdict(list)
    for h in hits:
        by_file[h['file']].append(h)
    
    for html_file, items in sorted(by_file.items()):
        print(f"📄 {html_file}")
        for item in items:
            print(f"   L{item['line']:>4}  ⚠️  {item['src']}")
        print()

print(f"{'='*70}")
print(f"Toplam etkilenen HTML: {len(by_file) if hits else 0}")
print(f"Toplam riskli <script> tag: {len(hits)}")
print(f"{'='*70}\n")
