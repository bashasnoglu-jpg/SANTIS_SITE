(function () {

    window.SANTIS_HAMMAM = [];

    window.SANTIS_MASSAGES = [];

    window.SANTIS_SKINCARE = [];



    // Helper: Determine Root Path

    const determineRoot = () => {

        if (window.SITE_ROOT) return window.SITE_ROOT;

        const depth = window.location.pathname.split('/').length - 2;

        return depth > 0 ? "../".repeat(depth) : "";

    };



    async function loadData() {

        try {

            const root = determineRoot();

            // Always fetch from root-served /data to avoid nested path issues
            const dataUrl = `/assets/data/site_content.json`;

            let data;



            // 1. Try Global Fallback first

            if (window.SANTIS_FALLBACK) {

                console.log("⚡ [Data Loader] Using Fallback Data (Fast Mode)");

                data = window.SANTIS_FALLBACK;

            } else {

                // 2. Try Fetch

                console.log("📂 [Data Loader] Fetching from:", dataUrl);

                const resp = await fetch(dataUrl);

                if (!resp.ok) throw new Error(`JSON Fetch Failed (${resp.status}): ${dataUrl}`);

                data = await resp.json();

                // 🧩 SANTIS JSON ŞEMA KÖPRÜSÜ (legacy 'global' -> sections)
                if (!data.sections && data.global) {
                    console.log("🔧 Converting legacy 'global' → sections format");
                    const allItems = Object.values(data.global).flat();
                    data.sections = {
                        masaj: { items: allItems.filter(i => i?.category === "masaj") },
                        hamam: { items: allItems.filter(i => i?.category === "hamam") },
                        skin: { items: allItems.filter(i => i?.category === "skin" || i?.category === "cilt") }
                    };
                    console.log("✅ Sections generated:", {
                        masaj: data.sections.masaj.items.length,
                        hamam: data.sections.hamam.items.length,
                        skin: data.sections.skin.items.length
                    });
                }

                // Bridge: if catalogs structure exists but sections yoksa, grid uyumu için dönüştür
                if (!data.sections && data.catalogs) {
                    console.log("🔧 [Data Loader] Converting catalogs -> sections for grid compatibility");
                    const pickItems = (key) => {
                        const bucket = data.catalogs[key];
                        return bucket && Array.isArray(bucket.items) ? bucket.items : [];
                    };
                    data.sections = {
                        hamam: { items: pickItems('hammam') },
                        masaj: { items: pickItems('massages') },
                        skin: { items: pickItems('skincare') }
                    };
                }

            }



            // Expose globally

            window.CONTENT = data;

            if (data.global && data.global.navModel) {

                window.NAV_MODEL = data.global.navModel;

            }



            // Parse Services

            const servicesObj = data.global?.services || {};

            const tr = (val) => (val && val.tr) ? val.tr : (typeof val === 'string' ? val : "");



            const allServices = Object.entries(servicesObj).map(([key, svc]) => ({

                id: svc.id || key,

                slug: svc.slug || key,

                title: tr(svc.name),

                desc: tr(svc.desc),

                img: svc.img ? (root + svc.img.replace(/^\//, '')).replace('//', '/') : (root + '/assets/img/luxury-placeholder.webp'),

                price: svc.price,

                duration: svc.durationMin ? svc.durationMin + " dk" : "",

                category: svc.categoryId,

                tier: svc.badge || "",

                tags: []

            }));



            // -----------------------------------------------------------
            // 🚨 BRIDGE: Polyfill sections for Grid System if missing OR EMPTY
            // -----------------------------------------------------------
            const needsSectionRepair = !data.sections || ['hamam', 'masaj', 'skin'].some(k => {
                const bucket = data.sections?.[k];
                return !bucket || !Array.isArray(bucket.items) || bucket.items.length === 0;
            });
            if (needsSectionRepair) {
                console.log("🔧 [Data Loader] Repairing data.sections from global.services for Home Grid");
                data.sections = {
                    "hamam": { items: allServices.filter(s => s.category === 'hammam') },
                    "masaj": { items: allServices.filter(s => ['classicMassages', 'sportsTherapy', 'asianMassages', 'ayurveda', 'signatureCouples', 'kidsFamily'].includes(s.category)) },
                    "skin": { items: allServices.filter(s => s.category === 'faceSothys') }
                };
            }

            // Expose globally for Home Renderer (Standardizes access)
            window.SANTIS_PRODUCTS = allServices;
            if (!window.productCatalog || window.productCatalog.length === 0) {
                window.productCatalog = allServices;
            }


            // 1. HAMMAM

            window.SANTIS_HAMMAM = allServices.filter(s => s.category === 'hammam');

            window.SANTIS_HAMMAM_CATEGORIES = {};



            // 2. MASSAGES

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



            // 3. SKINCARE

            window.SANTIS_SKINCARE = allServices.filter(s => s.category === 'faceSothys');

            window.SANTIS_SKINCARE_PRICE_LABEL = (p) => !p ? "Fiyat sorunuz" : `${p}€`;



            console.log(`✅ Data Hydrated: Hammam(${window.SANTIS_HAMMAM.length}), Massages(${window.SANTIS_MASSAGES.length}), Skin(${window.SANTIS_SKINCARE.length})`);



            // Dispatch Event

            window.dispatchEvent(new Event('SANTIS_DATA_READY'));



        } catch (e) {

            console.error("❌ Data Loader Error:", e);

        }

    }



    // Expose a promise for engines

    window.SANTIS_DATA_READY_PROMISE = loadData();



})();

