"""SANTIS ULTRA DEEP PROJECT INTELLIGENCE REPORT"""
import os, json
from pathlib import Path
from collections import Counter
from datetime import datetime

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')
SKIP = {'.git','node_modules','venv','__pycache__','.vscode'}
OUT = ROOT / 'reports' / 'project_deep_report.md'
OUT.parent.mkdir(exist_ok=True)

lines = []
def p(s=''): lines.append(s)

p(f'# SANTIS CLUB — Ultra Deep Project Report')
p(f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}')
p()

# === 1. OVERVIEW ===
ext_count = Counter()
ext_size = Counter()
dir_count = 0
file_count = 0
total_size = 0
big_files = []

for dp,dn,fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP]
    dir_count += len(dn)
    for f in fn:
        fp = Path(dp)/f
        sz = fp.stat().st_size
        ext = fp.suffix.lower() or '(no ext)'
        ext_count[ext] += 1
        ext_size[ext] += sz
        file_count += 1
        total_size += sz
        big_files.append((sz, fp.relative_to(ROOT)))

p('## 1. Genel Bakış')
p(f'| Metrik | Değer |')
p(f'|---|---|')
p(f'| Toplam Dosya | **{file_count:,}** |')
p(f'| Toplam Klasör | **{dir_count}** |')
p(f'| Toplam Boyut | **{total_size/1024/1024:.1f} MB** |')
p()

p('## 2. Dosya Türleri (Top 15)')
p('| Tür | Adet | Boyut |')
p('|---|---|---|')
for ext, cnt in ext_count.most_common(15):
    sz_mb = ext_size[ext]/1024/1024
    p(f'| `{ext}` | {cnt} | {sz_mb:.2f} MB |')
p()

# === LANGUAGE PAGES ===
p('## 3. Dil Sayfaları')
p('| Dil | Sayfa | Alt Dizinler |')
p('|---|---|---|')
for lang in ['tr','en','de','fr','ru','sr']:
    d = ROOT / lang
    if not d.exists(): continue
    html = list(d.rglob('*.html'))
    subdirs = sorted([x.name for x in d.iterdir() if x.is_dir()])
    p(f'| `/{lang}/` | {len(html)} | {", ".join(subdirs)} |')
p()

# === TOP-LEVEL ===
p('## 4. Kök Dizin Yapısı')
p('| Öğe | Tür | Boyut/Dosya |')
p('|---|---|---|')
for item in sorted(ROOT.iterdir()):
    if item.name in SKIP: continue
    if item.is_dir():
        count = sum(1 for _,_,fn in os.walk(item) for f in fn)
        p(f'| `{item.name}/` | 📁 | {count} dosya |')
    else:
        p(f'| `{item.name}` | 📄 | {item.stat().st_size/1024:.1f} KB |')
p()

# === JS FILES ===
p('## 5. JavaScript Mimarisi (Top 15)')
p('| Dosya | Boyut | Açıklama |')
p('|---|---|---|')
js_files = []
for fp in (ROOT / 'assets' / 'js').rglob('*.js'):
    js_files.append((fp.stat().st_size, str(fp.relative_to(ROOT / 'assets' / 'js')).replace(os.sep,'/')))
js_files.sort(reverse=True)
# descriptions
js_desc = {
    'app.js': 'Ana uygulama + routing + reservation',
    'fallback_data.js': 'Offline veri yedekleri',
    'shop.js': 'E-ticaret / WhatsApp Commerce',
    'home-products.js': 'Ana sayfa ürün grid',
    'luxury-cards.js': 'Premium kart bileşeni',
    'loader.js': 'Component loader (navbar/footer)',
    'routes.js': 'URL routing yapılandırması',
    'i18n-routes.js': 'Merkezi dil-URL çeviri motoru',
    'language-switcher.js': 'Dil değiştirme dropdown',
    'search.js': 'Site-wide arama',
    'category-engine.js': 'Kategori filtreleme',
    'product-filters.js': 'Ürün filtre sistemi',
    'concierge-engine.js': 'AI Concierge motoru',
    'seo-engine.js': 'Dinamik SEO optimizasyonu',
    'url-normalizer.js': 'URL normalize + legacy redirect',
    'hero-slider.js': 'Hero slider bileşeni',
    'product-loader.js': 'Ürün detay sayfa fabrikası',
    'db.js': 'LocalStorage veritabanı',
}
for sz, name in js_files[:15]:
    desc = js_desc.get(name.split('/')[-1], '')
    p(f'| `{name}` | {sz/1024:.1f} KB | {desc} |')
p(f'| **Toplam** | **{len(js_files)} dosya** | |')
p()

# === CSS ===
p('## 6. CSS Sistemi (Top 10)')
p('| Dosya | Boyut |')
p('|---|---|')
css_files = []
for fp in (ROOT / 'assets' / 'css').rglob('*.css'):
    css_files.append((fp.stat().st_size, str(fp.relative_to(ROOT / 'assets' / 'css')).replace(os.sep,'/')))
css_files.sort(reverse=True)
for sz, name in css_files[:10]:
    p(f'| `{name}` | {sz/1024:.1f} KB |')
p(f'| **Toplam** | **{len(css_files)} dosya** |')
p()

# === JSON DATA ===
p('## 7. Veri Kaynakları (JSON)')
p('| Dosya | Boyut | Konum |')
p('|---|---|---|')
for base in ['data', 'assets/data']:
    d = ROOT / base
    if not d.exists(): continue
    for fp in sorted(d.rglob('*.json')):
        p(f'| `{fp.name}` | {fp.stat().st_size/1024:.1f} KB | `{base}/` |')
p()

# === COMPONENTS ===
p('## 8. Bileşenler (components/)')
comp = ROOT / 'components'
if comp.exists():
    p('| Dosya | Boyut |')
    p('|---|---|')
    for f in sorted(comp.iterdir()):
        if f.is_file():
            p(f'| `{f.name}` | {f.stat().st_size/1024:.1f} KB |')
p()

# === BACKUP/LEGACY WEIGHT ===
p('## 9. Yedekleme & Legacy Ağırlığı')
p('| Klasör | Dosya | Boyut |')
p('|---|---|---|')
for folder in ['backup','backups','_legacy_archive','_legacy_content','_dev_archives','_snapshots']:
    d = ROOT / folder
    if d.exists():
        total = sum(f.stat().st_size for f in d.rglob('*') if f.is_file())
        count = sum(1 for f in d.rglob('*') if f.is_file())
        p(f'| `{folder}/` | {count} | {total/1024/1024:.1f} MB |')
p()

# === LARGE FILES ===
p('## 10. En Büyük 15 Dosya')
p('| Dosya | Boyut |')
p('|---|---|')
big_files.sort(reverse=True)
for sz, name in big_files[:15]:
    p(f'| `{name}` | {sz/1024/1024:.1f} MB |')
p()

# === PYTHON TOOLS ===
p('## 11. Python Araç Kutusu (tools/)')
p('| Script | Boyut | Amaç |')
p('|---|---|---|')
tool_desc = {
    'anchor_optimize.py': 'Anchor text SEO optimizasyonu',
    'breadcrumb_inject.py': 'Breadcrumb schema enjeksiyonu',
    'crosslang_fix.py': 'Çapraz-dil link düzeltici',
    'i18n_scan.py': 'Hardcoded /tr/ path tarayıcı',
    'i18n_inject_tag.py': 'i18n-routes.js script enjektörü',
    'i18n_update_remaining.py': 'Kalan JS dosya güncelleyici',
    'listing_expand.py': 'Liste sayfası içerik genişletici',
    'og_meta_fix.py': 'Open Graph meta düzeltici',
    'orphan_fix.py': 'Orphan sayfa bağlayıcı',
    'schema_enrich.py': 'Schema.org zenginleştirici',
    'seo_deep_audit.py': 'Derin SEO denetimi',
    'seo_fix_all.py': 'Toplu SEO düzeltici',
    'seo_scan.py': 'SEO tarayıcı',
    'seo_verify.py': 'SEO doğrulayıcı',
    'sitemap_gen.py': 'Sitemap oluşturucu',
    'snapshot.py': 'Proje snapshot alıcı',
}
tools = ROOT / 'tools'
if tools.exists():
    for f in sorted(tools.iterdir()):
        if f.suffix == '.py':
            desc = tool_desc.get(f.name, '')
            p(f'| `{f.name}` | {f.stat().st_size/1024:.1f} KB | {desc} |')
p()

# === DUPLICATE JSON CHECK ===
p('## 12. Potansiyel Sorunlar')
p()
d1 = ROOT / 'data'
d2 = ROOT / 'assets' / 'data'
n1 = {f.name for f in d1.rglob('*.json')} if d1.exists() else set()
n2 = {f.name for f in d2.rglob('*.json')} if d2.exists() else set()
overlap = n1 & n2
if overlap:
    p(f'⚠️ **Duplicate JSON**: `/data/` ve `/assets/data/` arasında çakışan dosyalar: `{", ".join(overlap)}`')
else:
    p('✅ JSON dosya adı çakışması yok')

# Check no-ext large files
no_ext = [(sz,n) for sz,n in big_files if Path(str(n)).suffix == '']
if no_ext:
    p()
    p(f'⚠️ **Uzantısız büyük dosyalar** ({len(no_ext)} adet, {sum(s for s,_ in no_ext)/1024/1024:.0f} MB):')
    for sz,n in no_ext[:5]:
        p(f'  - `{n}` ({sz/1024/1024:.1f} MB)')

# Legacy weight
total_legacy = 0
for folder in ['backup','backups','_legacy_archive','_legacy_content','_dev_archives','_snapshots']:
    d = ROOT / folder
    if d.exists():
        total_legacy += sum(f.stat().st_size for f in d.rglob('*') if f.is_file())
if total_legacy > 100*1024*1024:
    p()
    p(f'⚠️ **Legacy/Backup ağırlığı**: {total_legacy/1024/1024:.0f} MB — temizleme düşünülmeli')

# === WRITE ===
OUT.write_text('\n'.join(lines), encoding='utf-8')
print(f'Report written to: {OUT}')
print(f'Lines: {len(lines)}')
