/**
 * santis-v5-virtual-engine.js
 * SOVEREIGN OS V5.5 - PROJECT OMNISCIENCE (Phase 10 & 11)
 * Architecture: True Object Pooling (10 Node Limit), LCP Armor, ShadowDB, Circadian Logic, Gyro LERP, Haptic Snap
 * Author: Principal Architect & The Commander
 */

class SovereignVirtualEngine {
    constructor(containerSelector, dataArray) {
        this.container = document.querySelector(containerSelector);
        this.data = dataArray;

        // Sovereign Bounds (Desktop 480px, Mobil 320px)
        const isMobile = window.innerWidth < 768;
        this.cardWidth = isMobile ? 320 : 480;
        this.gap = 32; // gap-8 = 32px
        this.itemWidth = this.cardWidth + this.gap;

        // Havuz Boyutu: Ekranda görünen kadar + sağ/sol tampon (Buffer)
        // Mobilde 1 kart asıl, 2-3 kart buffer = toplam 6-8 fiziksel DOM
        // Desktop'ta 2-3 kart asıl, 2-3 buffer = toplam 10 fiziksel DOM
        this.poolSize = Math.min(this.data.length, isMobile ? 8 : 12);
        this.pool = [];
        this.ticking = false;

        // Phase 11: SSD I/O Spam Protection
        this.loggedIndices = new Set();

        if (this.container && this.data.length > 0) {
            this.init();
        } else {
            console.warn("⚠️ [V5.2 Engine] Kapsayıcı veya Veri bulunamadı.");
        }
    }

    init() {
        console.log(`⚡ [V5.2 Engine] Sovereign Object Pool Booting... ${this.data.length} Kuantum Rayı`);

        // Phase 11: Sirkadiyen Zeka (Circadian Rendering)
        this.applyCircadianIntelligence();

        // 1. JSON-LD SEO KALKANI (Head Enjeksiyonu)
        this.injectSEOSchema();

        // 2. DOM Hazırlığı (Katliamı Bırakıp Pooling Başlıyor)
        this.container.innerHTML = '';
        this.container.style.position = 'relative'; // Absolute pool child'lar için

        // ZIRH: Absolute elementler container'ı çöktürdüğü için Layout Çökmesini (Collapse) engeller
        const calculatedHeight = (this.cardWidth * (5 / 4)) + 30 + 30; // 30px top offset + alttan ekstra nefes
        this.container.style.minHeight = `${calculatedHeight}px`;

        // 3. NATIVE DUMMY SPACER (Momentum Scroll Koruması)
        // Scroll hijacking yasak! Tarayıcının doğal dokunmatik kaydırma ivmesini korumak için 
        // 118 kartlık sahte (görünmez) bir genişlik yaratılır. 
        const totalScrollWidth = (this.data.length * this.cardWidth) + ((this.data.length - 1) * this.gap);
        this.spacer = document.createElement('div');
        this.spacer.className = 'nv-virtual-spacer';
        this.spacer.style.flex = `0 0 ${totalScrollWidth}px`;
        this.spacer.style.width = `${totalScrollWidth}px`;
        this.spacer.style.height = '1px';
        this.spacer.style.visibility = 'hidden';
        this.spacer.style.pointerEvents = 'none';
        this.container.appendChild(this.spacer);

        // 4. THE POOL (Sıfır DOM Thrashing) - Sadece fiziksel node yarat.
        this.buildPool();

        // Phase 11: Gölge Hafıza (Shadow DB) - Restore Position
        this.restoreShadowMemory().then(() => {
            // 5. rAF 250ms Kinetik Motoruyla Scroll Dinleme
            this.container.addEventListener('scroll', () => this.handleScroll(), { passive: true });

            // Motorun start'ı
            this.updatePool();

            // SovereignRail V4'ün (Oklar/Noktalar) haberdar olması için Custom Event
            if (typeof window.initOmniScroll === "function") {
                setTimeout(() => {
                    document.dispatchEvent(new Event('santis:cards-rendered'));
                }, 50);
            }
        });
    }

    // Phase 11: Gölge Hafıza (Restore)
    async restoreShadowMemory() {
        if (window.SovereignShadowDB) {
            try {
                // Rail ID'si olarak container ID'sini kullan
                const railId = this.container.id || `virtual_rail_${this.data.length}`;
                const savedIndex = await window.SovereignShadowDB.getMemory(railId);

                if (savedIndex !== null && savedIndex < this.data.length) {
                    console.log(`🌑 [V11 OmniScience] Gölge Hafıza Uyandı: Ray ${railId}, İndeks ${savedIndex} konumuna ışınlanıyor.`);
                    const targetScrollLeft = savedIndex * this.itemWidth;
                    this.container.scrollTo({ left: targetScrollLeft, behavior: 'instant' });
                }
            } catch (e) {
                console.warn("[Shadow DB] Restore failed:", e);
            }
        }
    }

    injectSEOSchema() {
        const schemaItems = this.data.map((item, index) => ({
            "@type": "Service",
            "name": item.title,
            "description": item.description || "Sovereign Luxury Ritual",
            "provider": {
                "@type": "HealthAndBeautyBusiness",
                "name": "Santis Club"
            },
            "offers": {
                "@type": "Offer",
                "price": item.price_eur || item.price || 0,
                "priceCurrency": "EUR"
            },
            "image": item.image || item.image_url
        }));

        const schema = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": schemaItems.map((item, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "item": item
            }))
        };

        const scriptTemplate = document.createElement('script');
        scriptTemplate.type = 'application/ld+json';
        scriptTemplate.text = JSON.stringify(schema);
        document.head.appendChild(scriptTemplate);
        console.log("🕸️ [V5.2 Engine] Gelişmiş JSON-LD Schema (Googlebot Zırhı) Enjekte Edildi.");
    }

    // Phase 11: Sirkadiyen Zeka (Circadian Rendering)
    applyCircadianIntelligence() {
        const currentHour = new Date().getHours();
        this.isNightPhase = (currentHour >= 19 || currentHour <= 5);

        let targetPatterns = [];

        if (this.isNightPhase) {
            // Gece (19:00 - 05:00): Rahatlama, aroma, uyku
            targetPatterns = ['uyku', 'rahatlama', 'aroma', 'sleep', 'relax', 'derin', 'deep', 'melatonin'];
            console.log("🌙 [V11 OmniScience] Gece Modu: Melatonin/Rahatlama ritüelleri Kuantum Motorunda öne çekiliyor.");
        } else if (currentHour >= 6 && currentHour <= 14) {
            // Sabah/Öğle (06:00 - 14:00): Enerji, narenciye, ferah
            targetPatterns = ['enerji', 'narenciye', 'ferah', 'canlan', 'energy', 'citrus', 'hydra', 'detox'];
            console.log("☀️ [V11 OmniScience] Sabah Modu: Enerji/Detox ritüelleri Kuantum Motorunda öne çekiliyor.");
        }

        if (targetPatterns.length > 0) {
            const matches = [];
            const others = [];

            this.data.forEach(item => {
                const searchString = `${item.title} ${item.description || ''} ${item.is_signature ? 'signature' : ''}`.toLowerCase();
                const isMatch = targetPatterns.some(pattern => searchString.includes(pattern));
                if (isMatch) matches.push(item);
                else others.push(item);
            });

            // Diziyi güncelle: Önce Sirkadiyen eşleşmeler, sonra diğerleri
            this.data = [...matches, ...others];
        }
    }

    buildPool() {
        for (let i = 0; i < this.poolSize; i++) {
            const card = document.createElement('div');
            // 'absolute' ile yerleşirler, Spacer'ın alanında teleportasyon yaparlar.
            // Padding değerleri `.rail-track` için `30px 20px` olduğu için 
            // `top: 30px` ve `left: 20px` vererek tam içerik çizgisinden başlatıyoruz
            card.className = 'nv-rail-card nv-card ritual-card absolute transition-none group cursor-pointer block';
            card.dataset.poolIndex = i;

            card.style.top = '30px';
            card.style.left = '20px';
            card.style.width = `${this.cardWidth}px`;
            // height: 100% kaldırıldı, aspectRatio (4/5) boyutu belirler.
            card.style.aspectRatio = '4 / 5';
            card.style.backgroundColor = '#080808';
            card.style.borderRadius = '12px';
            card.style.overflow = 'hidden';

            // Transform sadece X yönünde çevrildiği için transition KAPALI olmalı!
            card.style.transition = 'filter 0.4s ease, transform 0s';
            card.style.transform = `translate3d(-9999px, 0, 0)`;

            // Şablon (Sadece 1 Kere Yaratılır, Sonra Sadece İçindeki Datayı Değiştiririz)
            card.innerHTML = `
                <img data-bind="image" src="/assets/img/cards/santis_card_hammam_v1.webp" alt="Ritual" class="nv-rail-card-bg absolute top-0 left-0 w-full h-full object-cover z-10">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none"></div>
                
                <div class="nv-rail-card-content absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end h-full z-20 pointer-events-none">
                    <div class="transform group-hover:-translate-y-48 md:group-hover:-translate-y-56 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-10 w-full">
                        <span data-bind="tag" class="inline-block px-3 py-1 text-[9px] uppercase tracking-[4px] rounded-full mb-4"></span>
                        <h2 data-bind="h2" class="font-serif text-3xl md:text-4xl tracking-wide mb-2 pointer-events-auto">
                            <span data-bind="title-first" class="italic"></span> <span data-bind="title-rest" class="not-italic"></span>
                        </h2>
                        <p data-bind="meta" class="font-sans text-sm text-gray-400 font-light mb-4 transition-opacity duration-300 group-hover:opacity-0"></p>
                    </div>
                    
                    <div class="absolute inset-x-8 bottom-8 opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[600ms] ease-out z-20 delay-[200ms] pointer-events-none checkout-btn-wrapper">
                        <div class="flex flex-col gap-3 md:gap-4 border-t border-white/10 pt-6 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent">
                            <button data-bind="cta" onclick="event.preventDefault(); window.CheckoutVault?.open();" class="santis-intent-btn mt-4 w-full py-4 rounded-full bg-white text-black text-xs font-bold tracking-[2px] uppercase shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-[#D4AF37] transition-colors pointer-events-auto" style="pointer-events: auto !important; z-index: 10001 !important; cursor: pointer !important;">
                                Ritüeli Mühürle
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Binding Referanslarını Keşfet ve Önbelleğe Al (Hızlı erişim için)
            card._binds = {
                image: card.querySelector('[data-bind="image"]'),
                tag: card.querySelector('[data-bind="tag"]'),
                h2: card.querySelector('[data-bind="h2"]'),
                titleFirst: card.querySelector('[data-bind="title-first"]'),
                titleRest: card.querySelector('[data-bind="title-rest"]'),
                meta: card.querySelector('[data-bind="meta"]'),
                cta: card.querySelector('[data-bind="cta"]')
            };

            // Eager Loading LCP Zırhı
            card._binds.image.onload = function () {
                this.classList.remove('opacity-0', 'scale-110');
            };

            this.container.appendChild(card);
            this.pool.push(card);
        }
        console.log(`🏊‍♂️ [V5.2 Engine] DOM Katliamı Bitti! Sadece ${this.poolSize} Fiziksel DOM Havuza Atıldı.`);
    }

    handleScroll() {
        if (!this.ticking) {
            window.requestAnimationFrame(() => {
                this.updatePool();
                this.ticking = false;
            });
            this.ticking = true;
        }
    }

    updatePool() {
        // Matematiksel Native Scroll Mesafesi
        const scrollLeft = this.container.scrollLeft;

        // CSS :has() Katliamını Engelle, Aktif Aura JS ile Hesaplansın
        const activeIndex = Math.round(scrollLeft / this.itemWidth);
        const centerView = scrollLeft + (this.container.clientWidth / 2);

        // Nereye bakıldığını çöz (Viewport Boundary)
        const viewportStartIndex = Math.floor(scrollLeft / this.itemWidth);

        // Güvenlik Kordonu (Buffer) - Ekranın dışına görünmeyen kartları dizeceğiz
        let startIndex = viewportStartIndex - 1;
        if (startIndex < 0) startIndex = 0;

        let endIndex = startIndex + this.poolSize - 1;
        if (endIndex >= this.data.length - 1) {
            endIndex = this.data.length - 1;
            startIndex = Math.max(0, endIndex - this.poolSize + 1);
        }

        // Kuyruktaki kartları bağla ve ışınla
        for (let dataIndex = startIndex; dataIndex <= endIndex; dataIndex++) {
            const physicalIndex = dataIndex % this.poolSize;
            const element = this.pool[physicalIndex];

            // 1. DATA BINDING: Ekranda görünen data farklılaşmışsa veriyi bas (İçeriği Güncelle)
            if (element.dataset.index !== String(dataIndex)) {
                this.bindData(element, dataIndex);
            }

            // 2. FİZİKSEL IŞINLAMA: Havuzdaki elemanı doğru `left` pozisyonuna native uçur
            element.style.transform = `translate3d(${dataIndex * this.itemWidth}px, 0, 0)`;

            // 3. AKTİF AURA (Intersection Observer Yerine Pürüzsüz Mesafe Hesabı)
            const cardCenter = (dataIndex * this.itemWidth) + (this.cardWidth / 2);
            const distanceToCenter = Math.abs(centerView - cardCenter);

            // Merkeze yakınlık toleransı, veya en çok merkeze yakın olana sınıf verilir
            if (dataIndex === activeIndex) {
                element.classList.add('is-active-aura');
                // DOM yapısını yormamak için basit z-index
                element.style.zIndex = '50';

                // Phase 11: Sirkadiyen Aura Dimming (Gece ışık seviyesi)
                if (this.isNightPhase) {
                    element.style.setProperty('--aura-intensity', '0.7');
                } else {
                    element.style.setProperty('--aura-intensity', '1');
                }

                // Phase 10: Haptik Rezonans (Mekanik Saat Hissi)
                // Titreşim "snap" anında (merkez uzaklığı < 10px) tetiklenir, hızla kaydırırken susar.
                if (distanceToCenter < 10 && this.lastHapticIndex !== activeIndex) {
                    if (navigator.vibrate) {
                        try { navigator.vibrate([2]); } catch (e) { }
                    }
                    this.lastHapticIndex = activeIndex;
                }
            } else {
                element.classList.remove('is-active-aura');
                element.style.zIndex = '1';
            }
        }

        // Phase 11: Gölge Hafıza (Dwell Time Tracking)
        if (this.currentDwellIndex !== activeIndex) {
            this.currentDwellIndex = activeIndex;
            clearTimeout(this.dwellTimer);

            // Kullanıcı bu kartta 3 saniyeden fazla durursa (Dwell), hafızaya kazı
            this.dwellTimer = setTimeout(() => {
                // Sadece daha önce bu oturumda kaydedilmemişse yaz (isLogged zırhı)
                if (window.SovereignShadowDB && !this.loggedIndices.has(activeIndex)) {
                    this.loggedIndices.add(activeIndex);

                    const railId = this.container.id || `virtual_rail_${this.data.length}`;
                    const saveTask = () => {
                        window.SovereignShadowDB.saveMemory(railId, activeIndex).catch(e => console.warn(e));
                    };

                    // Perf-Shield: Gerçek idle-state yakalanana kadar bekle (Sıfır Frame Drop garantisi)
                    if ('requestIdleCallback' in window) {
                        requestIdleCallback(saveTask, { timeout: 2000 });
                    } else {
                        // Safari fallback
                        setTimeout(saveTask, 1);
                    }
                }
            }, 3000);
        }
    }

    bindData(element, index) {
        const ritualData = this.data[index];
        element.dataset.index = index;
        const binds = element._binds; // Önbellekteki DOM Node'ları

        // Metin Ayrıştırmaları
        const isSignature = ritualData.is_signature || false;
        const titleWords = ritualData.title ? ritualData.title.split(' ') : ['Sovereign', 'Ritual'];
        const titleFirst = titleWords[0];
        const titleRest = titleWords.slice(1).join(' ');

        // LCP ZIRHI: `index 0` ve `1` ekranın tam ortasında, hemen fırlatılmalı
        const loadStrategy = (index === 0 || index === 1) ? 'eager' : 'lazy';
        const fetchPriority = (index === 0 || index === 1) ? 'high' : 'low';

        // GÖRSEL ATAMA (Binding)
        const imgSrc = ritualData.image || ritualData.image_url || '/assets/img/cards/santis_card_hammam_v1.webp';
        if (binds.image.src !== imgSrc || binds.image.getAttribute('src') !== imgSrc) {
            binds.image.setAttribute('loading', loadStrategy);
            binds.image.setAttribute('fetchpriority', fetchPriority);
            binds.image.src = imgSrc;
            binds.image.alt = ritualData.alt_text || ritualData.title;
        }

        // TAG ATAMA (Signatures Özel Tasarımı)
        binds.tag.textContent = isSignature ? 'SOVEREIGN APEX' : 'RECOVERY LAB';
        binds.tag.className = `inline-block px-3 py-1 text-[9px] uppercase tracking-[4px] rounded-full mb-4 ${isSignature ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]'
            : 'bg-white/5 border border-white/10 text-gray-300'
            }`;

        // BAŞLIK ATAMA
        binds.h2.className = `font-serif text-3xl md:text-4xl tracking-wide mb-2 pointer-events-auto ${isSignature ? 'text-white' : 'text-[#b5a489]'
            }`;
        binds.titleFirst.textContent = titleFirst;
        binds.titleFirst.className = `italic ${isSignature ? 'text-white' : 'text-[#b5a489]'}`;

        binds.titleRest.textContent = titleRest;
        binds.titleRest.className = `not-italic ${isSignature ? 'text-[#D4AF37]' : 'text-white'}`;

        // META VE FİYAT
        binds.meta.textContent = `${ritualData.duration || '60 Min'} | €${ritualData.price_eur || ritualData.price || '...'}`;

        // CTA BUTON
        binds.cta.dataset.basePrice = ritualData.price_eur || 0;
        binds.cta.dataset.floorPrice = ritualData.fomo_limit || 0;

        // Phase 10: Kuantum Tünellemesi (Cross-Document View Transitions)
        element.onclick = (e) => {
            // Kullanıcı 'Ritüeli Mühürle' butonuna DEĞİL kartın kendine tıkladıysa:
            if (!e.target.closest('.checkout-btn-wrapper') && ritualData.url) {
                // Tıklanan GÖRSELE morphing CSS ID'si ver: Tünel kapısı açılır.
                binds.image.style.viewTransitionName = 'active-ritual-img';
                // JS yönlendirmesi - Chrome/Edge otomatik @view-transition'a bağlar!
                window.location.href = ritualData.url;
            }
        };
    }
}

// Multi-Instance Bootloader
window.SovereignVirtualEngine = window.SovereignVirtualEngine || {};
window.SovereignVirtualEngine.instances = window.SovereignVirtualEngine.instances || [];
window.SovereignVirtualEngine.create = function (containerSelector, dataArray, options) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.warn(`[V5.2 Bootloader] Kapsayıcı bulunamadı: ${containerSelector}`);
        return null;
    }
    const instance = new SovereignVirtualEngine(containerSelector, dataArray, options);
    window.SovereignVirtualEngine.instances.push(instance);
    return instance;
};
