import { formatSovereignPrice } from '/assets/js/core/currency-formatter.js';
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

/**
 * SANTIS OS - DATA BRIDGE [PHASE 30]
 * Kuantum Köprüsü: PDP Enjeksiyonu, Zero-Jank Rehidrasyon ve Aurelia Farkındalığı
 * Architect: Hakan
 */

class SantisQuantumBridge {
    constructor() {
        this.dataSourceUrl = '/assets/data/services.json';
        this.worker = null;
        this.currentSlug = null;
    }

    // 8.1. Kuantum Köprüsü: SİSTEM BAŞLATICISI (bootPDP)
    bootPDP() {
        // Eğer sayfada veriye ihtiyaç duyan (data-santis-bind) bir eleman yoksa, Worker'ı hiç tetikleme (Admin panelleri ve bağımsız sayfalar için)
        if (!document.querySelector('[data-santis-bind]')) {
            return;
        }

        console.log("🦅 [Santis OS] Phase 30: Kuantum Köprüsü bootPDP() başlatılıyor...");
        
        // Manifestoya Uygun: URLSearchParams ile dinamik slug analizi 
        // Örn: pdp.html?service=bronz-masaji veya pdp.html?slug=bronz-masaji
        const params = new URLSearchParams(window.location.search);
        this.currentSlug = params.get('service') || params.get('slug');

        // Fallback: Path tabanlı URL kullanımı için (Örn: /bronz-masaji.html)
        if (!this.currentSlug) {
            const match = window.location.pathname.match(/\/([^\/]+)$/);
            if (match) {
                let cleanSlug = match[1].replace('.html', '').replace('.php', '');
                if (cleanSlug === 'index' || cleanSlug === 'index.html' || cleanSlug === '') {
                    this.currentSlug = null;
                } else {
                    this.currentSlug = cleanSlug;
                }
            } else {
                this.currentSlug = null;
            }
        }

        if (!this.currentSlug) {
            console.log("📍 [Santis OS] PDP Parametresi bulunamadı. Matrix Modu (Anasayfa) aktif.");
            return;
        }

        console.log(`🌀 [Sovereign] PDP Hedefi Kilitlendi: [${this.currentSlug}]. İşçi ateşleniyor...`);
        
        // Zero-Jank CLS Koruması: Veri gelmeden önce iskeleti kur
        this.triggerSkeleton();

        // Ana thread'i (UI) korumak için Sovereign Worker'ı uyandır ve emri ver
        this.initSovereignWorker();
    }

    triggerSkeleton() {
        document.querySelectorAll('[data-santis-bind]').forEach(el => {
            el.classList.add('santis-skeleton');
        });
    }

    // 8.1. SOVEREIGN WORKERS (Zero-Jank Asenkron Veri Çekimi)
    initSovereignWorker() {
        // Harici dosyaya gerek bırakmayan Otonom (Inline) Web Worker Mimarisi
        // Ayrı bir thread'de çalıştığı için UI'da zerre kadar takılma (jank) yaratmaz
        const workerCode = `
            self.onmessage = async function(e) {
                const { url, slug } = e.data;
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error("Veri kaynağı Sovereign standartlarında değil.");
                    
                    const data = await response.json();
                    
                    // Eğer services.json hiyerarşik yapıdaysa (categories -> items) düzleştir.
                    let services;
                    if (data.categories) {
                        services = data.categories.flatMap(c => c.services || c.items);
                    } else if (data.services) {
                        services = data.services;
                    } else {
                        services = data;
                    }
                    
                    // İlgili datayı matris içinden Worker'a buldur (Ana thread'i korur)
                    let serviceData = Array.isArray(services) 
                        ? services.find(s => s.slug === slug || s.id === slug) 
                        : services[slug];

                    // Kuantum Çöküşü Koruması (Fallback Matrix)
                    if (!serviceData) {
                        console.warn("[Santis OS] PDP Hedefi (Slug) Matriste Bulunamadı! Fallback Matrix devrede (bronz-masaji).");
                        serviceData = Array.isArray(services) 
                            ? services.find(s => s.slug === 'bronz-masaji' || s.id === 'bronz-masaji') 
                            : services['bronz-masaji'];
                    }

                    if (!serviceData) throw new Error("Matriste hizmet ve fallback bulunamadı.");

                    self.postMessage({ status: 'SUCCESS', payload: serviceData });
                } catch (error) {
                    self.postMessage({ status: 'ERROR', error: error.message });
                }
            };
        `;

        // Worker kodunu Blob'a çevirip RAM üzerinde (memory) çalıştırıyoruz
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));

        // Worker'dan dönen Kuantum yanıtını dinle
        this.worker.onmessage = (e) => {
            if (e.data.status === 'SUCCESS' && e.data.payload) {
                // Layout Shift (CLS) ve Jank engellemesi için Frame'e hizala
                requestAnimationFrame(() => {
                    this.hydratePDP(e.data.payload);
                });
            } else {
                console.error(`🚨 [Santis OS] Worker Anomalisi: ${e.data.error}`);
                this.removeSkeletons();
            }
            // Kaynak sızıntısını önlemek için Worker'ı imha et (Sovereign Clean-up)
            this.worker.terminate(); 
        };

        // Worker'a asenkron veri çekme emrini ilet
        this.worker.postMessage({ 
            // Blob URL context relative path bilmediğinden (blob:http://...), absolute origin vermeliyiz.
            url: new URL(this.dataSourceUrl, window.location.origin).href, 
            slug: this.currentSlug 
        });
    }

    removeSkeletons() {
        document.querySelectorAll('.santis-skeleton').forEach(el => el.classList.remove('santis-skeleton'));
    }

    // 8.2. PROGRESİF REHİDRASYON VE BİYOMETRİK SENKRONİZASYON
    hydratePDP(data) {
        // 1. Skeleton-to-Content Rehidrasyonu
        document.querySelectorAll('[data-santis-bind]').forEach(el => {
            const bindKey = el.getAttribute('data-santis-bind');
            
            let value = data[bindKey];
            if (bindKey === 'heroImage' && !value) value = data.image || data.image_url;
            if (bindKey === 'price' && !value) value = data.price_eur || data.price_try;

            if (value) {
                if (el.tagName === 'IMG') {
                    // Phase 29 uyumlu: Görseli arkada yükle, Phantom Glass ile sahneye bas
                    const imgLoader = new Image();
                    imgLoader.src = value;
                    imgLoader.onload = () => {
                        el.src = value;
                        if(data.title || data.name) el.alt = data.title || data.name;
                        this.applyRefraction(el);
                    };
                } else {
                    // Metin tabanlı rehidrasyon — textContent ile XSS riski önlendi
                    if(bindKey === 'price') el.textContent = `${formatSovereignPrice(value)}`;
                    else if(bindKey === 'duration') el.textContent = `${value} Dk.`;
                    else el.textContent = String(value ?? '');
                    
                    this.applyRefraction(el);
                }
            }
        });

        console.log("✨ [Santis OS] Skeleton-to-Content Rehidrasyonu Tamamlandı.");

        // 2. Biyometrik Senkronizasyon (Santis Soul Engine - Phase 26)
        this.syncBiometrics(data);

        // 3. Aurelia AI Entegrasyonu (Voice-Analitik-UI - Phase 28)
        this.awakenAurelia(data);
    }

    applyRefraction(el) {
        el.classList.remove('santis-skeleton');
        el.classList.add('santis-refracted');
        // Animasyon bitince class'ı temizle
        el.addEventListener('animationend', () => el.classList.remove('santis-refracted'), { once: true });
    }

    // 8.2. RUH HALİNE (MOOD) GÖRE SOUL ENGINE NEFES RİTMİ AYARI
    syncBiometrics(data) {
        // services.json'dan gelen "soulBreathIntensity" değerine göre nabzı ayarla
        // Örn JSON: "soulBreathIntensity": "8s" (Yavaş/Rahatlatıcı) veya "4s" (Hızlı/Spor)
        // Eğer JSON'da değer yoksa standart 4-7-8 ritmi baz alınır (örn: 6s)
        const titleLower = (data.title || data.name || '').toLowerCase();
        let fallbackRhythm = "6s";
        if (titleLower.includes('anti-stress') || titleLower.includes('aromaterapi') || titleLower.includes('relax') || titleLower.includes('bronz')) {
            fallbackRhythm = "8s";
        } else if (titleLower.includes('spor') || titleLower.includes('derin') || titleLower.includes('thai') || titleLower.includes('g5')) {
            fallbackRhythm = "4s";
        }

        const rhythm = data.soulBreathIntensity || fallbackRhythm; 
        
        // CSS Custom Property üzerinden Soul Engine'in solunum sistemini otonom değiştiriyoruz
        document.documentElement.style.setProperty('--soul-breath-intensity', rhythm);
        
        console.log(`🫀 [Soul Engine] Biyometrik Senkronizasyon Aktif. Nefes Temposu: ${rhythm}`);
    }

    // AURELIA AI UYANIŞI
    awakenAurelia(data) {
        const title = data.title || data.name || this.currentSlug;
        const price = data.price || data.price_eur || data.price_try || 'Bilinmiyor';

        const contextPayload = {
            domain: 'PDP',
            activeSlug: this.currentSlug,
            activeTitle: title,
            price: price,
            systemPrompt: `Şu an "${title}" detay sayfasındasınız. Doğrudan ${formatSovereignPrice(price)}/€ fiyatıyla VIP seviyesinde randevu oluşturmayı teklif et.`
        };
        
        // Phase 25.1 Global Event Bus üzerinden (veya CustomEvent) sinyal yolla
        const event = new CustomEvent('santis:aurelia-context-update', { detail: contextPayload });
        window.dispatchEvent(event);
        
        console.log(`🧠 [Aurelia AI] Ses Çekirdeği "${title}" bağlamında uyandırıldı.`);
    }
}

// OS Boot Sequence - Otonom Başlatma
document.addEventListener('DOMContentLoaded', () => {
    if (!window.SantisDataCore) {
        window.SantisDataCore = new SantisQuantumBridge();
        window.SantisDataCore.bootPDP();
    }
});

