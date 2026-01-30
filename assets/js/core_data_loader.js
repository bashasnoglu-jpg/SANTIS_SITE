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
            const resp = await fetch('/data/site_content.json');
            if (!resp.ok) throw new Error("JSON Fetch Failed: " + resp.status);
            const data = await resp.json();

            if (data.catalogs) {
                // HAMMAM
                if (data.catalogs.hammam) {
                    window.NV_HAMMAM = data.catalogs.hammam.items || [];
                    window.NV_HAMMAM_CATEGORIES = data.catalogs.hammam.categories || {};
                    window.NV_HAMMAM_TIERS = data.catalogs.hammam.tiers || {};
                    console.log("✅ NV_HAMMAM Hydrated (" + window.NV_HAMMAM.length + " items)");
                    // Placeholder Guard
                    window.NV_HAMMAM.forEach(item => {
                        const img = new Image();
                        img.onerror = () => item.img = "/assets/img/luxury-placeholder.webp";
                        img.src = item.img;
                    });
                }

                // MASSAGES
                if (data.catalogs.massages) {
                    window.NV_MASSAGES = data.catalogs.massages.items || [];
                    window.NV_MASSAGE_CATEGORIES = data.catalogs.massages.categories || {};
                    window.NV_MASSAGE_TIERS = data.catalogs.massages.tiers || {};
                    console.log("✅ NV_MASSAGES Hydrated (" + window.NV_MASSAGES.length + " items)");
                    // Placeholder Guard
                    window.NV_MASSAGES.forEach(item => {
                        const img = new Image();
                        img.onerror = () => item.img = "/assets/img/luxury-placeholder.webp";
                        img.src = item.img;
                    });
                }

                // SKINCARE
                if (data.catalogs.skincare) {
                    window.NV_SKINCARE = data.catalogs.skincare.items || [];
                    window.NV_SKINCARE_CATEGORY_LABELS = data.catalogs.skincare.categories || {};
                    window.NV_SKINCARE_CATEGORY_ORDER = data.catalogs.skincare.order || [];
                    window.NV_SKINCARE_PRICE_LABEL = function (price) {
                        return !price ? "Fiyat sorunuz" : `${price}€`;
                    };
                    console.log("✅ NV_SKINCARE Hydrated (" + window.NV_SKINCARE.length + " items)");
                    // Placeholder Guard
                    window.NV_SKINCARE.forEach(item => {
                        const img = new Image();
                        img.onerror = () => item.img = "/assets/img/luxury-placeholder.webp";
                        img.src = item.img;
                    });
                }
            }

            // Dispatch Event to notify Engines that wait for this event
            window.dispatchEvent(new Event('NV_DATA_READY'));

        } catch (e) {
            console.error("❌ Data Loader Error:", e);
        }
    }

    // Expose a promise for engines
    window.NV_DATA_READY_PROMISE = loadData();

})();
