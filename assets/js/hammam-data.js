// assets/js/hammam-data.js
// SANTIS — Hammam dataset (TR)
// Pattern: skincare + massage cards (chip/category + detail)

(function () {
    const DETAIL_BASE = "/service-detail.html?slug=";

    const IMG = {
        foam: "/assets/img/hammam-foam.jpg",
        scrub: "/assets/img/hammam-scrub.jpg",
        care: "/assets/img/hammam-care.jpg",
        trad: "/assets/img/hammam-tradition.jpg"
    };

    window.NV_HAMMAM = [
        // 1) KÖPÜK MASAJI (foamBase)
        {
            id: "kopuk-masaji",
            slug: "kopuk-masaji",
            title: "Köpük Masajı",
            duration: "30 dk",
            price: null,
            desc: "Yumuşak köpük ve ritmik uygulama ile gevşeme ve ferahlık hissi.",
            img: IMG.foam,
            category: "foamBase",
            tags: [
                "köpük",
                "rahatlama",
                "hamam"
            ],
            href: DETAIL_BASE + "kopuk-masaji",
            tier: "FOAM"
        },
        // 2) PEELING + KÖPÜK (scrubFoam)
        {
            id: "kese-kopuk",
            slug: "kese-kopuk",
            title: "Kese (Peeling) + Köpük Masajı",
            duration: "30 dk",
            price: null,
            desc: "Geleneksel kese ile arındırma, ardından köpük masajı ile rahatlama.",
            img: IMG.scrub,
            category: "scrubFoam",
            tags: [
                "kese",
                "peeling",
                "köpük"
            ],
            href: DETAIL_BASE + "kese-kopuk",
            tier: "SCRUB + FOAM"
        },
        {
            id: "kahve-peeling-kopuk",
            slug: "kahve-peeling-kopuk",
            title: "Kahve Peeling + Köpük Masajı",
            duration: "30 dk",
            price: null,
            desc: "Canlandırıcı kahve peelingi ile pürüzsüzlük; köpük masajı ile tamamlanır.",
            img: IMG.scrub,
            category: "scrubFoam",
            tags: [
                "kahve",
                "canlandırıcı",
                "köpük"
            ],
            href: DETAIL_BASE + "kahve-peeling-kopuk",
            tier: "ENERGY"
        },
        {
            id: "deniz-tuzu-peeling-kopuk",
            slug: "deniz-tuzu-peeling-kopuk",
            title: "Deniz Tuzu Peeling + Köpük Masajı",
            duration: "30 dk",
            price: null,
            desc: "Mineral destekli tuz peelingi ile arınma; köpük masajı ile tamamlanır.",
            img: IMG.scrub,
            category: "scrubFoam",
            tags: [
                "deniz tuzu",
                "mineral",
                "köpük"
            ],
            href: DETAIL_BASE + "deniz-tuzu-peeling-kopuk",
            tier: "MINERAL"
        },
        // 3) BAKIM + KÖPÜK (careFoam)
        {
            id: "bal-bakimi-kopuk",
            slug: "bal-bakimi-kopuk",
            title: "Bal Bakımı + Köpük Masajı",
            duration: "30 dk",
            price: null,
            desc: "Besleyici bal dokunuşu ile yumuşaklık; köpük masajı ile ritüel tamamlanır.",
            img: IMG.care,
            category: "careFoam",
            tags: [
                "bal",
                "besleyici",
                "köpük"
            ],
            href: DETAIL_BASE + "bal-bakimi-kopuk",
            tier: "NOURISH"
        },
        {
            id: "cikolata-bakimi-kopuk",
            slug: "cikolata-bakimi-kopuk",
            title: "Çikolata Bakımı + Köpük Masajı",
            duration: "30 dk",
            price: null,
            desc: "Kakao aromasıyla keyifli bakım; köpük masajı ile huzurlu bitiş.",
            img: IMG.care,
            category: "careFoam",
            tags: [
                "çikolata",
                "aroma",
                "köpük"
            ],
            href: DETAIL_BASE + "cikolata-bakimi-kopuk",
            tier: "INDULGE"
        },
        {
            id: "alg-bakimi-kopuk",
            slug: "alg-bakimi-kopuk",
            title: "Alg Bakımı + Köpük Masajı",
            duration: "30 dk",
            price: null,
            desc: "Deniz yosunu ile arındırıcı bakım; köpük masajı ile tamamlanır.",
            img: IMG.care,
            category: "careFoam",
            tags: [
                "alg",
                "detoks",
                "köpük"
            ],
            href: DETAIL_BASE + "alg-bakimi-kopuk",
            tier: "DETOX"
        },
        // 4) OSMANLI PROGRAMI (ottomanProgram)
        {
            id: "osmanli-hamam-gelenegi",
            slug: "osmanli-hamam-gelenegi",
            title: "Osmanlı Hamam Geleneği",
            duration: "50 dk",
            price: null,
            desc: "Geleneksel hamam akışı: arındırma + köpük ritmi + dinlenme kapanışı.",
            img: IMG.trad,
            category: "ottomanProgram",
            tags: [
                "osmanlı",
                "gelenek",
                "ritüel"
            ],
            href: DETAIL_BASE + "osmanli-hamam-gelenegi",
            tier: "TRADITION"
        }
    ];

    window.NV_HAMMAM_CATEGORY_LABELS = {
        foamBase: "KÖPÜK MASAJI (TEMEL)",
        scrubFoam: "PEELING + KÖPÜK",
        careFoam: "BAKIM + KÖPÜK",
        ottomanProgram: "OSMANLI PROGRAMI"
    };

    window.NV_HAMMAM_PRICE_LABEL = function (price) {
        return !price ? "Fiyat sorunuz" : `${price}€`;
    };
})();
