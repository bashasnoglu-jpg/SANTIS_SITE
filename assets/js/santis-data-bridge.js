/**
 * ========================================================================
 * SOVEREIGN OS v10.1 - LAYER 4: DATA BRIDGE (PIPELINE HOOK)
 * ========================================================================
 * Architecture: Zero-Fetch Cache Hit, Aegis Mühürlemesi, Deadlock Protection
 */
// Dependencies: window globals (SantisDataAegis, SantisCache, Store, SovereignQuantumRailV7)

/* ─── PHASE 44: OMNI-MANIFEST (SANTIS_DATA) ─── */
window.SANTIS_DATA = window.SANTIS_DATA || {};

window.SANTIS_DATA.skincare = [
    {
        id: "all_treatments",
        title: "Tüm Bakımlar",
        icon: "🔮",
        slug: "/tr/cilt-bakimi/tum-bakimlar.html",
        image: "/assets/img/cards/skincare-all-lux.webp",
        subtitle: "Bütünsel Güzellik",
        isFeatured: true 
    },
    {
        id: "detox",
        title: "Arındırma",
        icon: "🌿",
        slug: "/tr/cilt-bakimi/arindirma.html",
        image: "/assets/img/cards/skincare-detox-lux.webp",
        subtitle: "Toksinlerden Kurtuluş",
        isFeatured: true
    },
    {
        id: "hydration",
        title: "Nem & Işıltı",
        icon: "💧",
        slug: "/tr/cilt-bakimi/nem-isilti.html",
        image: "/assets/img/cards/skincare-hydration-lux.webp",
        subtitle: "Derinlemesine Besleyici",
        isFeatured: true
    },
    {
        id: "anti_aging",
        title: "Anti-Aging",
        icon: "✨",
        slug: "/tr/cilt-bakimi/anti-aging.html",
        image: "/assets/img/cards/skincare-antiaging-lux.webp",
        subtitle: "Zamana Karşı Kalkan",
        isFeatured: true
    },
    {
        id: "mens_care",
        title: "Erkek Bakımı",
        icon: "🕶️",
        slug: "/tr/cilt-bakimi/erkek-bakimi.html",
        image: "/assets/img/cards/skincare-men-lux.webp",
        subtitle: "Güçlü Maskülen Cilt",
        isFeatured: false 
    }
];

(function loadSantisCatalogBridge() {
    "use strict";

    if (window.SantisDataBridge) return;

    const currentScript = document.currentScript;
    const src = currentScript && currentScript.src ? currentScript.src : "";
    const baseUrl = src.includes("/assets/js/")
        ? src.slice(0, src.indexOf("/assets/js/"))
        : "";

    const script = document.createElement("script");
    script.src = `${baseUrl}/assets/js/modules/santis-catalog-bridge.js`;
    script.async = false;
    script.defer = false;
    script.dataset.santisBridge = "catalog";

    script.onerror = function () {
        console.warn("[SantisDataBridge] Catalog bridge failed to load.");
    };

    document.head.appendChild(script);
})();

(function loadSantisPdpBridge() {
    "use strict";

    if (window.SantisQuantumBridge) return;

    const currentScript = document.currentScript;
    const src = currentScript && currentScript.src ? currentScript.src : "";
    const baseUrl = src.includes("/assets/js/")
        ? src.slice(0, src.indexOf("/assets/js/"))
        : "";

    const script = document.createElement("script");
    script.src = `${baseUrl}/assets/js/modules/santis-pdp-bridge.js`;
    script.defer = false;
    script.dataset.santisBridge = "pdp";

    script.onerror = function () {
        console.warn("[SantisDataBridge] PDP bridge failed to load.");
    };

    document.head.appendChild(script);
})();
