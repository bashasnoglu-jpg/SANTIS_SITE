"""
Sprint 4 — Generate skincare page_configs and category_configs.
Writes translations for 20 skincare items and adds a skincare section to category_configs.
"""
import json
from pathlib import Path

PAGE_CONFIGS = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE\_build\page_configs\service_pages.json")
CAT_CONFIGS = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE\_build\page_configs\category_configs.json")

# ═══════════════════════════════════════════════════════
# SKINCARE TRANSLATIONS (20 items × 5 languages)
# ═══════════════════════════════════════════════════════
SKINCARE_TRANSLATIONS = {
    "classic-facial": {
        "title": {"tr": "Klasik Cilt Bakımı", "en": "Classic Facial", "de": "Klassische Gesichtspflege", "fr": "Soin Visage Classique", "ru": "Классический уход за лицом"},
        "desc": {"tr": "Temizleme + tonik + maske — cildi dengeler, canlılık verir.", "en": "Cleansing + toner + mask — balances and revitalizes the skin.", "de": "Reinigung + Toner + Maske — gleicht die Haut aus und belebt sie.", "fr": "Nettoyage + tonique + masque — équilibre et revitalise la peau.", "ru": "Очищение + тоник + маска — балансирует и оживляет кожу."},
    },
    "deep-cleanse": {
        "title": {"tr": "Derin Temizleme Bakımı", "en": "Deep Cleansing Facial", "de": "Tiefenreinigende Gesichtspflege", "fr": "Soin Nettoyage Profond", "ru": "Глубокое очищение лица"},
        "desc": {"tr": "Gözenek temizliği + buhar + serum — derin arınma sağlar.", "en": "Pore cleansing + steam + serum — provides deep purification.", "de": "Porenreinigung + Dampf + Serum — für tiefe Reinigung.", "fr": "Nettoyage des pores + vapeur + sérum — purification profonde.", "ru": "Очищение пор + пар + сыворотка — глубокое очищение."},
    },
    "enzyme-peel": {
        "title": {"tr": "Enzim Peeling Bakımı", "en": "Enzyme Peel Treatment", "de": "Enzym-Peeling-Behandlung", "fr": "Soin Peeling Enzymatique", "ru": "Энзимный пилинг"},
        "desc": {"tr": "Enzim bazlı peeling ile ölü hücreleri nazikçe uzaklaştırır.", "en": "Gently removes dead cells with enzyme-based peeling.", "de": "Entfernt sanft abgestorbene Zellen mit enzymbasiertem Peeling.", "fr": "Élimine en douceur les cellules mortes avec un peeling enzymatique.", "ru": "Нежно удаляет мёртвые клетки с помощью энзимного пилинга."},
    },
    "detox-charcoal": {
        "title": {"tr": "Detox Kömür Maske", "en": "Detox Charcoal Mask", "de": "Detox-Kohle-Maske", "fr": "Masque Détox au Charbon", "ru": "Детокс-маска с углём"},
        "desc": {"tr": "Aktif kömür ile toksinleri çeker, cildi derinlemesine arındırır.", "en": "Draws out toxins with activated charcoal for deep purification.", "de": "Zieht Giftstoffe mit Aktivkohle heraus für tiefe Reinigung.", "fr": "Élimine les toxines avec du charbon actif pour une purification profonde.", "ru": "Выводит токсины активированным углём для глубокого очищения."},
    },
    "hyaluron-hydrate": {
        "title": {"tr": "Hyaluron Nem Terapisi", "en": "Hyaluronic Hydration Therapy", "de": "Hyaluron-Feuchtigkeitstherapie", "fr": "Thérapie Hydratante à l'Acide Hyaluronique", "ru": "Гиалуроновая увлажняющая терапия"},
        "desc": {"tr": "Hyalüronik asit ile derin nem takviyesi, dolgunluk ve ışıltı.", "en": "Deep hydration with hyaluronic acid for plumpness and glow.", "de": "Tiefe Feuchtigkeitszufuhr mit Hyaluronsäure für Fülle und Glanz.", "fr": "Hydratation profonde à l'acide hyaluronique pour éclat et volume.", "ru": "Глубокое увлажнение гиалуроновой кислотой для упругости и сияния."},
    },
    "vitamin-c-glow": {
        "title": {"tr": "Vitamin C Glow", "en": "Vitamin C Glow Treatment", "de": "Vitamin C Glow Behandlung", "fr": "Soin Éclat Vitamine C", "ru": "Сияние с витамином C"},
        "desc": {"tr": "C vitamini serumu ile aydınlatma, leke giderme ve enerji.", "en": "Brightening, spot reduction and energy with vitamin C serum.", "de": "Aufhellung, Fleckenreduzierung und Energie mit Vitamin-C-Serum.", "fr": "Éclaircissement, réduction des taches et énergie avec sérum vitamine C.", "ru": "Осветление, устранение пигментации и энергия с сывороткой витамина C."},
    },
    "oxygen-boost": {
        "title": {"tr": "Oksijen Boost Bakımı", "en": "Oxygen Boost Facial", "de": "Sauerstoff-Boost-Gesichtspflege", "fr": "Soin Visage Boost Oxygène", "ru": "Кислородный буст для лица"},
        "desc": {"tr": "Oksijen infüzyonu ile hücre yenilenmesini hızlandırır.", "en": "Accelerates cell renewal with oxygen infusion.", "de": "Beschleunigt die Zellerneuerung mit Sauerstoffinfusion.", "fr": "Accélère le renouvellement cellulaire avec une infusion d'oxygène.", "ru": "Ускоряет обновление клеток с помощью кислородной инфузии."},
    },
    "glass-skin": {
        "title": {"tr": "Glass Skin Ritüeli", "en": "Glass Skin Ritual", "de": "Glass Skin Ritual", "fr": "Rituel Glass Skin", "ru": "Ритуал Glass Skin"},
        "desc": {"tr": "Kore ilhamli çok katmanlı nemlendirme — cam gibi pürüzsüz cilt.", "en": "Korean-inspired multi-layer hydration — glass-smooth skin.", "de": "Koreanisch inspirierte Mehrschicht-Hydratation — glatte Haut wie Glas.", "fr": "Hydratation multicouche d'inspiration coréenne — peau lisse comme du verre.", "ru": "Многослойное увлажнение в корейском стиле — гладкая, как стекло, кожа."},
    },
    "collagen-lift": {
        "title": {"tr": "Kolajen Lifting Bakımı", "en": "Collagen Lift Treatment", "de": "Kollagen-Lifting-Behandlung", "fr": "Soin Lifting au Collagène", "ru": "Коллагеновый лифтинг"},
        "desc": {"tr": "Kolajen destekli sıkılaştırma — elastikiyet ve gençlik.", "en": "Collagen-supported firming — elasticity and youthfulness.", "de": "Kollagengestützte Straffung — Elastizität und Jugendlichkeit.", "fr": "Raffermissement au collagène — élasticité et jeunesse.", "ru": "Укрепление коллагеном — эластичность и молодость."},
    },
    "anti-aging-pro": {
        "title": {"tr": "Anti-Aging Pro Bakım", "en": "Anti-Aging Pro Treatment", "de": "Anti-Aging Pro Behandlung", "fr": "Soin Anti-Âge Pro", "ru": "Анти-эйдж Про уход"},
        "desc": {"tr": "Gelişmiş anti-aging formülleri ile kırışıklık azaltma ve yenileme.", "en": "Advanced anti-aging formulas for wrinkle reduction and renewal.", "de": "Fortschrittliche Anti-Aging-Formeln zur Faltenreduzierung und Erneuerung.", "fr": "Formules anti-âge avancées pour réduction des rides et renouvellement.", "ru": "Передовые антивозрастные формулы для уменьшения морщин и обновления."},
    },
    "led-rejuvenation": {
        "title": {"tr": "LED Rejuvenation", "en": "LED Rejuvenation Therapy", "de": "LED Verjüngungstherapie", "fr": "Thérapie LED Rajeunissante", "ru": "LED омолаживающая терапия"},
        "desc": {"tr": "LED ışık terapisi ile kolajen üretimini artırır, cildi yeniler.", "en": "Boosts collagen production and renews skin with LED light therapy.", "de": "Steigert die Kollagenproduktion und erneuert die Haut mit LED-Lichttherapie.", "fr": "Stimule la production de collagène et renouvelle la peau avec la thérapie LED.", "ru": "Стимулирует выработку коллагена и обновляет кожу LED-терапией."},
    },
    "brightening-spot": {
        "title": {"tr": "Leke Karşıtı Aydınlatıcı Bakım", "en": "Brightening & Spot Treatment", "de": "Aufhellende & Fleckenbehandlung", "fr": "Soin Éclaircissant & Anti-Taches", "ru": "Осветляющий уход от пигментации"},
        "desc": {"tr": "Leke hedefli bakım — eşit ton, aydınlık ve berrak cilt.", "en": "Spot-targeting care — even tone, brightness and clear skin.", "de": "Gezielte Fleckenbehandlung — ebenmäßiger Ton, Helligkeit und klare Haut.", "fr": "Soin ciblé anti-taches — teint uniforme, lumineux et clair.", "ru": "Целенаправленный уход от пятен — ровный тон, яркость и чистая кожа."},
    },
    "acne-balance": {
        "title": {"tr": "Akne & Sebum Denge Bakımı", "en": "Acne & Sebum Balance Treatment", "de": "Akne- & Sebum-Balance-Behandlung", "fr": "Soin Équilibrant Acné & Sébum", "ru": "Уход для баланса акне и себума"},
        "desc": {"tr": "Yağ dengesi + antibakteriyel bakım — temiz ve mat cilt.", "en": "Oil balance + antibacterial care — clean and matte skin.", "de": "Ölbalance + antibakterielle Pflege — saubere und matte Haut.", "fr": "Équilibre du sébum + soin antibactérien — peau nette et mate.", "ru": "Баланс жирности + антибактериальный уход — чистая матовая кожа."},
    },
    "sensitive-soothe": {
        "title": {"tr": "Hassas Cilt Sakinleştirici Bakım", "en": "Sensitive Skin Soothing Treatment", "de": "Beruhigende Behandlung für empfindliche Haut", "fr": "Soin Apaisant Peau Sensible", "ru": "Успокаивающий уход для чувствительной кожи"},
        "desc": {"tr": "Aloe vera ve papatya ile kızarıklık azaltma ve yatıştırma.", "en": "Redness reduction and soothing with aloe vera and chamomile.", "de": "Rötungsreduzierung und Beruhigung mit Aloe Vera und Kamille.", "fr": "Réduction des rougeurs et apaisement avec aloe vera et camomille.", "ru": "Снижение покраснений и успокоение с алоэ вера и ромашкой."},
    },
    "barrier-repair": {
        "title": {"tr": "Bariyer Onarıcı Bakım", "en": "Skin Barrier Repair Treatment", "de": "Hautbarriere-Reparatur-Behandlung", "fr": "Soin Réparateur de Barrière Cutanée", "ru": "Восстановление кожного барьера"},
        "desc": {"tr": "Ceramid ve peptid ile cilt bariyerini güçlendirir ve onarır.", "en": "Strengthens and repairs the skin barrier with ceramides and peptides.", "de": "Stärkt und repariert die Hautbarriere mit Ceramiden und Peptiden.", "fr": "Renforce et répare la barrière cutanée avec céramides et peptides.", "ru": "Укрепляет и восстанавливает кожный барьер керамидами и пептидами."},
    },
    "micro-polish": {
        "title": {"tr": "Micro Polish Bakımı", "en": "Micro Polish Treatment", "de": "Micro-Polish-Behandlung", "fr": "Soin Micro Polish", "ru": "Микрополировка лица"},
        "desc": {"tr": "Mikro kristal peeling — pürüzsüz, ışıltılı ve yenilenmiş cilt.", "en": "Micro-crystal peeling — smooth, radiant and renewed skin.", "de": "Mikrokristall-Peeling — glatte, strahlende und erneuerte Haut.", "fr": "Peeling micro-cristal — peau lisse, radieuse et renouvelée.", "ru": "Микрокристаллический пилинг — гладкая, сияющая и обновлённая кожа."},
    },
    "gold-mask-ritual": {
        "title": {"tr": "Gold Mask Ritüeli", "en": "Gold Mask Ritual", "de": "Gold Maske Ritual", "fr": "Rituel Masque Or", "ru": "Ритуал золотой маски"},
        "desc": {"tr": "24K altın maske — lüks anti-aging, sıkılaştırma ve ışıltı.", "en": "24K gold mask — luxury anti-aging, firming and radiance.", "de": "24K Goldmaske — luxuriöses Anti-Aging, Straffung und Strahlkraft.", "fr": "Masque or 24K — anti-âge luxueux, raffermissement et éclat.", "ru": "Маска из золота 24К — роскошный антивозрастной, подтягивающий и сияющий уход."},
    },
    "eye-contour": {
        "title": {"tr": "Göz Çevresi Bakımı", "en": "Eye Contour Treatment", "de": "Augenkontur-Behandlung", "fr": "Soin Contour des Yeux", "ru": "Уход за контуром глаз"},
        "desc": {"tr": "Göz çevresi için özel bakım — koyu halka ve şişlik azaltma.", "en": "Specialized eye area care — reduces dark circles and puffiness.", "de": "Spezialpflege für die Augenpartie — reduziert dunkle Ringe und Schwellungen.", "fr": "Soin spécialisé contour des yeux — réduit cernes et poches.", "ru": "Специализированный уход за зоной вокруг глаз — уменьшение тёмных кругов и отёков."},
    },
    "lip-care": {
        "title": {"tr": "Dudak Bakımı", "en": "Lip Care Treatment", "de": "Lippenpflege-Behandlung", "fr": "Soin des Lèvres", "ru": "Уход за губами"},
        "desc": {"tr": "Dudak için özel nemlendirme ve hacim bakımı.", "en": "Specialized lip moisturizing and volume treatment.", "de": "Spezielle Lippen-Feuchtigkeits- und Volumenbehandlung.", "fr": "Soin spécial hydratation et volume des lèvres.", "ru": "Специальный увлажняющий и объёмный уход для губ."},
    },
    "men-facial": {
        "title": {"tr": "Erkek Cilt Bakımı", "en": "Men's Facial Treatment", "de": "Männer-Gesichtspflege", "fr": "Soin Visage Homme", "ru": "Мужской уход за лицом"},
        "desc": {"tr": "Erkek cildine özel — tıraş sonrası onarım ve nemlendirme.", "en": "Tailored for men's skin — post-shave repair and hydration.", "de": "Speziell für Männerhaut — Reparatur und Feuchtigkeit nach der Rasur.", "fr": "Adapté à la peau masculine — réparation et hydratation après-rasage.", "ru": "Специально для мужской кожи — восстановление и увлажнение после бритья."},
    },
}

def main():
    # 1) Update page_configs
    pc = json.loads(PAGE_CONFIGS.read_text(encoding="utf-8"))
    for slug, trans in SKINCARE_TRANSLATIONS.items():
        pc[slug] = trans
    PAGE_CONFIGS.write_text(json.dumps(pc, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"page_configs: added {len(SKINCARE_TRANSLATIONS)} skincare translations")

    # 2) Update category_configs
    cc = json.loads(CAT_CONFIGS.read_text(encoding="utf-8"))
    cc["skincare"] = {
        "body_class": "editorial-mode",
        "data_context": "skincare",
        "grid_id": "skincare",
        "page_init_js": "assets/js/skincare-detail.js",
        "chip_filter_js": "assets/js/chip-filter.js",
        "preloader_js": "assets/js/nuclear-preloader.js",
        "hero": {
            "kicker": {"tr": "SANTIS CLUB", "en": "SANTIS CLUB", "de": "SANTIS CLUB", "fr": "SANTIS CLUB", "ru": "SANTIS CLUB"},
            "title": {"tr": "Cilt Bakımı", "en": "Skincare", "de": "Hautpflege", "fr": "Soins du Visage", "ru": "Уход за лицом"},
            "intro": {
                "tr": "Bilimsel formüller ve doğal aktif maddelerle güçlendirilmiş profesyonel cilt bakım ritüelleri.",
                "en": "Professional skincare rituals powered by scientific formulas and natural active ingredients.",
                "de": "Professionelle Hautpflegerituale mit wissenschaftlichen Formeln und natürlichen Wirkstoffen.",
                "fr": "Rituels de soins professionnels enrichis de formules scientifiques et d'ingrédients actifs naturels.",
                "ru": "Профессиональные ритуалы ухода за кожей с научными формулами и натуральными активными ингредиентами.",
            },
            "subtitle": {"tr": "Cilt Ritüelleri", "en": "Skin Rituals", "de": "Hautrituale", "fr": "Rituels de la Peau", "ru": "Ритуалы кожи"},
            "hero_image": "/assets/img/cards/santis_hero_skincare_lux.webp",
            "scroll_target": "#skincare-grid",
            "spa_menu_link": False,
        },
        "brand_story": {
            "kicker": {"tr": "SOTHYS PARİS İLE", "en": "WITH SOTHYS PARIS", "de": "MIT SOTHYS PARIS", "fr": "AVEC SOTHYS PARIS", "ru": "С SOTHYS PARIS"},
            "title": {
                "tr": "Bilimsel Güzellik, Doğal Zarafet",
                "en": "Scientific Beauty, Natural Elegance",
                "de": "Wissenschaftliche Schönheit, Natürliche Eleganz",
                "fr": "Beauté Scientifique, Élégance Naturelle",
                "ru": "Научная красота, Природная элегантность",
            },
            "text": {
                "tr": "Her cilt bakım seansı, Sothys Paris'in 75 yıllık uzmanlığı ve Santis Club'un premium hizmet anlayışıyla buluşur. Dijital cilt analizi ile başlayan kişiselleştirilmiş protokoller, cildinizin gerçek ihtiyaçlarını hedefler.",
                "en": "Every skincare session meets Sothys Paris' 75 years of expertise with Santis Club's premium service philosophy. Personalized protocols beginning with digital skin analysis target your skin's true needs.",
                "de": "Jede Hautpflegesitzung vereint die 75-jährige Expertise von Sothys Paris mit der Premium-Service-Philosophie des Santis Club. Personalisierte Protokolle, die mit digitaler Hautanalyse beginnen, zielen auf die wahren Bedürfnisse Ihrer Haut ab.",
                "fr": "Chaque séance de soins allie les 75 ans d'expertise de Sothys Paris à la philosophie de service premium du Santis Club. Des protocoles personnalisés commençant par une analyse digitale de la peau ciblent les vrais besoins de votre peau.",
                "ru": "Каждый сеанс ухода за кожей объединяет 75-летний опыт Sothys Paris с философией премиум-сервиса Santis Club. Персонализированные протоколы, начинающиеся с цифрового анализа кожи, нацелены на истинные потребности вашей кожи.",
            },
        },
        "chips": [
            {"key": "classicFacials", "emoji": "🧖", "label": {"tr": "Klasik Bakımlar", "en": "Classic Facials", "de": "Klassische Pflege", "fr": "Soins Classiques", "ru": "Классический уход"}},
            {"key": "hydrationGlow", "emoji": "💧", "label": {"tr": "Nem & Işıltı", "en": "Hydration & Glow", "de": "Feuchtigkeit & Glow", "fr": "Hydratation & Éclat", "ru": "Увлажнение и сияние"}},
            {"key": "antiAgingLift", "emoji": "✨", "label": {"tr": "Anti-Aging", "en": "Anti-Aging", "de": "Anti-Aging", "fr": "Anti-Âge", "ru": "Антивозрастной"}},
            {"key": "targetedCare", "emoji": "🎯", "label": {"tr": "Hedefli Bakım", "en": "Targeted Care", "de": "Gezielte Pflege", "fr": "Soins Ciblés", "ru": "Целевой уход"}},
            {"key": "advancedAesthetics", "emoji": "💎", "label": {"tr": "İleri Estetik", "en": "Advanced Aesthetics", "de": "Fortgeschrittene Ästhetik", "fr": "Esthétique Avancée", "ru": "Продвинутая эстетика"}},
            {"key": "miniPrograms", "emoji": "⚡", "label": {"tr": "Mini Programlar", "en": "Mini Programs", "de": "Mini-Programme", "fr": "Mini Programmes", "ru": "Мини-программы"}},
        ],
        "faq": {
            "tr": [
                {"q": "Cilt bakımı seansı ne kadar sürer?", "a": "Bakım türüne göre 20 dakika ile 80 dakika arasında değişir. Dijital cilt analizi seans öncesi yapılır."},
                {"q": "Hangi ürünler kullanılıyor?", "a": "Santis Club, Sothys Paris'in profesyonel cilt bakım ürünlerini kullanmaktadır. Tüm ürünler dermatolojik olarak test edilmiştir."},
                {"q": "Hassas ciltler için uygun mu?", "a": "Evet, hassas ciltler için özel formülasyonlar mevcuttur. Cilt analizi sonrası en uygun protokol belirlenir."},
            ],
            "en": [
                {"q": "How long does a skincare session last?", "a": "Sessions range from 20 to 80 minutes depending on the treatment type. Digital skin analysis is performed before the session."},
                {"q": "Which products are used?", "a": "Santis Club uses Sothys Paris professional skincare products. All products are dermatologically tested."},
                {"q": "Is it suitable for sensitive skin?", "a": "Yes, special formulations are available for sensitive skin. The most suitable protocol is determined after skin analysis."},
            ],
            "de": [
                {"q": "Wie lange dauert eine Hautpflegesitzung?", "a": "Die Sitzungen dauern je nach Behandlungstyp zwischen 20 und 80 Minuten. Vor der Sitzung wird eine digitale Hautanalyse durchgeführt."},
                {"q": "Welche Produkte werden verwendet?", "a": "Santis Club verwendet professionelle Hautpflegeprodukte von Sothys Paris. Alle Produkte sind dermatologisch getestet."},
                {"q": "Ist es für empfindliche Haut geeignet?", "a": "Ja, spezielle Formulierungen für empfindliche Haut sind verfügbar. Das geeignetste Protokoll wird nach der Hautanalyse bestimmt."},
            ],
            "fr": [
                {"q": "Combien de temps dure une séance de soins ?", "a": "Les séances durent entre 20 et 80 minutes selon le type de soin. Une analyse digitale de la peau est effectuée avant la séance."},
                {"q": "Quels produits sont utilisés ?", "a": "Santis Club utilise les produits professionnels de soins Sothys Paris. Tous les produits sont testés dermatologiquement."},
                {"q": "Est-ce adapté aux peaux sensibles ?", "a": "Oui, des formulations spéciales pour peaux sensibles sont disponibles. Le protocole le plus adapté est déterminé après l'analyse de la peau."},
            ],
            "ru": [
                {"q": "Сколько длится сеанс ухода за кожей?", "a": "Сеансы длятся от 20 до 80 минут в зависимости от типа процедуры. Перед сеансом проводится цифровой анализ кожи."},
                {"q": "Какие продукты используются?", "a": "Santis Club использует профессиональные средства по уходу за кожей Sothys Paris. Все продукты дерматологически протестированы."},
                {"q": "Подходит ли это для чувствительной кожи?", "a": "Да, доступны специальные формулы для чувствительной кожи. Наиболее подходящий протокол определяется после анализа кожи."},
            ],
        },
        "seo_bottom": {
            "tr": "Santis Club'un profesyonel cilt bakım merkezi, Sothys Paris ürünleri ile klasik yüz bakımından anti-aging tedavilere, enzim peelingden gold mask ritüeline kadar geniş bir yelpazede hizmet sunar. Dijital cilt analizi ile kişiselleştirilmiş protokoller.",
            "en": "Santis Club's professional skincare center offers a wide range of treatments with Sothys Paris products, from classic facials to anti-aging treatments, enzyme peeling to gold mask rituals. Personalized protocols with digital skin analysis.",
            "de": "Das professionelle Hautpflegezentrum des Santis Club bietet mit Sothys Paris Produkten eine breite Palette von Behandlungen, von klassischen Gesichtspflegen bis zu Anti-Aging-Behandlungen, Enzym-Peeling bis zum Goldmasken-Ritual. Personalisierte Protokolle mit digitaler Hautanalyse.",
            "fr": "Le centre de soins professionnel du Santis Club propose une large gamme de traitements avec les produits Sothys Paris, des soins classiques aux traitements anti-âge, du peeling enzymatique au rituel masque or. Protocoles personnalisés avec analyse digitale de la peau.",
            "ru": "Профессиональный центр ухода за кожей Santis Club предлагает широкий спектр процедур с продуктами Sothys Paris, от классических процедур до антивозрастных процедур, от энзимного пилинга до ритуала золотой маски. Персонализированные протоколы с цифровым анализом кожи.",
        },
        "meta": {
            "title": {
                "tr": "Cilt Bakımı | Santis Club Spa & Wellness",
                "en": "Skincare | Santis Club Spa & Wellness",
                "de": "Hautpflege | Santis Club Spa & Wellness",
                "fr": "Soins du Visage | Santis Club Spa & Wellness",
                "ru": "Уход за лицом | Santis Club Spa & Wellness",
            },
            "description": {
                "tr": "Sothys Paris ürünleri ile profesyonel cilt bakım ritüelleri. Klasik bakım, anti-aging, glass skin ve daha fazlası.",
                "en": "Professional skincare rituals with Sothys Paris products. Classic facials, anti-aging, glass skin and more.",
                "de": "Professionelle Hautpflegerituale mit Sothys Paris Produkten. Klassische Pflege, Anti-Aging, Glass Skin und mehr.",
                "fr": "Rituels de soins professionnels avec les produits Sothys Paris. Soins classiques, anti-âge, glass skin et plus.",
                "ru": "Профессиональные ритуалы ухода за кожей с продуктами Sothys Paris. Классический уход, антивозрастной, glass skin и другое.",
            },
        },
    }
    CAT_CONFIGS.write_text(json.dumps(cc, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"category_configs: added skincare section with hero, chips, FAQ, SEO")

if __name__ == "__main__":
    main()
