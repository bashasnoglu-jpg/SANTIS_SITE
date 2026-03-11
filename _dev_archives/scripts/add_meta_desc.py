"""
SEO Meta Description Injector
Tüm HTML sayfalarına sayfa başlığına göre meta description ekler.
Çalıştır: python add_meta_desc.py
"""
import os, re

ROOT = os.path.dirname(os.path.abspath(__file__))

# Sayfa bazlı özel açıklamalar (TR sayfaları)
CUSTOM_DESC = {
    "tr/index.html":
        "Santis Club Spa & Wellness — Antalya'nın kalbi Konyaaltı'nda lüks hamam, masaj ve cilt bakımı deneyimi. Sovereign ritüellerle kendinizi yeniden keşfedin.",
    "tr/hamam/index.html":
        "Osmanlı hamam geleneğini Santis Club'ın lüks yorumuyla yaşayın. Kese, köpük ve ritüel masaj ile derin arınma. Antalya Konyaaltı'nın en iyi hamam deneyimi.",
    "tr/masajlar/index.html":
        "Thai, Bali, doku ve aromaterapi masajları Santis Club'da. Uzman terapistler eşliğinde stresinizi bırakın, zihninizi ve bedeninizi yenileyin.",
    "tr/cilt-bakimi/index.html":
        "Sothys Paris sertifikalı cilt bakımı ritüelleri. Santis Club'da hidrasyon, anti-aging ve arındırma tedavileriyle cilt sağlığınızı yeniden kazanın.",
    "tr/urunler/index.html":
        "Santis Club Sovereign Mağaza — Sothys Paris ürünleri, hamam aksesuarları ve özel spa koleksiyonu. Lüks deneyimi evinize taşıyın.",
    "tr/rituals/index.html":
        "Santis Club Sovereign Ritüelleri — Sultan, Romantic Escape, Zen ve Detox VIP paketleri. Çiftler, sporcular ve ruh dinginliği arayanlar için özel deneyimler.",
    "tr/galeri/index.html":
        "Santis Club Spa & Wellness galeri — Antalya Konyaaltı'ndaki lüks spa merkezimizin iç mekanları, ritüel alanları ve premium hizmetleri.",
    "tr/hakkimizda/index.html":
        "Santis Club hakkında — Antalya'nın seçkin spa & wellness merkezi. Sovereign felsefemiz, değerlerimiz ve lüks hizmet anlayışımızla tanışın.",
    "tr/hediye-karti/index.html":
        "Santis Club Hediye Kartı — Sevdiklerinize unutulmaz bir spa deneyimi armağan edin. Online satın alın, anında teslim alın.",
    "tr/hizmetler/maderoterapi/index.html":
        "Maderoterapi — Ahşap masaj aleti ile selülit tedavisi ve lenf drenajı. Santis Club Antalya'da vücut şekillendirme ve toksin atma.",
    "tr/hizmetler/index.html":
        "Santis Club hizmetleri — Hamam, masaj, Sothys cilt bakımı, ritüel paketler ve özel wellness deneyimleri. Tüm hizmetlerimizi keşfedin.",
    "en/index.html":
        "Santis Club Spa & Wellness Antalya — Luxury hammam, massage and skincare rituals in Konyaaltı. Discover your sovereign wellness experience.",
    "en/about/index.html":
        "About Santis Club — Antalya's premier luxury spa & wellness center. Our sovereign philosophy and premium service standards.",
}

# Varsayılan açıklama şablonları (title'dan otomatik üret)
DEFAULT_DESC = "Santis Club Spa & Wellness Antalya — Lüks hamam, masaj ve cilt bakımı deneyimleriyle yenilenin. Konyaaltı'nın en seçkin wellness merkezi."
DEFAULT_DESC_EN = "Santis Club Spa & Wellness Antalya — Luxury hammam, massage and skincare experiences. Konyaaltı's premier wellness destination."

SKIP_DIRS = {'_dev_archives', 'venv', 'node_modules', '.git', '_backup', '__pycache__'}

added = 0
skipped = 0
already = 0

for dirpath, dirnames, filenames in os.walk(ROOT):
    # Skip unwanted dirs
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')]

    for fname in filenames:
        if not fname.endswith('.html'):
            continue
        full = os.path.join(dirpath, fname)
        rel  = os.path.relpath(full, ROOT).replace(os.sep, '/')

        try:
            content = open(full, encoding='utf-8').read()
        except Exception:
            continue

        # Zaten meta description var mı?
        if re.search(r'<meta\s+name=["\']description["\']', content, re.I):
            already += 1
            continue

        # <head> yok mu?
        if '<head>' not in content.lower():
            skipped += 1
            continue

        # Açıklama seç
        desc = CUSTOM_DESC.get(rel)
        if not desc:
            # Dil tespiti
            is_en = rel.startswith('en/')
            # Title'dan akıllı oluştur
            m = re.search(r'<title>([^<]{4,})</title>', content, re.I)
            if m:
                title_text = m.group(1).strip()
                if is_en:
                    desc = f"{title_text} — Santis Club Spa & Wellness Antalya. Luxury hammam, massage and skincare experiences in Konyaaltı."
                else:
                    desc = f"{title_text} — Santis Club Spa & Wellness Antalya. Lüks hamam, masaj ve cilt bakımı deneyimleri Konyaaltı'nda."
            else:
                desc = DEFAULT_DESC_EN if is_en else DEFAULT_DESC

        # Ekle — <meta charset...> veya <head> sonrasına
        tag = f'    <meta name="description" content="{desc}">\n'

        # charset satırından sonra ekle
        new_content = re.sub(
            r'(<meta\s+charset[^>]+>)',
            r'\1\n' + tag.rstrip('\n'),
            content,
            count=1,
            flags=re.I
        )

        if new_content == content:
            # charset yoksa <head> içine ekle
            new_content = re.sub(
                r'(<head[^>]*>)',
                r'\1\n' + tag.rstrip('\n'),
                content,
                count=1,
                flags=re.I
            )

        if new_content != content:
            open(full, 'w', encoding='utf-8').write(new_content)
            added += 1
            print(f"  ✅ {rel}")
        else:
            skipped += 1

print(f"\n📊 ÖZET:")
print(f"  ✅ Meta description eklendi: {added}")
print(f"  ⏭️  Zaten mevcuttu:          {already}")
print(f"  ⚠️  Atlandı:                {skipped}")
print(f"\n🦅 SEO Meta Injection tamamlandı!")
