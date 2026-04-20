"""
SANTIS LISTING PAGE EXPANDER v1.0
Adds intro text, SEO bottom block, and visible FAQ to thin listing/hub pages.
"""
import os, re
from pathlib import Path

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')
SKIP_DIRS = {'_legacy_archive','_legacy_content','_snapshots','backup','backups',
             'node_modules','admin','a4','components','venv','__pycache__',
             '.git','.vscode','_dev_archives','print','public','static','templates',
             'includes','reports','sr','assets'}

stats = {'expanded': 0}

# ─── PAGE-SPECIFIC CONTENT ───
CONTENT_MAP = {
    'tr/masajlar/index.html': {
        'intro': 'Santis Club masaj koleksiyonu, dünya terapilerinden ilham alarak bedeninizi ve zihninizi yeniden dengeleyen profesyonel dokunuş ritüelleri sunar. Klasik İsveç masajından derin doku terapisine, Thai masajdan Bali ritüeline kadar geniş bir yelpazede, uzman terapistlerimiz kişiselleştirilmiş bir deneyim tasarlar.',
        'seo_block': 'Antalya masaj merkezi olarak Santis Club, 20\'den fazla masaj terapisi sunmaktadır. Stres giderme, kas gevşetme, ağrı yönetimi ve genel iyilik hali için uzman terapistlerimiz tarafından uygulanan profesyonel masaj hizmetlerinden faydalanın. Tüm masajlarımız özel terapi odalarında, kişiselleştirilmiş aromatik yağlarla uygulanır.',
        'faq_html': [
            ('Masaj randevusunu nasıl alabilirim?', 'WhatsApp üzerinden +90 534 835 0169 numarasına mesaj atarak veya web sitemiz üzerinden online rezervasyon yapabilirsiniz.'),
            ('En popüler masaj türünüz hangisi?', 'Aromaterapi masajı ve derin doku masajı en çok tercih edilen terapilerimizdir. Uzman terapistimiz ilk görüşmede size en uygun terapiyi önerecektir.'),
            ('Çift masajı mümkün mü?', 'Evet, özel çift masajı odamızda eşiniz veya partnerinizle birlikte eş zamanlı masaj deneyimi yaşayabilirsiniz.'),
        ],
    },
    'tr/hamam/index.html': {
        'intro': 'Yüzyıllık Osmanlı hamam geleneğini modern konforla buluşturan Santis Club hamamı, geleneksel kese ve köpükten saray ritüellerine kadar eşsiz bir arınma deneyimi sunar. Her ritüel, doğal malzemeler ve uzman ellerle gerçekleştirilen bir yenilenme yolculuğudur.',
        'seo_block': 'Antalya hamam deneyimi arayanlar için Santis Club, otantik Türk hamamı ritüelleri sunmaktadır. Osmanlı saray hamamı, kese-köpük masajı, kahve detox arınma ve gelin hamamı gibi özel ritüellerimizle cildinizi yeniler, bedeninizi arındırır ve ruhunuzu dinlendirirsiniz.',
        'faq_html': [
            ('Hamam seansına ne getirmem gerekiyor?', 'Hiçbir şey getirmenize gerek yoktur. Peştemal, kese, doğal sabun ve tüm malzemeler tesisimiz tarafından sağlanır.'),
            ('Hamam ilk kez deneyenler için uygun mu?', 'Kesinlikle! Terapistlerimiz süreci adım adım anlatır ve konforu esa alarak uygulama yapar. İlk deneyim için kese & köpük masajı idealdir.'),
            ('Hamam sonrası ne yapmalıyım?', 'Bol su içmenizi ve 2-3 saat güneşten kaçınmanızı öneririz. Cildiniz yenilenmiş olacağından SPF koruması kullanın.'),
        ],
    },
    'tr/cilt-bakimi/index.html': {
        'intro': 'Sothys Paris\'in bilimsel formülleriyle güçlendirilmiş profesyonel cilt bakım koleksiyonumuz, her cilt tipine özel çözümler sunar. Derin temizlemeden anti-aging terapilere, enzim peelingden hyaluron nem terapisine kadar kapsamlı bakım protokolleri ile cildinizin doğal güzelliğini ortaya çıkarın.',
        'seo_block': 'Antalya profesyonel cilt bakımı merkezi Santis Club, Sothys Paris ürünleriyle 20\'den fazla cilt bakımı hizmeti sunmaktadır. Akne tedavisi, anti-aging bakım, leke giderme, nem terapisi ve özel erkek cilt bakımı gibi kişiselleştirilmiş protokollerle cildinizin ihtiyaçlarına yönelik çözümler üretiyoruz.',
        'faq_html': [
            ('Cilt bakımı için randevu nasıl alınır?', 'WhatsApp veya web sitemiz üzerinden randevu alabilirsiniz. İlk seansta ücretsiz cilt analizi yapılır.'),
            ('Hangi marka ürünler kullanılıyor?', 'Sothys Paris\'in profesyonel dermokozmetik ürünlerini kullanıyoruz. Tüm ürünler dermatolojik olarak test edilmiş ve onaylanmıştır.'),
            ('Kaç seans gereklidir?', 'Sonuçlar ilk seanstan itibaren görülür. Kalıcı sonuçlar için genellikle 4-6 seanslık bir bakım programı önerilir.'),
        ],
    },
    'tr/galeri/index.html': {
        'intro': 'Santis Club\'un eşsiz atmosferini ve premium spa deneyimini görsellerle keşfedin. Hamam ritüellerinden masaj terapilerine, cilt bakımı seanslarından mimari detaylara kadar mekânımızın her köşesini yakından tanıyın.',
        'seo_block': 'Santis Club Antalya spa galerisi — lüks hamam, masaj odaları, cilt bakımı alanları ve dinlenme mekanlarımızın fotoğraflarını inceleyin. Premium spa deneyimimizi görsel olarak keşfedin.',
        'faq_html': [],
    },
    'tr/blog/index.html': {
        'intro': 'Wellness, güzellik ve iyi yaşam dünyasından ilham veren yazılar. Uzman terapistlerimizin önerileri, mevsimsel bakım rutinleri ve Santis Club\'un felsefesini keşfedin.',
        'seo_block': 'Santis Club Journal — spa, hamam, masaj terapileri ve cilt bakımı hakkında uzman makaleler. Wellness trendleri, bakım ipuçları ve doğal güzellik rehberleri.',
        'faq_html': [],
    },
    'tr/hakkimizda/index.html': {
        'intro': 'Santis Club, Antalya\'nın kalbinde geleneksel Osmanlı hamam kültürünü modern lüks spa anlayışıyla buluşturan bir iyi oluş merkezidir. "Sessiz lüks" felsefemizle, her misafirimize kişiselleştirilmiş bir arınma ve yenilenme deneyimi sunuyoruz.',
        'seo_block': '',
        'faq_html': [],
    },
    'tr/bilgelik/index.html': {
        'intro': 'Antik şifa bilgeliğinden modern wellness bilimlerine uzanan bir keşif yolculuğu. Hamam geleneğinin kökleri, masaj terapilerinin tarihi ve iyi oluş sanatının felsefi temelleri hakkında derinlemesine okumalar.',
        'seo_block': 'Santis Club Bilgelik Köşesi — wellness felsefesi, hamam tarihi, masaj terapileri bilimi ve iyi oluş sanatı üzerine derinlemesine içerikler.',
        'faq_html': [],
    },
    'tr/ekibimiz/index.html': {
        'intro': 'Santis Club\'un uzman terapist kadrosu, yılların deneyimini modern tekniklerle birleştirerek sizlere en yüksek kalitede hizmet sunar. Her terapistimiz alanında sertifikalı ve sürekli eğitim programlarına dahildir.',
        'seo_block': '',
        'faq_html': [],
    },
    'tr/iletisim.html': {
        'intro': 'Santis Club\'a ulaşmak, randevu almak veya hizmetlerimiz hakkında bilgi edinmek için bizimle iletişime geçin. WhatsApp, telefon veya e-posta ile bize her zaman ulaşabilirsiniz.',
        'seo_block': '',
        'faq_html': [],
    },
    'tr/rezervasyon/index.html': {
        'intro': 'Santis Club\'da kendinize özel bir wellness deneyimi planlamak için hemen rezervasyon yapın. Masaj, hamam ritüeli veya cilt bakımı — uzman kadromuz sizin için en uygun programı oluşturur.',
        'seo_block': '',
        'faq_html': [],
    },
    'tr/urunler/index.html': {
        'intro': 'Santis Club\'un özenle seçilmiş ürün koleksiyonunu keşfedin. Ev spa deneyiminizi zenginleştirecek profesyonel bakım ürünleri, geleneksel hamam aksesuarları ve doğal güzellik ürünleri.',
        'seo_block': 'Santis Club online mağaza — Sothys Paris kozmetik, peştemal, doğal sabun, hamam seti, aroma yağları ve premium spa aksesuarları. Evde lüks spa deneyimi için ihtiyacınız olan her şey.',
        'faq_html': [],
    },
    'tr/magaza/index.html': {
        'intro': 'Santis Club Atelier koleksiyonu — profesyonel spa ürünlerinden el yapımı hamam aksesuarlarına, aromatik mumlardan doğal sabunlara kadar evde lüks deneyimi yaşatacak seçkin ürünler.',
        'seo_block': '',
        'faq_html': [],
    },
    'tr/hizmetler/index.html': {
        'intro': 'Santis Club\'un özel hizmetler koleksiyonu — klasik spa deneyiminin ötesinde, Abhyanga masajı, Shirodhara, Maderoterapi ve G5 Vibro-Sculpting gibi uzmanlaşmış terapileri keşfedin.',
        'seo_block': '',
        'faq_html': [],
    },
    'tr/code-of-silence.html': {
        'intro': 'Santis Club\'un temel felsefesi: sessizlik bir lükstür. Dijital detoks, bilinçli nefes ve anın farkındalığı — modern dünyanın gürültüsüne bir başkaldırı olarak, sessizliğin iyileştirici gücünü keşfedin. Telefonunuzu bırakın, zamanı unutun, sadece şimdiyle kalın.',
        'seo_block': '',
        'faq_html': [],
    },
}


def build_faq_html(faqs):
    if not faqs:
        return ''
    items = ''
    for q, a in faqs:
        items += f'''
<details class="faq-item">
<summary>{q}</summary>
<p>{a}</p>
</details>'''
    return f'''
<section class="page-faq">
<h2>Sıkça Sorulan Sorular</h2>
{items}
</section>'''


def expand_page(rel, fp, content, data):
    modified = False
    intro = data.get('intro', '')
    seo_block = data.get('seo_block', '')
    faq_data = data.get('faq_html', [])

    # 1. Add intro block after first H1 or H2
    if intro and 'page-intro-seo' not in content:
        intro_html = f'\n<div class="page-intro-seo"><p>{intro}</p></div>'
        # Insert after first h1/h2
        h_match = re.search(r'(</h1>|</h2>)', content)
        if h_match:
            pos = h_match.end()
            content = content[:pos] + intro_html + content[pos:]
            modified = True

    # 2. Add FAQ HTML
    if faq_data and 'page-faq' not in content:
        faq_html = build_faq_html(faq_data)
        if '</main>' in content:
            content = content.replace('</main>', faq_html + '\n</main>', 1)
            modified = True
        elif '<footer' in content:
            content = content.replace('<footer', faq_html + '\n<footer', 1)
            modified = True

    # 3. Add SEO bottom block
    if seo_block and 'seo-bottom-block' not in content:
        seo_html = f'\n<section class="seo-bottom-block" style="margin-top:40px;padding:30px 0;border-top:1px solid rgba(139,115,85,0.2);">\n<p style="color:#8b7355;font-size:0.95rem;line-height:1.7;opacity:0.85;">{seo_block}</p>\n</section>'
        if '</main>' in content:
            content = content.replace('</main>', seo_html + '\n</main>', 1)
            modified = True
        elif '<footer' in content:
            content = content.replace('<footer', seo_html + '\n<footer', 1)
            modified = True

    if modified:
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(content)
        stats['expanded'] += 1
        print(f'  EXPANDED: {rel}')

    return modified


# ─── PROCESS ───
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for f in fn:
        if not f.endswith('.html'): continue
        fp = Path(dp) / f
        rel = str(fp.relative_to(ROOT)).replace('\\','/')
        if rel not in CONTENT_MAP:
            continue
        with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
            content = fh.read()
        expand_page(rel, fp, content, CONTENT_MAP[rel])

print(f'\n{"="*60}')
print(f'Genişletilen listing sayfa: {stats["expanded"]}')
print(f'{"="*60}')
