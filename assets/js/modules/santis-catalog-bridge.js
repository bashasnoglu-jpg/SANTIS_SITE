/**
 * Santis Catalog Bridge
 * Extracted catalog and rail data domain from the legacy Santis data bridge.
 */
(function () {
    "use strict";

    if (window.SantisDataBridge) {
        return;
    }

const SantisDataBridge = {
    async bootMatrix(jsonEndpoint, containerId, categoryLabel = 'all') {
        try {
            // 1. Ana veriyi (118 servisin tamamı) çek ve Cache'le
            const cacheKey = 'global_services_v10';
            let allData = (typeof SantisCache !== 'undefined') ? SantisCache.get(cacheKey) : null;

            if (!allData) {
                console.log(`🌐 [DataBridge] Ağdan çekiliyor: ${jsonEndpoint}`);
                const response = await fetch(jsonEndpoint);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const rawData = await response.json();

                const rawArray = rawData.categories
                    ? rawData.categories.flatMap(c => c.services || c.items)
                    : (rawData.services || rawData);

                // Zırhtan geçir ve Cache'e kaydet
                allData = (typeof SantisDataAegis !== 'undefined' && SantisDataAegis.processPipeline)
                    ? SantisDataAegis.processPipeline(rawArray, 'general')
                    : rawArray;
                if (typeof SantisCache !== 'undefined') SantisCache.set(cacheKey, allData);
            }

            // Concierge / legacy UI için global productCatalog seed'i
            if (!Array.isArray(window.productCatalog) || window.productCatalog.length === 0) {
                window.productCatalog = Array.isArray(allData) ? [...allData] : [];
                window.SANTIS_DATA_READY = true;
                document.dispatchEvent(new Event('santis-data-ready'));
                window.dispatchEvent(new Event('santis-data-ready'));
                console.log(`🧠 [DataBridge] productCatalog seeded from services.json (${window.productCatalog.length})`);
            }

            // 🛡️ 2. AKILLI FİLTRELEME: Sadece bulunulan sayfanın kategorilerini al!
            let filteredData = allData;

            if (categoryLabel && categoryLabel !== 'all' && categoryLabel !== 'general') {
                const label = String(categoryLabel).toLowerCase();
                filteredData = allData.filter(item => {
                    const cat = String(item.category || item.categoryId || '').toLowerCase();

                    if (label === 'skincare') {
                        return cat.includes('skincare') || cat.includes('sothys') || cat === 'face' || cat === 'cilt-bakimi';
                    }
                    if (label === 'hammam' || label === 'hamam') {
                        return cat.includes('hammam') || cat.includes('hamam');
                    }
                    if (label === 'massage' || label === 'masajlar') {
                        return cat.includes('massage') || cat.includes('asian') || cat.includes('classical') || cat.includes('specialty');
                    }
                    if (label === 'rituals' || label === 'journey') {
                        return cat.includes('journey') || cat.includes('ritual') || cat.includes('signature');
                    }

                    return cat.includes(label);
                });
            }

            // 3. KÜRESEL HAFIZA (Sayfada yatay ray olsa da olmasa da veri artık cepte)
            window.SovereignDataMatrix = filteredData;

            // 4. İŞARET FİŞEĞİNİ FIRLAT! (Motoru kurmadan ÖNCE yapıyoruz ki herkes duysun)
            window.__SANTIS_RAIL_READY__ = true;
            document.dispatchEvent(new CustomEvent('santis:rail-ready', { detail: window.SovereignDataMatrix }));
            console.log("📡 [DataBridge] Kuantum Sinyali tüm cephelere fırlatıldı!");

            // 5. EĞER SAYFADA V7 RAYI VARSA MOTORU ATEŞLE (Otonom SPA Kalkanlı)
            const attachRailEngine = (container) => {
                // Çift motor çalışmasını engelle (Race Condition Zırhı)
                if (container.dataset.railHydrated === "true") return;
                container.dataset.railHydrated = "true";

                const RailEngine = window.SovereignQuantumRailV7 || (typeof SovereignQuantumRailV7 !== 'undefined' ? SovereignQuantumRailV7 : null);
                if (RailEngine) {
                    // 🛑 ZOMBIE KILLER: Sayfa değişmişse eski motoru RAM'den kazı
                    if (window.SovereignVirtualEngine && typeof window.SovereignVirtualEngine.destroy === 'function') {
                        window.SovereignVirtualEngine.destroy();
                    }

                    window.SovereignVirtualEngine = new RailEngine(containerId, window.SovereignDataMatrix);
                    if (typeof Store !== 'undefined' && Store.subscribe) Store.subscribe(window.SovereignVirtualEngine);
                    console.log("🚀 [DataBridge] V7 Kuantum Motoru Raylara Oturdu (Auto-Healed).");
                }
            };

            const railContainer = document.querySelector(containerId);
            if (railContainer) {
                // Konteyner o an DOM'da varsa direkt bağla (Statik sayfa yüklemesi)
                attachRailEngine(railContainer);
            } else {
                console.info(`⏳ [DataBridge] Ray (${containerId}) henüz DOM'da yok. Router bekleniyor...`);
                
                // Yoksa MutationObserver ile pusuya yat (Hedefi bulduğu an kendini imha eder)
                const railObserver = new MutationObserver((mutations, obs) => {
                    const asyncContainer = document.querySelector(containerId);
                    if (asyncContainer) {
                        obs.disconnect(); // Hedefi buldu, dinlemeyi bırak CPU'yu rahatlat!
                        attachRailEngine(asyncContainer);
                    }
                });
                
                // Sıfır gecikme ile DOM'u dinle
                railObserver.observe(document.body, { childList: true, subtree: true });
            }

            // Kuantum SSE (Canlı Fiyat Stream) Ateşleyici
            this.initNeuroSync();

        } catch (err) {
            console.error("🚨 [DataBridge] Kritik Çöküş Önlendi:", err);
            document.dispatchEvent(new CustomEvent('santis:rail-ready', { bubbles: true, detail: { fallback: true, error: err.message } }));
        }
    },

    initNeuroSync() {
        if (this._neuroSyncActive) return;
        this._neuroSyncActive = true;

        // 🛡️ V8 OMEGA: Sovereign Bus Singleton üzerinden dinle (ayrı WS bağlantısı yok)
        if (!window.SovereignBus) {
            console.warn("⚠️ [Neuro-Sync] SovereignBus bulunamadı. Canlı güncellemeler devre dışı.");
            return;
        }

        console.log("📡 [Neuro-Sync] Sovereign Bus'a abone olunuyor...");

        // Cerrahi Fiyat Yaması
        window.SovereignBus.subscribe('SURGICAL_PATCH', (data) => {
            if (data.action === "PRICE_UPDATE") {
                console.log(`⚡ [Neuro-Sync] Fiyat Yaması: ${data.slug} → €${data.new_price_eur}`);
                const payload = { id: data.service_id, price_eur: data.new_price_eur };
                if (typeof SantisCache !== 'undefined' && SantisCache.surgicalPatch) SantisCache.surgicalPatch('PATCH_PRICE', payload);
                if (typeof Store !== 'undefined' && Store.notifyEngines) Store.notifyEngines('PATCH_PRICE', payload);
                if (window.__SANTIS_STORE__ && window.__SANTIS_STORE__.updateService) window.__SANTIS_STORE__.updateService(payload);
            }

            if (data.action === "IMAGE_UPDATE") {
                console.log(`🖼️ [Neuro-Sync] Görsel Yama: ${data.slug} → ${data.new_image_url}`);
                const cardElements = document.querySelectorAll(`[data-service-id="${data.service_id}"], [data-service-slug="${data.slug}"]`);
                cardElements.forEach(card => {
                    const imgTarget = card.querySelector('img[data-santis-img], .santis-card-img, .cin-visual-img');
                    if (imgTarget) {
                        imgTarget.style.transition = "opacity 0.4s ease-in-out";
                        imgTarget.style.opacity = "0.2";
                        setTimeout(() => {
                            imgTarget.src = data.new_image_url;
                            imgTarget.onload = () => { imgTarget.style.opacity = "1"; };
                        }, 400);
                    }
                });
                if (typeof SantisCache !== 'undefined' && SantisCache.get) {
                    const cacheData = SantisCache.get('global_services_v10');
                    if (cacheData) {
                        const item = cacheData.find(x => x.id === data.service_id || x.slug === data.slug);
                        if (item) item.image = data.new_image_url;
                        SantisCache.set('global_services_v10', cacheData);
                    }
                }
            }
        });

        // Kasa Yamaları (ADD, UPDATE, DELETE)
        window.SovereignBus.subscribe('*', (data) => {
            if (data.action && data.payload && window.__SANTIS_STORE__) {
                const actionMap = { 'UPDATE': 'updateService', 'ADD': 'addService', 'DELETE': 'deleteService' };
                const method = actionMap[data.action];
                if (method) window.__SANTIS_STORE__[method](data.payload);
            }
        });

        // Image Forge V3
        window.SovereignBus.subscribe('IMAGE_FORGED', (data) => {
            if (data.service_id && window.SovereignVirtualEngine && window.SovereignVirtualEngine.updateData) {
                const newImgUrl = data.variants["640w"] ? data.variants["640w"].webp : Object.values(data.variants)[0].webp;
                window.SovereignVirtualEngine.updateData({ id: data.service_id, image: newImgUrl });
            }
        });

        console.log("🟢 [Neuro-Sync] Sovereign Bus abonelikleri aktif.");
    }
};

// V17 & Legacy Global Export
window.SantisDataBridge = SantisDataBridge;

window.SovereignDataBridge = { injectMatrix: (ep) => SantisDataBridge.bootMatrix(ep, '#santis-app') };
})();
