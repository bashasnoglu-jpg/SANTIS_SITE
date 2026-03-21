(function () {
    console.log("📥 [Core Data Loader] Initializing...");

    // 1. Static Configuration (Chips, etc.) - Migrated from *-data.js

    // MASSAGE CHIPS (Function-based logic)
    window.SANTIS_MASSAGE_CHIPS = {
        classicMassages: [
            { key: "all", label: "Tümü", icon: "✨" },
            { key: "express", label: "Ekspres (30dk)", icon: "⚡", filter: item => item.duration === "30 dk" },
            { key: "standard", label: "Standart (50dk)", icon: "🕐", filter: item => item.duration === "50 dk" },
            { key: "extended", label: "Uzun (60dk+)", icon: "🌟", filter: item => parseInt(item.duration) >= 60 },
            { key: "stress", label: "Stres Giderici", icon: "🧘", filter: item => item.tags?.includes("stres") || item.tags?.includes("rahatlama") }
        ],
        asianMassages: [
            { key: "all", label: "Tümü", icon: "✨" },
            { key: "japan", label: "Japon", icon: "🇯🇵", filter: item => item.tier === "JAPAN" },
            { key: "thai", label: "Tayland", icon: "🇹🇭", filter: item => item.tier === "THERAPY" },
            { key: "bali", label: "Bali", icon: "🌴", filter: item => item.id === "bali" }
        ],
        sportsTherapy: [
            { key: "all", label: "Tümü", icon: "✨" },
            { key: "intense", label: "Yoğun", icon: "💪", filter: item => item.tier === "INTENSE" },
            { key: "recovery", label: "Toparlanma", icon: "🔄", filter: item => item.tier === "SPORT" }
        ],
        signatureCouples: [
            { key: "all", label: "Tümü", icon: "✨" },
            { key: "couple", label: "Çift", icon: "💑", filter: item => item.tags?.includes("çift") },
            { key: "vip", label: "VIP", icon: "👑", filter: item => item.tier === "SIGNATURE" || item.tier === "VIP_COUPLE" }
        ],
        kidsFamily: [
            { key: "all", label: "Tümü", icon: "✨" },
            { key: "kids", label: "Çocuk", icon: "👶", filter: item => item.tier === "JUNIOR" },
            { key: "family", label: "Aile", icon: "👨‍👩‍👧", filter: item => item.tier === "FAMILY" }
        ]
    };

    // Default Placeholders (if JSON missing)
    window.SANTIS_HAMMAM = [];
    window.SANTIS_MASSAGES = [];
    window.SANTIS_SKINCARE = [];

    async function loadData() {
        try {
            // Find base path (relative detection)
            // Find base path (Explicit Relative detection)
            const cs = document.currentScript;
            let baseUrl = "";
            if (cs && cs.getAttribute('src')) {
                const src = cs.getAttribute('src');
                baseUrl = src.includes('assets/js/core_data_loader.js') ? src.replace('assets/js/core_data_loader.js', '') : "";
            } else if (window.SITE_ROOT) {
                baseUrl = window.SITE_ROOT;
            }
            const dataUrl = baseUrl + "data/site_content.json";

            let data;

            // 1. Try Global Fallback first (Fastest & Local Safe)
            if (window.SANTIS_FALLBACK) {
                console.log("⚡ [Data Loader] Using Fallback Data (Fast Mode)");
                data = window.SANTIS_FALLBACK;
            } else {
                // 2. Try Fetch (Server Mode)
                console.log("📂 [Data Loader] Fetching from:", dataUrl);
                const resp = await fetch(dataUrl);
                if (!resp.ok) throw new Error(`JSON Fetch Failed (${resp.status}): ${dataUrl}`);
                data = await resp.json();
            }

            // CRITICAL FIX: Expose data globally for santis-nav.js
            window.CONTENT = data;
            if (data.global && data.global.navModel) {
                window.NAV_MODEL = data.global.navModel;
            }

            // Handle structure: data.global.services (Object) -> Arrays
            // or data.global.hammam (Array), etc. if mixed.

            // We'll focus on data.global.services which seems to be the source of truth in site_content.json
            const globalData = data.global || {};
            const servicesObj = globalData.services || {};

            // Helper to get TR text
            const tr = (val) => (val && val.tr) ? val.tr : (typeof val === 'string' ? val : "");

            const allServices = Object.entries(servicesObj).map(([key, svc]) => ({
                id: svc.id || key,
                slug: svc.slug || key, // Use key as slug if missing
                title: tr(svc.name),
                desc: tr(svc.desc),
                img: svc.img ? (baseUrl + svc.img) : (baseUrl + "assets/img/luxury-placeholder.webp"),
                price: svc.price,
                duration: svc.durationMin ? svc.durationMin + " dk" : "",
                category: svc.categoryId,
                tier: svc.badge || "",
                tags: []
            }));

            // 1. HAMMAM
            window.SANTIS_HAMMAM = allServices.filter(s => s.category === 'hammam');
            window.SANTIS_HAMMAM_CATEGORIES = {}; // Kategori filtreleme için boş obje
            console.log("✅ SANTIS_HAMMAM Hydrated (" + window.SANTIS_HAMMAM.length + " items)");

            // 2. MASSAGES (Classic, Sports, Asian, Signature, Kids)
            // Categories in site_content.json: classicMassages, sportsTherapy, asianMassages, ayurveda, signatureCouples, kidsFamily
            const massageCats = ['classicMassages', 'sportsTherapy', 'asianMassages', 'ayurveda', 'signatureCouples', 'kidsFamily'];
            window.SANTIS_MASSAGES = allServices.filter(s => massageCats.includes(s.category));
            window.SANTIS_MASSAGES_CATEGORY_ORDER = ['all', 'classicMassages', 'asianMassages', 'sportsTherapy', 'signatureCouples', 'kidsFamily'];
            window.SANTIS_MASSAGES_CATEGORY_LABELS = {
                'all': 'Tümü',
                'classicMassages': 'Klasik',
                'asianMassages': 'Uzak Doğu',
                'sportsTherapy': 'Spor & Terapötik',
                'signatureCouples': 'Premium',
                'kidsFamily': 'Aile'
            };
            console.log("✅ SANTIS_MASSAGES Hydrated (" + window.SANTIS_MASSAGES.length + " items)");

            // 3. SKINCARE (faceSothys)
            window.SANTIS_SKINCARE = allServices.filter(s => s.category === 'faceSothys');
            window.SANTIS_SKINCARE_PRICE_LABEL = (p) => !p ? "Fiyat sorunuz" : `${p}€`;
            console.log("✅ SANTIS_SKINCARE Hydrated (" + window.SANTIS_SKINCARE.length + " items)");

            // Global Fallback Image handler for anything we missed
            [...window.SANTIS_HAMMAM, ...window.SANTIS_MASSAGES, ...window.SANTIS_SKINCARE].forEach(item => {
                if (!item.img) item.img = baseUrl + "assets/img/luxury-placeholder.webp";
            });

            // Dispatch Event
            window.dispatchEvent(new Event('SANTIS_DATA_READY'));

        } catch (e) {
            console.error("❌ Data Loader Error:", e);
        }
    }

    // Expose a promise for engines
    window.SANTIS_DATA_READY_PROMISE = loadData();

})();
