(function () {
    console.log("📥 [Core Data Loader] Initializing...");

    // 1. Static Configuration (Chips, etc.) - Migrated from *-data.js

    // MASSAGE CHIPS (Function-based logic)
    window.NV_MASSAGE_CHIPS = {
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
    window.NV_HAMMAM = [];
    window.NV_MASSAGES = [];
    window.NV_SKINCARE = [];

    async function loadData() {
        try {
            // Find base path (relative detection)
            const cs = document.currentScript;
            const baseUrl = cs && cs.src ? new URL("../..", cs.src).pathname : "/";
            const dataUrl = baseUrl.endsWith("/") ? baseUrl + "data/site_content.json" : baseUrl + "/data/site_content.json";

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

            // Handle structure: data.global.services (Object) -> Arrays
            // or data.global.hammam (Array), etc. if mixed.

            // We'll focus on data.global.services which seems to be the source of truth in site_content.json
            const globalData = data.global || {};
            const servicesObj = globalData.services || {};

            // Helper to get TR text
            const tr = (val) => (val && val.tr) ? val.tr : (typeof val === 'string' ? val : "");

            const allServices = Object.values(servicesObj).map(svc => ({
                id: svc.id || svc.slug,
                slug: svc.slug || svc.id,
                title: tr(svc.name),
                desc: tr(svc.desc),
                img: svc.img || "/assets/img/luxury-placeholder.webp", // Fallback
                price: svc.price,
                duration: svc.durationMin ? svc.durationMin + " dk" : "",
                category: svc.categoryId,
                tier: svc.badge || "", // Mapping badge to tier for UI chips? Or just use categoryId
                tags: [] // Todo if tags exist
            }));

            // 1. HAMMAM
            window.NV_HAMMAM = allServices.filter(s => s.category === 'hammam');
            window.NV_HAMMAM_CATEGORIES = {}; // Todo if needed
            console.log("✅ NV_HAMMAM Hydrated (" + window.NV_HAMMAM.length + " items)");

            // 2. MASSAGES (Classic, Sports, Asian, Signature, Kids)
            // Categories in site_content.json: classicMassages, sportsTherapy, asianMassages, ayurveda, signatureCouples, kidsFamily
            const massageCats = ['classicMassages', 'sportsTherapy', 'asianMassages', 'ayurveda', 'signatureCouples', 'kidsFamily'];
            window.NV_MASSAGES = allServices.filter(s => massageCats.includes(s.category));
            console.log("✅ NV_MASSAGES Hydrated (" + window.NV_MASSAGES.length + " items)");

            // 3. SKINCARE (faceSothys)
            window.NV_SKINCARE = allServices.filter(s => s.category === 'faceSothys');
            window.NV_SKINCARE_PRICE_LABEL = (p) => !p ? "Fiyat sorunuz" : `${p}€`;
            console.log("✅ NV_SKINCARE Hydrated (" + window.NV_SKINCARE.length + " items)");

            // Global Fallback Image handler for anything we missed
            [...window.NV_HAMMAM, ...window.NV_MASSAGES, ...window.NV_SKINCARE].forEach(item => {
                if (!item.img) item.img = "/assets/img/luxury-placeholder.webp";
            });

            // Dispatch Event
            window.dispatchEvent(new Event('NV_DATA_READY'));

        } catch (e) {
            console.error("❌ Data Loader Error:", e);
        }
    }

    // Expose a promise for engines
    window.NV_DATA_READY_PROMISE = loadData();

})();
