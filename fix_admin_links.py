"""
Admin HTML relative link → absolute /admin/ fixer
"""
import os, re, json

ROOT = os.path.dirname(os.path.abspath(__file__))

# Audit raporundan admin dead linklerin kaynak dosyalarını bul
report_path = os.path.join(ROOT, 'ultra-audit-report.json')
dead_slugs = {
    'sovereign-lab.html','hotels.html','bookings.html','crm.html','revenue.html',
    'command-center.html','prototype-cms-v5.html','god-mode.html','boardroom.html',
    'black-room.html','gods-eye.html'
}

source_files = set()
if os.path.exists(report_path):
    data = json.load(open(report_path, encoding='utf-8'))
    for b in data.get('brokenLinks', []):
        url = b.get('url', '')
        if any(s in url for s in dead_slugs):
            src = b.get('foundIn', '')
            if src:
                # Relative path → absolute disk path
                full = os.path.join(ROOT, src.lstrip('/').replace('/', os.sep))
                if os.path.isfile(full):
                    source_files.add(full)

print(f"🔍 Kaynak dosyalar: {len(source_files)}")

fixed_total = 0
for fpath in source_files:
    try:
        content = open(fpath, encoding='utf-8').read()
        orig = content
        # href="bookings.html"  →  href="/admin/bookings.html"
        # Sadece admin sayfası sluglarını dönüştür, / ile başlamayanları
        def fix_href(m):
            slug = m.group(1)
            if any(s == slug for s in dead_slugs):
                return f'href="/admin/{slug}"'
            return m.group(0)
        content = re.sub(r'href="([^/][^"]+\.html[^"]*)"', fix_href, content)
        if content != orig:
            open(fpath, 'w', encoding='utf-8').write(content)
            fixed_total += 1
            print(f"  ✅ Düzeltildi: {os.path.relpath(fpath, ROOT)}")
    except Exception as e:
        print(f"  ❌ Hata: {fpath} — {e}")

if fixed_total == 0:
    print("ℹ️  Hiç relative admin linki bulunamadı (zaten absolute veya JS ile oluşturulmuş).")
    print("   Ghost Protocol zaten bu linkleri runtime'da yakalıyor.")

print(f"\n✅ Toplam düzeltilen dosya: {fixed_total}")
