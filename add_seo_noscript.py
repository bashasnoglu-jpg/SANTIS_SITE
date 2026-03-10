"""FAZ 4: 3 sayfaya noscript SEO blokları ekle."""
import os

SEO_BLOCKS = {
    'tr/masajlar/index.html': '''<noscript>
<div style="display:none;" itemscope itemtype="https://schema.org/ItemList">
    <h2 itemprop="name">Santis Club - Lüks Masaj Terapileri ve SPA Menüsü</h2>
    <meta itemprop="description" content="Antalya'da uzman terapistler tarafından uygulanan premium Thai, Bali, İsveç, Derin Doku ve Aromaterapi masaj ritüelleri.">
    <ul>
        <li itemprop="itemListElement">Thai Masajı - Geleneksel Asya Terapisi</li>
        <li itemprop="itemListElement">Bali Masajı - Rahatlatıcı Aromaterapi ve Doku Terapisi</li>
        <li itemprop="itemListElement">İsveç Masajı - Klasik Rahatlama ve Kas Gerginliği Giderici</li>
        <li itemprop="itemListElement">Derin Doku Masajı (Deep Tissue) - Sporcu ve Kronik Ağrı Terapisi</li>
    </ul>
</div>
</noscript>''',

    'tr/hamam/index.html': '''<noscript>
<div style="display:none;" itemscope itemtype="https://schema.org/ItemList">
    <h2 itemprop="name">Santis Club - Geleneksel Türk Hamamı Ritüelleri</h2>
    <meta itemprop="description" content="Antalya'da Osmanlı saray hamamı geleneği, köpük masajı, kese ve arınma ritüelleri ile yenilenme deneyimi.">
    <ul>
        <li itemprop="itemListElement">Geleneksel Kese ve Köpük - Derinlemesine cilt temizliği</li>
        <li itemprop="itemListElement">Osmanlı Hamam Ritüeli - Kraliyet arınma deneyimi</li>
        <li itemprop="itemListElement">Kahve Peeling Detox - Antioksidan cilt yenileme</li>
    </ul>
</div>
</noscript>''',

    'tr/cilt-bakimi/index.html': '''<noscript>
<div style="display:none;" itemscope itemtype="https://schema.org/ItemList">
    <h2 itemprop="name">Santis Club - Profesyonel Cilt Bakımı ve Sothys Paris Terapileri</h2>
    <meta itemprop="description" content="Antalya'da profesyonel cilt analizi, anti-aging ve Sothys Paris ürünleri ile kişiselleştirilmiş yüz ve vücut bakım terapileri.">
    <ul>
        <li itemprop="itemListElement">Anti-Aging Yoğun Bakım - Kırışıklık karşıtı premium terapi</li>
        <li itemprop="itemListElement">Derinlemesine Nem Ritüeli - Hyaluronik asit ile nemlendirme</li>
        <li itemprop="itemListElement">Sothys Purifying Care - Akneye eğilimli ciltler için bakım</li>
    </ul>
</div>
</noscript>'''
}

for path, block in SEO_BLOCKS.items():
    if not os.path.exists(path):
        print('DOSYA YOK:', path); continue
    html = open(path, encoding='utf-8').read()
    if len(html) < 500:
        print('BOŞ:', path); continue
    if 'itemscope' in html:
        print('NOSCRIPT ZATEN VAR:', path); continue
    # </main> den önce ekle, yoksa </body>'den önce
    if '</main>' in html:
        html = html.replace('</main>', block + '\n</main>', 1)
    else:
        html = html.replace('</body>', block + '\n</body>', 1)
    if len(html) > 500:
        open(path, 'w', encoding='utf-8').write(html)
        print('✅ SEO mühürlendi:', path)
