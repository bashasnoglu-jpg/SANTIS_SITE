# -*- coding: utf-8 -*-
"""
20 statik cilt bakımı sayfası için services.json'a kart verisi ekler.
Her sayfanın mevcut HTML'inden title, desc, duration, price çeker
ve services.json formatına uygun entry oluşturur.
"""
import json, os, re

ROOT = r'c:\Users\tourg\Desktop\SANTIS_SITE'
JSON_PATH = os.path.join(ROOT, 'assets', 'data', 'services.json')
TR_DIR = os.path.join(ROOT, 'tr', 'cilt-bakimi')

# Load existing services.json
with open(JSON_PATH, 'r', encoding='utf-8-sig') as f:
    services = json.load(f)

existing_slugs = {s.get('slug','') for s in services}
print(f'Mevcut services.json: {len(services)} hizmet')

# Image assignments for cards
IMG_MAP = {
    'acne-balance': 'santis_card_skincare_clay_v2.webp',
    'anti-aging-pro': 'santis_card_skincare_detail_v2.webp',
    'barrier-repair': 'santis_card_hydration_lux.webp',
    'brightening-spot': 'santis_card_skincare_v1.webp',
    'classic-facial': 'facial.webp',
    'collagen-lift': 'santis_card_skincare_detail_v2.webp',
    'deep-cleanse': 'santis_card_skincare_clay_v2.webp',
    'detox-charcoal': 'santis_card_skincare_clay_v2.webp',
    'enzyme-peel': 'skincare.webp',
    'eye-contour': 'facial.webp',
    'glass-skin': 'santis_card_hydration_lux.webp',
    'gold-mask-ritual': 'santis_card_skincare_lux.webp',
    'hyaluron-hydrate': 'santis_card_hydration_lux.webp',
    'led-rejuvenation': 'santis_card_skincare_detail_v2.webp',
    'lip-care': 'product-cream.webp',
    'men-facial': 'santis_card_skincare_v1.webp',
    'micro-polish': 'santis_card_skincare_clay_v2.webp',
    'oxygen-boost': 'skincare.webp',
    'sensitive-soothe': 'santis_card_hydration_lux.webp',
    'vitamin-c-glow': 'santis_card_skincare_v1.webp',
}

# Service-specific data
SERVICE_DATA = {
    'acne-balance': {
        'name': 'Akne & Sebum Denge Bakımı',
        'shortDesc': 'Arındırma + dengeleme — yağlı/karma ciltler için hedefli bakım.',
        'duration': 60, 'price': 65,
        'benefits': ['Sebum üretimini dengeler', 'Gözenekleri arındırır', 'Cilt yüzeyini matlaştırır', 'Bakteriyel oluşumu azaltır', 'Kızarıklık ve iltihabı yatıştırır'],
        'steps': ['Cilt Analizi: Yağlanma bölgeleri ve gözenek durumu değerlendirilir.', 'Derin Temizleme: Salisilik asit bazlı temizleyici ile gözenek arındırma.', 'Buhar & Ekstraksiyon: Siyah nokta ve tıkanmış gözeneklerin profesyonel temizliği.', 'Dengeleyici Maske: Clay bazlı maske ile fazla yağ emilimi.', 'Nemlendirilme: Yağsız, matlaştırıcı nemlendirici uygulama.']
    },
    'anti-aging-pro': {
        'name': 'Anti-Aging Pro Bakım',
        'shortDesc': 'İnce çizgi görünümü hedefleyen kapsamlı protokol.',
        'duration': 80, 'price': 115,
        'benefits': ['İnce çizgi görünümünü azaltır', 'Cilt elastikiyetini artırır', 'Kolajen üretimini destekler', 'Cilt tonunu sıkılaştırır', 'Derin nemlendirme sağlar', 'Yaşlanma belirtilerini geciktirir'],
        'steps': ['Cilt Yaş Analizi: Kırışıklık haritası ve elastikiyet ölçümü.', 'Enzim Peeling: Ölü hücre tabakasını nazikçe kaldırır.', 'Anti-Aging Serum: Retinol ve peptit bazlı serum uygulaması.', 'Lifting Masaj: Yüz kaslarını sıkılaştıran özel masaj teknikleri.', 'Kolajen Maske: Derin etkili kolajen maske ile sıkılaşma.', 'Koruma: SPF ve anti-aging günlük krem uygulama.']
    },
    'barrier-repair': {
        'name': 'Bariyer Onarıcı Bakım',
        'shortDesc': 'Kuruluk ve gerginlik için destek — cilt bariyerini yeniden inşa eder.',
        'duration': 55, 'price': 65,
        'benefits': ['Hasarlı cilt bariyerini onarır', 'Nem kaybını önler', 'Kızarıklık ve hassasiyeti azaltır', 'Ceramide seviyesini yükseltir', 'Cilt direncini artırır'],
        'steps': ['Bariyer Testi: Transepidermal su kaybı (TEWL) ölçümü.', 'Nazik Temizleme: pH dengeli, sülfatsız temizleyici.', 'Ceramide Serumu: Bariyer onarıcı lipid kompleksi.', 'Onarıcı Maske: Panthenol ve shea yağı bazlı derin besleyici maske.', 'Koruyucu Katman: Oksidan bariyeri ve nemlendirici son kat.']
    },
    'brightening-spot': {
        'name': 'Leke Karşıtı Aydınlatıcı Bakım',
        'shortDesc': 'Ton eşitleme odaklı — daha homojen bir görünüm için.',
        'duration': 60, 'price': 70,
        'benefits': ['Leke görünümünü azaltır', 'Cilt tonunu eşitler', 'Güneş hasarı izlerini hafifletir', 'Doğal parlaklık kazandırır', 'Melanin üretimini dengeler'],
        'steps': ['Leke Haritası: UV ışık altında pigmentasyon analizi.', 'AHA Peeling: Glikolik asit ile yüzey yenileme.', 'Aydınlatıcı Serum: C vitamini ve niacinamide uygulama.', 'Aydınlatıcı Maske: Arbutin ve kojik asit bazlı beyazlatıcı maske.', 'SPF Koruma: Yüksek faktörlü güneş koruyucu ile son kat.']
    },
    'classic-facial': {
        'name': 'Klasik Cilt Bakımı',
        'shortDesc': 'Temizleme + tonik + maske — cildi dengeler, canlılık kazandırır.',
        'duration': 60, 'price': 55,
        'benefits': ['Cildi derinlemesine temizler', 'Nem dengesini sağlar', 'Canlı ve taze görünüm kazandırır', 'Gözenekleri sıkılaştırır', 'Günlük stres izlerini giderir'],
        'steps': ['Cilt Tipi Belirleme: Kuru, yağlı, karma veya hassas cilt analizi.', 'Çift Aşamalı Temizlik: Makyaj temizleme + derin gözenek temizliği.', 'Tonikleme: Cilt pH dengesini ayarlayan tonik uygulama.', 'Bakım Maskesi: Cilt tipine özel nemlendirici veya arındırıcı maske.', 'Nemlendirme: Günlük cilt tipine uygun nemlendirici ile son kat.']
    },
    'collagen-lift': {
        'name': 'Kolajen Lifting Bakımı',
        'shortDesc': 'Sıkılık hissi ve toparlanma — yorgun görünümü azaltır.',
        'duration': 70, 'price': 95,
        'benefits': ['Cilt sıkılığını artırır', 'Kolajen sentezini uyarır', 'Çene hattını belirginleştirir', 'Kırışıklık derinliğini azaltır', 'Doğal lifting etkisi sağlar'],
        'steps': ['Elastikiyet Testi: Cilt sarkma ve gevşeme analizi.', 'Mikro Peeling: Yüzey hücre yenileme.', 'Kolajen Serum: Deniz kolajenli konsantre serum.', 'RF Başlık Masajı: Radyofrekans teknolojisi ile derin sıkılaştırma.', 'Bio-Cellulose Maske: Anında lifting etkili maske.', 'Firming Krem: Sıkılaştırıcı son kat.']
    },
    'deep-cleanse': {
        'name': 'Derin Temizleme Bakımı',
        'shortDesc': 'Gözenek odaklı arındırma — siyah nokta ve sebum dengesi.',
        'duration': 70, 'price': 65,
        'benefits': ['Tıkanmış gözenekleri temizler', 'Siyah noktaları giderir', 'Cilt dokusunu pürüzsüzleştirir', 'Yağlanmayı kontrol eder', 'Cildi detoks yapar'],
        'steps': ['Gözenek Analizi: Büyüteç altında tıkanıklık haritası.', 'Enzim Temizleme: Gözenek açıcı enzim jeli.', 'Buhar Terapisi: Gözenekleri açan sıcak buhar.', 'Manuel Ekstraksiyon: Profesyonel siyah nokta temizliği.', 'Arındırıcı Maske: Kil ve aktif kömür bazlı derin temizlik maskesi.', 'Gözenek Sıkılaştırma: Soğuk kompres ve sıkılaştırıcı tonik.']
    },
    'detox-charcoal': {
        'name': 'Detox Kömür Maske',
        'shortDesc': 'Şehir yorgunluğuna karşı arındırma — matlığı azaltır.',
        'duration': 40, 'price': 45,
        'benefits': ['Toksinleri cilt yüzeyinden çeker', 'Matlığı giderir', 'Gözenekleri arındırır', 'Cildi canlandırır', 'Çevresel kirlilik etkilerini azaltır'],
        'steps': ['Ön Temizlik: Hafif temizleyici ile yüzey kiri alınır.', 'Aktif Kömür Maskesi: Bambu kömürü bazlı detox maske.', 'Bekleme & Kuruma: 15 dakika maske etkisi.', 'Temizleme & Tonikleme: Maske kalıntıları nazikçe alınır.', 'Nemlendirme: Hafif detox sonrası nemlendirici.']
    },
    'enzyme-peel': {
        'name': 'Enzim Peeling Bakımı',
        'shortDesc': 'Nazik yenileme — pürüzsüz görünüm ve ışıltı için cilt yenileme.',
        'duration': 45, 'price': 50,
        'benefits': ['Ölü hücreleri nazikçe kaldırır', 'Cilt yüzeyini pürüzsüzleştirir', 'Doğal ışıltı kazandırır', 'Bakım ürünlerinin emilimini artırır', 'Hassas ciltler için uygundur'],
        'steps': ['Cilt Hazırlığı: Nazik temizleyici ile yüzey temizliği.', 'Enzim Uygulama: Papaya veya ananas enzimi ile ölü hücre ayrıştırma.', 'Bekleme: 10-15 dk enzim aktivasyonu.', 'Nötralize Etme: Enzim reaksiyonunu durdurma.', 'Bakım Serumu: Yenilenen cilde vitamin serumu.']
    },
    'eye-contour': {
        'name': 'Göz Çevresi Bakımı',
        'shortDesc': 'Göz çevresine yoğun nem ve rahatlama — daha canlı bakış.',
        'duration': 25, 'price': 35,
        'benefits': ['Göz altı morluklarını hafifletir', 'Şişlikleri azaltır', 'İnce çizgileri görünümünü azaltır', 'Göz çevresi cildini nemlendirir', 'Yorgun bakışı canlandırır'],
        'steps': ['Göz Çevresi Temizliği: Ultra nazik temizleyici.', 'Soğuk Kompres: Şişlik giderici buz kürleri.', 'Göz Serumu: Kafein ve hyalüronik asit bazlı serum.', 'Göz Maskesi: Hidrojel göz altı pedleri (15 dk).', 'Göz Kremi: Besleyici göz çevresi kremi.']
    },
    'glass-skin': {
        'name': 'Glass Skin Ritüeli',
        'shortDesc': 'Katmanlı nem + maske — cam gibi parlak, pürüzsüz bir cilt.',
        'duration': 75, 'price': 90,
        'benefits': ['Cam gibi parlak cilt görünümü', 'Çoklu nem katmanları', 'Gözenek görünümünü minimize eder', 'Işık yansıtan pürüzsüzlük', 'K-beauty ilhamıyla derin bakım'],
        'steps': ['Çift Temizleme: Yağ bazlı + su bazlı temizleyici.', 'Hafif Peeling: Laktik asit ile yüzey yenileme.', 'Esans: Fermente pirinç suyu ile ilk nem katmanı.', 'Serum Katmanı: Hyalüronik asit + niacinamide serumu.', 'Sheet Mask: 20 dk yoğun nemlendirici maske.', 'Nemlendirici Seal: Ceramide krem ile nem kilitlenmesi.', 'Glow Primer: Işık yansıtıcı son kat.']
    },
    'gold-mask-ritual': {
        'name': 'Gold Mask Ritüeli',
        'shortDesc': 'Lüks maske + masaj — ışıl ışıl, dinlenmiş görünüm.',
        'duration': 60, 'price': 95,
        'benefits': ['24K altın ile lüks bakım deneyimi', 'Cilt elastikiyetini artırır', 'Anti-oksidan koruma sağlar', 'Canlı ve ışıltılı görünüm', 'Derin besleyici etki'],
        'steps': ['Ritüel Hazırlığı: Aromatik buhar ile gözenekleri açma.', 'Altın Serum: 24K altın parçacıklı konsantre serum.', 'Gold Mask: Altın folyo maske uygulama (20 dk).', 'Yüz Masajı: Gua sha taşı ile lenfatik drenaj.', 'Lüks Nemlendirme: Premium anti-aging krem ile son kat.']
    },
    'hyaluron-hydrate': {
        'name': 'Hyaluron Nem Terapisi',
        'shortDesc': 'Yoğun nem + dolgun görünüm — bariyeri destekler, cildi canlandırır.',
        'duration': 60, 'price': 70,
        'benefits': ['Yoğun ve derin nemlendirme', 'Cilt dolgunluğunu artırır', 'Kuruluk çizgilerini azaltır', 'Nem bariyerini güçlendirir', '72 saat nem tutma etkisi'],
        'steps': ['Nem Ölçümü: Dijital nem seviyesi analizi.', 'Hafif Temizleme: Nemlendirici bazlı temizleyici.', 'Hyalüronik Asit Serumu: 3 farklı molekül boyutunda HA.', 'Aqua Maske: Su bazlı yoğun nemlendirici maske.', 'Nem Kilidi: Ceramide ve squalane bazlı bariyeri güçlendirici krem.']
    },
    'led-rejuvenation': {
        'name': 'LED Rejuvenation',
        'shortDesc': 'Işık desteğiyle bakım rutini — cilt görünümünü destekler.',
        'duration': 40, 'price': 60,
        'benefits': ['Kırmızı LED: Kolajen üretimini destekler', 'Mavi LED: Akne bakterisini azaltır', 'Ağrısız ve non-invaziv tedavi', 'Cilt tonunu iyileştirir', 'İltihap ve kızarıklığı azaltır'],
        'steps': ['Cilt Hazırlığı: Temizleme ve serum uygulama.', 'LED Cihaz Ayarı: Cilt durumuna göre dalga boyu seçimi.', 'LED Terapi: 20 dk LED ışık paneli ile tedavi.', 'Post-terapi Serumu: LED sonrası aktif serum.', 'Nemlendirici Son Kat: Sakinleştirici krem.']
    },
    'lip-care': {
        'name': 'Dudak Bakımı',
        'shortDesc': 'Yumuşatma + bakım — pürüzsüz ve dolgun görünüm hissi.',
        'duration': 20, 'price': 25,
        'benefits': ['Dudakları derinlemesine nemlendirir', 'Çatlamış dudakları onarır', 'Dudak konturunu belirginleştirir', 'Yumuşak ve pürüzsüz doku', 'Dolgun görünüm sağlar'],
        'steps': ['Dudak Peelingi: Şeker bazlı nazik peeling.', 'Dudak Maskesi: Bal ve shea yağı bazlı besleyici maske.', 'Dudak Serumu: Hyalüronik asit bazlı dolgunlaştırıcı.', 'Dudak Balsam: Koruyucu ve besleyici son kat.']
    },
    'men-facial': {
        'name': 'Erkek Cilt Bakımı',
        'shortDesc': 'Tıraş sonrası hassasiyete uygun — temiz, dengeli ve mat görünüm.',
        'duration': 55, 'price': 55,
        'benefits': ['Tıraş tahrişini yatıştırır', 'Yağlanmayı kontrol eder', 'Gözenekleri arındırır', 'Erkek cildine özel formülasyon', 'Mat ve temiz görünüm'],
        'steps': ['Erkek Cilt Analizi: Tıraş alışkanlıkları ve cilt tipi değerlendirme.', 'Derin Temizleme: Erkek cildine özel güçlü temizleyici.', 'Buhar & Arındırma: Gözenek açma ve siyah nokta temizliği.', 'Erkek Bakım Maskesi: Mentol ve çinko içerikli dengeleyici maske.', 'After-care: Tıraş sonrası bakım serumu ve mat nemlendirici.']
    },
    'micro-polish': {
        'name': 'Micro Polish Bakımı',
        'shortDesc': 'Cilt yüzeyini pürüzsüzleştiren bakım — daha canlı ve parlak görünüm.',
        'duration': 45, 'price': 75,
        'benefits': ['Mikro kristal ile cilt parlatma', 'Pürüzsüz ve ışıltılı yüzey', 'İnce çizgi görünümünü azaltır', 'Cilt yenilenmesini hızlandırır', 'Bakım ürünlerinin emilimini artırır'],
        'steps': ['Cilt Hazırlığı: Nazik temizleme.', 'Mikrodermabrazyon: Elmas uçlu cihaz ile yüzey polisajı.', 'Serum İnfüzyonu: Vitamin C veya hyalüronik asit serum.', 'Sakinleştirici Maske: Aloe vera bazlı yatıştırıcı maske.', 'Koruma: SPF + nemlendirici son kat.']
    },
    'oxygen-boost': {
        'name': 'Oksijen Boost Bakımı',
        'shortDesc': 'Canlandırıcı etki — daha dinlenmiş ve parlak bir görünüm.',
        'duration': 45, 'price': 55,
        'benefits': ['Hücresel oksijenlenmeyi artırır', 'Solgun görünümü canlandırır', 'Cildi enerjilendirir', 'Toksin atılımını destekler', 'Taze ve dinlenmiş görünüm'],
        'steps': ['Ön Temizlik: Derin temizleyici ile hazırlık.', 'Oksijen Serumu: O2 bazlı aktif serum uygulama.', 'Oksijen Cihazı: Basınçlı oksijen ile cilde aktif madde iletimi.', 'Canlandırıcı Maske: Oksijen bazlı kabarcıklı maske.', 'Nemlendirme: Hafif ve ferah nemlendirici son kat.']
    },
    'sensitive-soothe': {
        'name': 'Hassas Cilt Sakinleştirici Bakım',
        'shortDesc': 'Kızarıklık ve hassasiyet hissini azaltmaya yönelik sakinleştirici bakım.',
        'duration': 50, 'price': 60,
        'benefits': ['Kızarıklığı yatıştırır', 'Hassas cildi sakinleştirir', 'Tahrişi azaltır', 'Cilt bariyerini güçlendirir', 'Rahatlatıcı ve ferah his'],
        'steps': ['Hassasiyet Testi: Tahriş bölgeleri ve tetikleyici analiz.', 'Ultra Nazik Temizleme: Parfümsüz, hipoalerjenik temizleyici.', 'Sakinleştirici Serum: Bisabolol ve panthenol bazlı serum.', 'Yatıştırıcı Maske: Papatya ve aloe vera bazlı maske.', 'Koruyucu Bariyer: Hassas ciltler için SPF + bariyer kremi.']
    },
    'vitamin-c-glow': {
        'name': 'Vitamin C Glow',
        'shortDesc': 'Aydınlık ve taze görünüm — ışıltıyı artıran premium bakım.',
        'duration': 50, 'price': 65,
        'benefits': ['Güçlü antioksidan koruma', 'Cilt tonunu aydınlatır', 'Kolajen sentezini destekler', 'Çevresel hasara karşı kalkan', 'Doğal parlaklık ve ışıltı'],
        'steps': ['Temizleme: Vitamin C uyumlu nazik temizleyici.', 'C Vitamini Serumu: %15 L-Askorbik Asit konsantresi.', 'Vitamin C Maskesi: Antioksidan zengin aydınlatıcı maske.', 'Glow Masajı: Işıltı artırıcı yüz masajı.', 'SPF Koruma: Vitamin C etkinliğini koruyan güneş kremi.']
    }
}

added = 0
for slug, data in SERVICE_DATA.items():
    if slug in existing_slugs:
        print(f'  SKIP: {slug} (zaten var)')
        continue
    
    img = IMG_MAP.get(slug, 'santis_hero_skincare_lux.webp')
    
    entry = {
        "id": f"skin-{slug}",
        "categoryId": "skincare",
        "name": data['name'],
        "title": data['name'],
        "tier": "standard",
        "application_type": "professional",
        "duration": data['duration'],
        "shortDesc": data['shortDesc'],
        "desc": data['shortDesc'],
        "subtitle": data['shortDesc'],
        "slug": slug,
        "img": img,
        "media": {
            "hero": img
        },
        "price": {
            "amount": data['price'],
            "currency": "€"
        },
        "content": {
            "tr": {
                "title": data['name'],
                "subtitle": data['shortDesc'],
                "benefits": data['benefits'],
                "steps": data['steps']
            }
        },
        "tags": ["skincare", "cilt-bakimi"]
    }
    
    services.append(entry)
    added += 1
    print(f'  ADD: {slug} ({data["name"]}, {data["duration"]}dk, {data["price"]}EUR)')

# Save
with open(JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(services, f, ensure_ascii=False, indent=2)

print(f'\nToplam: {added} eklendi, yeni toplam: {len(services)}')
