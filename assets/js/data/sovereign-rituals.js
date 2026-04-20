/**
 * SANTIS Sovereign OS - Rituals Database
 * Sprint B: Data-Driven Surface (Multi-Page Schema)
 */
export const RITUAL_DATA = {
    massage: [
        // RİTÜELLER (highlight)
        { id: "deep-tissue", cat: "highlight", title: "Deep Tissue", meta: "Derin Rahatlama", price: 120, img: "massage_lux" },
        { id: "thai", cat: "highlight", title: "Thai Masajı", meta: "Esneklik ve Enerji", price: 135, img: "massage_lux" },
        { id: "hot-stone", cat: "highlight", title: "Sıcak Taş", meta: "Volkanik Terapi", price: 150, img: "massage_lux" },
        { id: "aromatherapy", cat: "highlight", title: "Aromaterapi", meta: "Ruhsal Dinlenme", price: 140, img: "massage_lux" },
        { id: "bali-highlight", cat: "highlight", title: "Bali Masajı", meta: "Geleneksel Dokunuş", price: 110, img: "massage_lux" },
        
        // Klasik Masajlar (klasik)
        { id: "isvec", cat: "klasik", title: "İsveç Masajı", meta: "Kusursuz Başlangıç", price: 80, img: "massage_lux" },
        { id: "aroma-klasik", cat: "klasik", title: "Aromaterapi Masajı", meta: "Ruhsal Dinlenme", price: 95, img: "massage_lux" },
        { id: "anti-stres", cat: "klasik", title: "Anti-Stres Masajı", meta: "Kas Gevşetici", price: 75, img: "massage_lux" },
        { id: "lenf-drenaj", cat: "klasik", title: "Lenf Drenaj Masajı", meta: "Detoks Etkisi", price: 110, img: "massage_lux" },
        { id: "sirt-boyun", cat: "klasik", title: "Sırt ve Boyun Terapi", meta: "Bölgesel Rahatlama", price: 60, img: "massage_lux" },
        { id: "klasik-vucut", cat: "klasik", title: "Klasik Vücut Masajı", meta: "Canlandırıcı", price: 85, img: "massage_lux" },

        // Spor ve Terapi (spor-terapi)
        { id: "deep-doku", cat: "spor-terapi", title: "Derin Doku Masajı", meta: "Sporcu Toparlanması", price: 120, img: "massage_lux" },
        { id: "spor-terapi", cat: "spor-terapi", title: "Spor Terapi Masajı", meta: "Kas İyileşmesi", price: 115, img: "massage_lux" },
        { id: "tetik-nokta", cat: "spor-terapi", title: "Tetik Nokta Terapisi", meta: "Ağrı Giderme", price: 105, img: "massage_lux" },
        { id: "sicak-tas-spor", cat: "spor-terapi", title: "Sıcak Taş Terapisi", meta: "Isı İle Rahatlama", price: 130, img: "massage_lux" },
        { id: "medikal", cat: "spor-terapi", title: "Medikal Masaj", meta: "Klinik Onarım", price: 140, img: "massage_lux" },
        { id: "myofascial", cat: "spor-terapi", title: "Myofascial Release", meta: "Postür Düzenleme", price: 125, img: "massage_lux" },

        // Asya Masajları (asya)
        { id: "geleneksel-bali", cat: "asya", title: "Geleneksel Bali Masajı", meta: "Doğu Ritüeli", price: 110, img: "massage_lux" },
        { id: "kraliyet-thai", cat: "asya", title: "Kraliyet Thai Masajı", meta: "Enerji Dengesi", price: 135, img: "massage_lux" },
        { id: "shiatsu", cat: "asya", title: "Shiatsu Terapi", meta: "Akupresür Noktaları", price: 150, img: "massage_lux" },
        { id: "ayak-refleksoloji", cat: "asya", title: "Ayak Refleksolojisi", meta: "Organ Haritası", price: 70, img: "massage_lux" },
        { id: "abhyanga", cat: "asya", title: "Abhyanga (Ayurvedik)", meta: "Dengeleyici", price: 160, img: "massage_lux" },
        { id: "thai-herbal", cat: "asya", title: "Thai Herbal Compress", meta: "Bitkisel Terapi", price: 145, img: "massage_lux" },

        // Bölgesel Masajlar (bolgesel)
        { id: "sirt-boyun-bolgesel", cat: "bolgesel", title: "Sırt ve Boyun Masajı", meta: "Hızlı Çözüm", price: 60, img: "massage_lux" },
        { id: "hint-bas", cat: "bolgesel", title: "Hint Baş Masajı", meta: "Zihinsel Dinginlik", price: 50, img: "massage_lux" },
        { id: "omuz-kollar", cat: "bolgesel", title: "Omuz ve Kollar", meta: "Gerginlik Atıcı", price: 55, img: "massage_lux" },
        { id: "lokal-bacak", cat: "bolgesel", title: "Lokal Bacak Masajı", meta: "Kan Dolaşımı", price: 65, img: "massage_lux" }
    ],
    skincare: [
        // ÖNE ÇIKANLAR (highlight)
        { id: "gold-mask", cat: "highlight", title: "Gold Mask Ritüeli", meta: "24K Altın Işıltısı", price: 150, img: "skincare_lux" },
        { id: "glass-skin", cat: "highlight", title: "Glass Skin", meta: "Kore Güzellik Sırrı", price: 120, img: "skincare_lux" },
        { id: "anti-aging-pro-high", cat: "highlight", title: "Anti-Aging Pro", meta: "Zamanın Ötesinde", price: 160, img: "skincare_lux" },
        { id: "vitamin-c-glow", cat: "highlight", title: "Vitamin C Glow", meta: "Canlandırıcı Enerji", price: 95, img: "skincare_lux" },
        { id: "hyaluron-nem", cat: "highlight", title: "Hyaluron Nem", meta: "Derinlemesine Terapi", price: 110, img: "skincare_lux" },

        // ARINDIRMA (arindirma)
        { id: "algen-ritual", cat: "arindirma", title: "Algen Ritual", meta: "Derin Vücut Temizliği", price: 55, img: "skincare_lux" },
        { id: "lymphdrainage", cat: "arindirma", title: "Lymphdrainage", meta: "Ödem Atıcı", price: 90, img: "skincare_lux" },
        { id: "purete-classique", cat: "arindirma", title: "Rituel Pureté Classique", meta: "Klasik Arınma", price: 90, img: "skincare_lux" },
        { id: "detox-lumiere", cat: "arindirma", title: "Rituel Détox Lumière", meta: "Işıltılı Detoks", price: 120, img: "skincare_lux" },
        { id: "purete-profonde", cat: "arindirma", title: "Rituel Pureté Profonde", meta: "Derin Gözenek", price: 150, img: "skincare_lux" },
        { id: "total-detox", cat: "arindirma", title: "Total Detox Journey", meta: "Tam Arınma", price: 220, img: "skincare_lux" },
        { id: "akne-sebum", cat: "arindirma", title: "Akne & Sebum Denge", meta: "Yağ Kontrolü", price: 65, img: "skincare_lux" },
        { id: "detox-komur", cat: "arindirma", title: "Detox Kömür Maske", meta: "Siyah Nokta", price: 45, img: "skincare_lux" },
        { id: "enzim-peeling", cat: "arindirma", title: "Enzim Peeling Bakımı", meta: "Nazik Soyucu", price: 50, img: "skincare_lux" },

        // NEM & IŞILTI (nem-isilti)
        { id: "hydra-source", cat: "nem-isilti", title: "Rituel Hydra Source", meta: "Nem Kaynağı", price: 90, img: "skincare_lux" },
        { id: "hydra-confort", cat: "nem-isilti", title: "Rituel Hydra Confort", meta: "Konforlu Nem", price: 120, img: "skincare_lux" },
        { id: "hydra-sublime", cat: "nem-isilti", title: "Rituel Hydra Sublime", meta: "Üstün Nem", price: 150, img: "skincare_lux" },
        { id: "leke-aydinlatici", cat: "nem-isilti", title: "Leke Karşıtı Aydınlatıcı", meta: "Renk Eşitleyici", price: 70, img: "skincare_lux" },
        { id: "bariyer-onarici", cat: "nem-isilti", title: "Bariyer Onarıcı Bakım", meta: "Hassasiyet Karşıtı", price: 65, img: "skincare_lux" },
        { id: "klasik-cilt", cat: "nem-isilti", title: "Klasik Cilt Bakımı", meta: "Günlük Koruma", price: 55, img: "skincare_lux" },
        { id: "goz-cevresi", cat: "nem-isilti", title: "Göz Çevresi Bakımı", meta: "Koyu Halka", price: 35, img: "skincare_lux" },
        { id: "dudak-bakimi", cat: "nem-isilti", title: "Dudak Bakımı", meta: "Nem ve Dolgunluk", price: 25, img: "skincare_lux" },

        // ANTI-AGING (anti-age)
        { id: "jeunesse-initiale", cat: "anti-age", title: "Rituel Jeunesse Initiale", meta: "İlk Çizgiler", price: 130, img: "skincare_lux" },
        { id: "jeunesse-supreme", cat: "anti-age", title: "Rituel Jeunesse Suprême", meta: "Derin Kırışıklık", price: 160, img: "skincare_lux" },
        { id: "diamant-eternel", cat: "anti-age", title: "Rituel Diamant Éternel", meta: "Sonsuz Elmas", price: 250, img: "skincare_lux" },
        { id: "anti-aging-pro", cat: "anti-age", title: "Anti-Aging Pro Bakım", meta: "Profesyonel Onarım", price: 115, img: "skincare_lux" },
        { id: "kolajen-lifting", cat: "anti-age", title: "Kolajen Lifting Bakımı", meta: "Sıkılaştırıcı Etki", price: 95, img: "skincare_lux" },
        { id: "led-rejuvenation", cat: "anti-age", title: "LED Rejuvenation", meta: "Işık Terapisi", price: 60, img: "skincare_lux" },

        // ERKEK BAKIMI (homme)
        { id: "homme-classique", cat: "homme", title: "Rituel Homme Classique", meta: "Standart Bakım", price: 90, img: "skincare_lux" },
        { id: "homme-equilibre", cat: "homme", title: "Rituel Homme Équilibre", meta: "Dengeleyici", price: 110, img: "skincare_lux" },
        { id: "homme-force", cat: "homme", title: "Rituel Homme Force", meta: "Derin Güç", price: 140, img: "skincare_lux" }
    ]
};
