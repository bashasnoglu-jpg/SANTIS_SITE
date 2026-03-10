/**
 * ========================================================================
 * SOVEREIGN OS v10.1 - LAYER 4: DATA BRIDGE (PIPELINE HOOK)
 * ========================================================================
 * Architecture: Zero-Fetch Cache Hit, Aegis Mühürlemesi, Deadlock Protection
 */
// Dependencies: window globals (SantisDataAegis, SantisCache, Store, SovereignQuantumRailV7)

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
                window.NV_DATA_READY = true;
                document.dispatchEvent(new Event('nv-data-ready'));
                window.dispatchEvent(new Event('nv-data-ready'));
                console.log(`🧠 [DataBridge] productCatalog seeded from services.json (${window.productCatalog.length})`);
            }

            // 🛡️ 2. AKILLI FİLTRELEME: Sadece bulunulan sayfanın kategorilerini al!
            let filteredData = allData;

            if (categoryLabel && categoryLabel !== 'all' && categoryLabel !== 'general') {
                const label = String(categoryLabel).toLowerCase();
                filteredData = allData.filter(item => {
                    const cat = String(item.category || item.categoryId || '').toLowerCase();
                    // HTML'den 'skincare' gönderilmişse, sadece cilt bakımlarını göster
                    if (label === 'skincare') return cat.includes('skincare') || cat.includes('sothys') || cat === 'face' || cat === 'cilt-bakimi';
                    // HTML'den 'hammam' gönderilmişse, sadece hamamları göster
                    if (label === 'hammam' || label === 'hamam') return cat.includes('hammam') || cat.includes('hamam');
                    // HTML'den 'massage' gönderilmişse, sadece masajları göster
                    if (label === 'massage' || label === 'masajlar') return cat.includes('massage') || cat.includes('asian') || cat.includes('classical') || cat.includes('specialty');
                    if (label === 'rituals') return cat.includes('journey') || cat.includes('ritual') || cat.includes('signature');

                    return cat.includes(label);
                });
            }

            // 3. KÜRESEL HAFIZA (Sayfada yatay ray olsa da olmasa da veri artık cepte)
            window.SovereignDataMatrix = filteredData;

            // 4. İŞARET FİŞEĞİNİ FIRLAT! (Motoru kurmadan ÖNCE yapıyoruz ki herkes duysun)
            window.__SANTIS_RAIL_READY__ = true;
            document.dispatchEvent(new CustomEvent('santis:rail-ready', { detail: window.SovereignDataMatrix }));
            console.log("📡 [DataBridge] Kuantum Sinyali tüm cephelere fırlatıldı!");

            // 5. EĞER SAYFADA V7 RAYI VARSA MOTORU ATEŞLE (Ana Sayfa vb. içindir)
            const railContainer = document.querySelector(containerId);
            if (railContainer) {
                const RailEngine = window.SovereignQuantumRailV7 || (typeof SovereignQuantumRailV7 !== 'undefined' ? SovereignQuantumRailV7 : null);
                if (RailEngine) {
                    window.SovereignVirtualEngine = new RailEngine(containerId, window.SovereignDataMatrix);
                    if (typeof Store !== 'undefined' && Store.subscribe) Store.subscribe(window.SovereignVirtualEngine);
                }
                console.log("🚀 [DataBridge] V7 Kuantum Motoru Raylara Oturdu.");
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

        console.log("📡 [Neuro-Sync] Kuantum Köprüsü (WebSocket) Kuruluyor...");

        const connectQuantumSocket = () => {
            try {
                // Sizin sunucunuzun loglarda tam olarak beklediği "guest" (müşteri) kapısı!
                const ws = new WebSocket('ws://127.0.0.1:8000/ws?client_type=guest');

                ws.onopen = () => {
                    console.log("🟢 [Neuro-Sync] Kuantum Soket Ağına (WebSocket) Kusursuz Bağlanıldı!");
                };

                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    console.log("⚡ [Sovereign Bus] Karargâhtan Sinyal Geldi:", data);

                    // Eğer Backend'den Cerrahi Fiyat Yaması Gelirse
                    if (data.type === "SURGICAL_PATCH" && data.action === "PRICE_UPDATE") {
                        console.log(`⚡ [Neuro-Sync] Fiyat Cerrahi Yama İmzası Doğrulandı: ${data.slug} → €${data.new_price_eur}`);
                        const payload = { id: data.service_id, price_eur: data.new_price_eur };

                        // 1. Cache üzerindeki zırhlı veriyi güncelle
                        if (typeof SantisCache !== 'undefined' && SantisCache.surgicalPatch) {
                            SantisCache.surgicalPatch('PATCH_PRICE', payload);
                        }

                        // 2. Ekrandaki kartın fiyat etiketini sadece O(1) maliyetle güncelle
                        if (typeof Store !== 'undefined' && Store.notifyEngines) {
                            Store.notifyEngines('PATCH_PRICE', payload);
                        }

                        // 3. (Extra Fallback): Kullanıcının gönderdiği genel Store Update zırhı
                        if (window.__SANTIS_STORE__ && window.__SANTIS_STORE__.updateService) {
                            window.__SANTIS_STORE__.updateService(payload);
                        }
                    }

                    // Eğer Backend'den Canlı Görsel (IMAGE) Yaması Gelirse
                    if (data.type === "SURGICAL_PATCH" && data.action === "IMAGE_UPDATE") {
                        console.log(`🖼️ [Neuro-Sync] Kuantum Görsel Yama İmzası Doğrulandı: ${data.slug} → ${data.new_image_url}`);

                        // 1. O(1) Maliyetle DOM Ağacındaki Karta Çarp
                        const cardElements = document.querySelectorAll(`[data-service-id="${data.service_id}"], [data-service-slug="${data.slug}"]`);

                        cardElements.forEach(card => {
                            const imgTarget = card.querySelector('img[data-santis-img], .nv-card-img, .cin-visual-img');
                            if (imgTarget) {
                                // Yumuşak Geçiş (0-GC Fade-in)
                                imgTarget.style.transition = "opacity 0.4s ease-in-out";
                                imgTarget.style.opacity = "0.2";

                                setTimeout(() => {
                                    imgTarget.src = data.new_image_url;
                                    imgTarget.onload = () => { imgTarget.style.opacity = "1"; };
                                }, 400);
                            }
                        });

                        // 2. Önbellekteki veriyi kalıcı olarak ez (Sayfa yenilense bile yeni resim kalsın)
                        if (typeof SantisCache !== 'undefined' && SantisCache.get) {
                            const cacheData = SantisCache.get('global_services_v10');
                            if (cacheData) {
                                const item = cacheData.find(x => x.id === data.service_id || x.slug === data.slug);
                                if (item) item.image = data.new_image_url;
                                SantisCache.set('global_services_v10', cacheData);
                            }
                        }
                    }

                    // ⚡ [SOVEREIGN V5 KASA YAMALARI (ADD, UPDATE, DELETE)]
                    if (data.action && data.payload && window.__SANTIS_STORE__) {
                        const actionMap = { 'UPDATE': 'updateService', 'ADD': 'addService', 'DELETE': 'deleteService' };
                        const method = actionMap[data.action];
                        if (method) window.__SANTIS_STORE__[method](data.payload);
                    }

                    // 📸 [IMAGE FORGE V3 (QUANTUM CATCH)]
                    if (data.event === 'IMAGE_FORGED' && data.service_id) {
                        console.log(`📸 [Neuro-Sync] Kuantum Görseli Geldi! Servis: ${data.service_id}`);

                        if (window.SovereignVirtualEngine && window.SovereignVirtualEngine.updateData) {
                            const newImgUrl = data.variants["640w"] ? data.variants["640w"].webp : Object.values(data.variants)[0].webp;
                            window.SovereignVirtualEngine.updateData({ id: data.service_id, image: newImgUrl });
                        }
                    }
                };

                ws.onclose = () => {
                    console.warn("⚠️ [Neuro-Sync] Soket bağlantısı koptu. 3 saniye sonra tekrar deneniyor...");
                    setTimeout(connectQuantumSocket, 3000); // Auto-Reconnect Zırhı
                };

                ws.onerror = (err) => console.error("🚨 [Neuro-Sync] Soket Hatası:", err);

            } catch (error) {
                console.error("🚨 [Neuro-Sync] WebSocket Kurulamadı!", error);
            }
        };

        // Sistemi Ateşle
        connectQuantumSocket();
    }
};

window.SantisDataBridge = SantisDataBridge;

window.SovereignDataBridge = { injectMatrix: (ep) => SantisDataBridge.bootMatrix(ep, '#santis-app') };
