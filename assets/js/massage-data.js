// assets/js/massage-data.js
// SANTIS — Massage dataset (Refined: Safe Text, TR Labels, Strict List)
// Features: 5 categories, hotel filtering logic, TR slugs, NV_MASSAGES

(function () {
    const DETAIL_BASE = "/service-detail.html?slug=";

    // Guaranteed placeholders to avoid 404s during dev
    // In production, replace these with actual asset paths like "/assets/img/massage-classic.jpg"
    const IMG = {
        base: "https://placehold.co/600x400/2a2a2a/d4af37?text=Santis+Classic",
        sport: "https://placehold.co/600x400/2a2a2a/d4af37?text=Sports+Therapy",
        asia: "https://placehold.co/600x400/2a2a2a/d4af37?text=Asian+Massage",
        couple: "https://placehold.co/600x400/2a2a2a/d4af37?text=Couple+Spa",
        kids: "https://placehold.co/600x400/2a2a2a/d4af37?text=Kids+Spa"
    };

    window.NV_MASSAGES = [
        // 1. KLASİK MASAJLAR (classicMassages)
        {
            id: "klasik-rahatlama",
            slug: "klasik-rahatlama",
            title: "Klasik Rahatlama Masajı",
            duration: "50 dk",
            price: null,
            desc: "Kasları gevşetmek ve stresi azaltmak için uygulanan geleneksel tam vücut masajı.",
            img: IMG.base,
            category: "classicMassages",
            tags: ["rahatlama", "stres", "fullbody"],
            hotelSlugs: ["alba-queen", "alba-resort", "alba-royal", "iberostar-bellevue"],
            href: DETAIL_BASE + "klasik-rahatlama",
            tier: "RELAX"
        },
        {
            id: "aromaterapi",
            slug: "aromaterapi",
            title: "Aromaterapi Masajı",
            duration: "50 dk",
            price: null,
            desc: "Doğal uçucu yağlarla yapılan, duyuları dengeleyen ve derin rahatlama sağlayan ritüel.",
            img: IMG.base,
            category: "classicMassages",
            tags: ["aroma", "rahatlama", "uyku"],
            hotelSlugs: ["alba-queen", "alba-resort", "alba-royal", "iberostar-bellevue"],
            href: DETAIL_BASE + "aromaterapi",
            tier: "AROMA"
        },
        {
            id: "sicak-tas",
            slug: "sicak-tas",
            title: "Sıcak Taş Masajı",
            duration: "75 dk",
            price: null,
            desc: "Isıtılmış taşlarla kas gerginliğini hedefleyen ve rahatlama sağlayan terapi.",
            img: IMG.base,
            category: "classicMassages",
            tags: ["sıcak", "gevşeme", "dolaşım"],
            hotelSlugs: ["alba-queen", "alba-resort", "alba-royal", "iberostar-bellevue"],
            href: DETAIL_BASE + "sicak-tas",
            tier: "STONE"
        },
        {
            id: "bas-boyun-omuz",
            slug: "bas-boyun-omuz",
            title: "Baş–Boyun–Omuz Masajı",
            duration: "30 dk",
            price: null,
            desc: "Bölgesel gerginliklere odaklanan, yorgunluğu hafifletmeyi hedefleyen ekspres bakım.",
            img: IMG.base,
            category: "classicMassages",
            tags: ["boyun", "ofis", "kısa"],
            hotelSlugs: ["alba-queen", "alba-resort", "alba-royal", "iberostar-bellevue"],
            href: DETAIL_BASE + "bas-boyun-omuz",
            tier: "EXPRESS"
        },

        // 2. SPOR TERAPİ (sportsTherapy)
        {
            id: "derin-doku",
            slug: "derin-doku",
            title: "Derin Doku Masajı",
            duration: "50 dk",
            price: null,
            desc: "Alt kas katmanlarına ulaşan, yoğun kas gerginlikleri için baskılı teknik.",
            img: IMG.sport,
            category: "sportsTherapy",
            tags: ["derin", "kas", "yoğun"],
            hotelSlugs: ["alba-queen", "alba-resort", "alba-royal", "iberostar-bellevue"],
            href: DETAIL_BASE + "derin-doku",
            tier: "DEEP"
        },
        {
            id: "spor-terapi",
            slug: "spor-terapi",
            title: "Spor Terapi Masajı",
            duration: "50 dk",
            price: null,
            desc: "Aktif yaşam stiline özel; toparlanmayı destekleyen ve esnekliği artıran protokol.",
            img: IMG.sport,
            category: "sportsTherapy",
            tags: ["toparlanma", "performans", "aktif"],
            hotelSlugs: ["alba-queen", "alba-resort", "alba-royal", "iberostar-bellevue"],
            href: DETAIL_BASE + "spor-terapi",
            tier: "SPORT"
        },
        {
            id: "sirt-terapi",
            slug: "sirt-terapi",
            title: "Sırt Odaklı Terapi",
            duration: "30 dk",
            price: null,
            desc: "Sırt bölgesindeki gerginliği hedefleyen, duruş kaynaklı yorgunluğa iyi gelen odaklı çalışma.",
            img: IMG.sport,
            category: "sportsTherapy",
            tags: ["sırt", "gerginlik", "duruş"],
            hotelSlugs: ["alba-queen", "alba-resort", "alba-royal", "iberostar-bellevue"],
            href: DETAIL_BASE + "sirt-terapi",
            tier: "BACK"
        },

        // 3. ASYA MASAJLARI (asianMassages)
        {
            id: "thai",
            slug: "thai",
            title: "Thai Esneme Masajı",
            duration: "50 dk",
            price: null,
            desc: "Pasif yoga hareketleri ve enerji hatlarına baskı ile yapılan, yağsız ve kıyafetli ritüel.",
            img: IMG.asia,
            category: "asianMassages",
            tags: ["thai", "esneme", "enerji"],
            hotelSlugs: ["alba-queen", "alba-resort", "alba-royal", "iberostar-bellevue"],
            href: DETAIL_BASE + "thai",
            tier: "THAI"
        },
        {
            id: "bali",
            slug: "bali",
            title: "Bali Masajı",
            duration: "50 dk",
            price: null,
            desc: "Uzun, akıcı vuruşlar ve hafif esnetmelerle yapılan geleneksel Endonezya tekniği.",
            img: IMG.asia,
            category: "asianMassages",
            tags: ["bali", "ritim", "akıcı"],
            hotelSlugs: ["alba-queen", "alba-resort", "alba-royal", "iberostar-bellevue"],
            href: DETAIL_BASE + "bali",
            tier: "BALI"
        },
        {
            id: "shiatsu",
            slug: "shiatsu",
            title: "Shiatsu",
            duration: "50 dk",
            price: null,
            desc: "Parmak baskısıyla vücuttaki enerji akışını dengelemeyi amaçlayan teknik.",
            img: IMG.asia,
            category: "asianMassages",
            tags: ["shiatsu", "baskı", "enerji"],
            hotelSlugs: ["alba-queen", "alba-resort", "alba-royal", "iberostar-bellevue"],
            href: DETAIL_BASE + "shiatsu",
            tier: "JAPAN"
        },

        // 4. ÇİFT & SIGNATURE (signatureCouples)
        {
            id: "cift-senkron",
            slug: "cift-senkron",
            title: "Çift Masajı (Senkron)",
            duration: "50 dk",
            price: null,
            desc: "İki terapist tarafından aynı anda uygulanan, eş zamanlı rahatlama deneyimi.",
            img: IMG.couple,
            category: "signatureCouples",
            tags: ["çift", "senkron", "romantik"],
            hotelSlugs: ["alba-queen", "alba-resort", "alba-royal", "iberostar-bellevue"],
            href: DETAIL_BASE + "cift-senkron",
            tier: "DUO"
        },
        {
            id: "signature-rituel",
            slug: "signature-rituel",
            title: "Signature Santis Ritüeli",
            duration: "75 dk",
            price: null,
            desc: "Doğu ve Batı tekniklerinin en iyi kombinasyonuyla oluşturulan özel imza masajımız.",
            img: IMG.couple,
            category: "signatureCouples",
            tags: ["signature", "premium", "özel"],
            hotelSlugs: ["alba-queen", "alba-resort", "alba-royal", "iberostar-bellevue"],
            href: DETAIL_BASE + "signature-rituel",
            tier: "SIGNATURE"
        },
        {
            id: "cift-rituel",
            slug: "cift-rituel",
            title: "Çift Spa Ritüeli (Masaj + Bakım)",
            duration: "90 dk",
            price: null,
            desc: "Çiftlere özel masaj ve bakım kombinasyonu. Birlikte yenilenin.",
            img: IMG.couple,
            category: "signatureCouples",
            tags: ["çift", "paket", "romantik"],
            hotelSlugs: ["alba-queen", "alba-resort", "alba-royal", "iberostar-bellevue"],
            href: DETAIL_BASE + "cift-rituel",
            tier: "VIP_COUPLE"
        },

        // 5. KIDS & FAMILY (kidsFamily) - NO ALBA ROYAL
        {
            id: "kids-nazik",
            slug: "kids-nazik",
            title: "Kids Masajı (Nazik Dokunuş)",
            duration: "30 dk",
            price: null,
            desc: "Çocuklara özel, çok hafif baskılı ve eğlenceli, rahatlatıcı masaj deneyimi.",
            img: IMG.kids,
            category: "kidsFamily",
            tags: ["kids", "nazik", "çocuk"],
            hotelSlugs: ["alba-queen", "alba-resort", "iberostar-bellevue"],
            href: DETAIL_BASE + "kids-nazik",
            tier: "JUNIOR"
        },
        {
            id: "anne-cocuk",
            slug: "anne-cocuk",
            title: "Anne–Çocuk Rahatlama",
            duration: "50 dk",
            price: null,
            desc: "Anne ve çocuk için aynı odada, güvenli ve keyifli bir spa anısı.",
            img: IMG.kids,
            category: "kidsFamily",
            tags: ["family", "birlikte", "anne"],
            hotelSlugs: ["alba-queen", "alba-resort", "iberostar-bellevue"],
            href: DETAIL_BASE + "anne-cocuk",
            tier: "FAMILY"
        }
    ];

    // Backward-compat alias (başka yerlerde NV_MASSAGE kullanıldıysa kırmasın)
    window.NV_MASSAGE = window.NV_MASSAGES;

    window.NV_MASSAGE_CATEGORY_LABELS = {
        classicMassages: "Klasik Masajlar",
        sportsTherapy: "Spor Terapi",
        asianMassages: "Asya Masajları",
        signatureCouples: "Çift & Signature",
        kidsFamily: "Çocuk & Aile"
    };

    window.NV_MASSAGE_PRICE_LABEL = function (price) {
        return !price ? "Fiyat sorunuz" : `${price}€`;
    };

})();
