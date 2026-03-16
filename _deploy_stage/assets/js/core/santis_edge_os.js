/**
 * THE SOVEREIGN ENGINE - EDGE NODE INTERFACE (v6.0 SaaS)
 * Multi-Tenant Context Injector & Scope Manager
 */

window.SantisOS = {
    // ─── PHASE 15.5: THE SILENT MODE ───
    DEBUG_MODE: false,

    // ─── PHASE 14.1: SAFETY & TELEMETRY ───
    SAFE_MODE: false,   // Kill Switch
    eventQueue: [],
    _flushTimer: null,

    emitEvent(type, payload) {
        if (this.SAFE_MODE) return;

        this.eventQueue.push({ type, payload, timestamp: Date.now() });

        // Eğer 5 mermi dolduysa anında fırlat
        if (this.eventQueue.length >= 5) {
            this.flushEvents();
        }
        // Aksi takdirde 3 saniye sonra fırlatmak üzere zamanlayıcı kur
        else if (!this._flushTimer) {
            this._flushTimer = setTimeout(() => this.flushEvents(), 3000);
        }
    },

    async flushEvents() {
        clearTimeout(this._flushTimer);
        this._flushTimer = null;

        if (this.eventQueue.length === 0) return;
        if (window.SANTIS_API_ONLINE === false) { this.eventQueue = []; return; } // KILL SWITCH

        const batch = [...this.eventQueue];
        this.eventQueue = []; // Şarjörü anında boşalt

        try {
            console.log(`📡 [Santis Event Bus] Otonom şarjör boşaltılıyor: ${batch.length} event fırlatıldı.`);
            // Phase 15.2 - The Oracle API entegrasyonu
            const sessionId = sessionStorage.getItem('santis_ghost_session') || `ghost_anon_${Date.now()}`;
            sessionStorage.setItem('santis_ghost_session', sessionId); // Garantile

            const response = await fetch('/api/v1/events/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    events: batch
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.signed_intent) {
                    sessionStorage.setItem('santis_intent_signature', data.signed_intent);
                    console.log(`💎 [The Oracle] Niyet Şifrelendi. Sentinel Skoru Onaylandı (+${data.oracle_delta}).`);
                }
            }
        } catch (err) {
            console.warn("[Santis Event Bus] Flush failed. The Oracle Unreachable.", err);
        }
    },

    hotel: {
        id: "default",
        name: "Santis Global",
        type: "luxury", // family, adult, luxury, resort
        city: "Antalya"
    },
    isReady: false,

    async init() {
        // 1. Determine Identity Source (URL Params vs Script Tag)
        const urlParams = new URLSearchParams(window.location.search);
        let hotelId = urlParams.get('hotel');

        if (!hotelId) {
            const scriptTag = document.currentScript || document.querySelector('script[src*="santis_edge_os"]');
            if (scriptTag && scriptTag.dataset.hotel) {
                hotelId = scriptTag.dataset.hotel;
            }
        }

        // PHASE 37: Sovereign Engine Global Tenant Identification
        if (!hotelId && window.SANTIS_TENANT_ID) {
            hotelId = window.SANTIS_TENANT_ID.replace('tenant_', ''); // santis, aman, rixos
        }

        // SOVEREIGN PATCH: Default HQ fallback (masajlar, hamam, cilt gibi alt sayfalarda)
        if (!hotelId) {
            hotelId = 'santis_hq';
        }

        // 2. Fetch Sandbox Context
        if (hotelId) {
            try {
                const root = window.SITE_ROOT || "/";
                const cb = Date.now();
                const response = await fetch(`${root}assets/data/santis_hotels.json?v=${cb}`);
                if (response.ok) {
                    const registry = await response.json();
                    if (registry[hotelId]) {
                        this.hotel.id = hotelId;
                        this.hotel.name = registry[hotelId].name;
                        this.hotel.type = registry[hotelId].type;
                        this.hotel.city = registry[hotelId].city;
                        console.log(`[Omni-OS Edge] Synced to Node: ${this.hotel.name} (Type: ${this.hotel.type}) | City: ${this.hotel.city}`);

                        // Optional: Inject Hotel Branding Elements live
                        this.injectBranding();
                    } else {
                        // SOVEREIGN PATCH: Registry'de yoksa HQ bilgilerini manuel yükle
                        this.hotel.id = hotelId;
                        this.hotel.name = 'Santis Club HQ';
                        this.hotel.type = 'luxury';
                        this.hotel.city = 'Istanbul';
                        console.log(`[Omni-OS Edge] Sovereign Fallback activated for '${hotelId}'. Running as HQ.`);
                    }
                }
            } catch (e) {
                console.error("[Sovereign Edge] Failed to pull hotel registry.", e);
            }
        } else {
            console.log("[Sovereign Edge] Running in Global Context (No Edge active).");
        }

        this.isReady = true;

        // PHASE 10: Sovereign Loyalty Minting (Anonymized Recognition)
        this.initLoyaltyRecognition();

        // PHASE 44: Ultra-CMS Autonomous Media Sync (Phantom Injector)
        this.ignitePhantomInjector();
    },

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 10: SOVEREIGN LOYALTY MINTING (VIP VAULT)
    // ═══════════════════════════════════════════════════════════════════

    mintSovereignLoyalty() {
        let currentPoints = parseInt(localStorage.getItem('santis_vip_points') || '0', 10);
        currentPoints += 100; // Her başarılı Hand-Off işlemi 100 puan kazandırır
        localStorage.setItem('santis_vip_points', currentPoints.toString());
        localStorage.setItem('santis_vip_tier', 'SOVEREIGN_ELITE');
        console.log(`👑 [Sovereign Vault] Minting successful! Points: ${currentPoints} | Tier: SOVEREIGN_ELITE`);

        window.dispatchEvent(new CustomEvent('santis:loyalty_minted', {
            detail: { points: currentPoints, tier: 'SOVEREIGN_ELITE' }
        }));
    },

    initLoyaltyRecognition() {
        const tier = localStorage.getItem('santis_vip_tier');
        if (tier === 'SOVEREIGN_ELITE') {
            console.log('👑 [Sovereign Edge] Anonymous Sovereign Elite recognized. Applying Quiet Luxury perks...');

            // UI Mutation: Change Concierge icon dynamically safely (if DOM is ready or when loaded)
            const applyRecognition = () => {
                const trigger = document.getElementById('santis-concierge-trigger');
                if (trigger && trigger.innerHTML.includes('🤖')) {
                    trigger.innerHTML = '👑';
                    trigger.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.4)';
                    trigger.style.border = '1px solid #D4AF37';
                    trigger.title = "Sovereign Elite Concierge";
                }
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', applyRecognition);
            } else {
                applyRecognition();
            }
        }
    },

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 44.5: PHANTOM INJECTOR — LCP DOMINATION EDITION
    // Priority Queue: Hero VVIP → Cards Idle → Predictive Prefetch
    // ═══════════════════════════════════════════════════════════════════

    // Priority Map: slot adı → execution tier
    _priorityMap: {
        'hero-main': 'VVIP',   // LCP element — eager, fetchpriority=high
        'hero-secondary': 'VVIP',
        'philosophy-hero': 'VVIP',
        // Tüm diğerleri default: 'IDLE'
    },

    async ignitePhantomInjector() {
        const slottedElements = document.querySelectorAll('[data-santis-slot]');
        if (slottedElements.length === 0) return;

        try {
            console.log(`[Phantom Injector] Detected ${slottedElements.length} slotted elements. Syncing Sovereign Media Graph...`);

            // ── Slot verilerini çek (tek API call, tüm slotar için) ──────────────
            const edgeCacheBuster = Date.now();
            let slotMap = {};
            try {
                // If we know the API is offline (from data-bridge or config), skip the fetch entirely to avoid 404 console spam
                if (window.SANTIS_API_ONLINE !== false) {
                    const response = await fetch(`/api/v1/media/slots`); // cache-buster kaldırıldı → browser cache aktif
                    if (response.ok) {
                        slotMap = await response.json();
                    } else {
                        console.warn("[Phantom Injector] API unreachable (404/500). MOCK_MODE: Using empty slotMap.");
                    }
                } else {
                    console.log("[Phantom Injector] API is Offline. MOCK_MODE: Bypassing fetch.");
                }
            } catch (err) {
                console.warn("[Phantom Injector] API fetch failed. MOCK_MODE: Using empty slotMap.");
            }

            // Scarcity CSS — sadece gerektiğinde inject et
            if (!document.getElementById('vault-scarcity-css')) {
                const link = document.createElement('link');
                link.id = 'vault-scarcity-css';
                link.rel = 'stylesheet';
                link.href = '/assets/css/vault_scarcity_v1.css';
                document.head.appendChild(link);
            }
            if (!document.getElementById('vault-reactive-css')) {
                const link = document.createElement('link');
                link.id = 'vault-reactive-css';
                link.rel = 'stylesheet';
                link.href = '/assets/css/vault_reactive_v1.css';
                document.head.appendChild(link);
            }

            // ── VVIP ve IDLE slot'larını ayır ───────────────────────────────────
            const vvipSlots = [];
            const idleSlots = [];

            slottedElements.forEach(el => {
                const slotKey = el.getAttribute('data-santis-slot');
                const tier = this._priorityMap[slotKey] || 'IDLE';
                if (tier === 'VVIP') vvipSlots.push(el);
                else idleSlots.push(el);
            });

            // ── H1: HERO FIRST — Senkron & VVIP ─────────────────────────────────
            // Bu blok render-blocking olmadan ama hemen çalışır (defer ile geldiği için DOM hazır)
            let injectedCount = 0;
            vvipSlots.forEach(el => {
                injectedCount += this._injectSlot(el, slotMap, edgeCacheBuster, true);
            });

            // ── H2: CARD SLOTS — requestIdleCallback ile sessiz infaz ────────────
            // Ana iskelet ve LCP elementi oturduktan sonra devreye girer
            const injectIdleSlots = () => {
                idleSlots.forEach(el => {
                    injectedCount += this._injectSlot(el, slotMap, edgeCacheBuster, false);
                });
                console.log(`[Phantom Injector] Sovereign sync complete. Overridden ${injectedCount} assets (A/B Active).`);

                // ── H3: PREDICTIVE PREFETCH — hover/scroll intent ─────────────
                this._activatePredictivePrefetch(slotMap);
            };

            if ('requestIdleCallback' in window) {
                requestIdleCallback(injectIdleSlots, { timeout: 2000 }); // Max 2s bekle
            } else {
                // Safari fallback
                setTimeout(injectIdleSlots, 300);
            }

        } catch (e) {
            console.warn("[Phantom Injector] Media sync skipped or failed (API offline / Static mode).", e.message);
        }
    },

    // ── Ortak slot enjeksiyon motoru ─────────────────────────────────────────
    _injectSlot(el, slotMap, edgeCacheBuster, isHero) {
        const slotKey = el.getAttribute('data-santis-slot');
        const slotData = slotMap[slotKey];
        if (!slotData || !slotData.assets || slotData.assets.length === 0) return 0;

        const assets = slotData.assets;
        const sessionKey = `santis_ab_${slotKey}`;
        let chosenAsset = assets.find(a => a.asset_id === sessionStorage.getItem(sessionKey));

        // Sovereign Winner önceliği
        const winnerAsset = assets.find(a => a.is_winner === true || a.is_winner === 1);
        if (winnerAsset) {
            chosenAsset = winnerAsset;
        } else if (!chosenAsset) {
            chosenAsset = assets[Math.floor(Math.random() * assets.length)];
            sessionStorage.setItem(sessionKey, chosenAsset.asset_id);
            // Phase 4: Emit Render Event
            if (window.SantisGhost && typeof window.SantisGhost.track === 'function') {
                window.SantisGhost.track("ab_impression", `slot:${slotKey}|asset:${chosenAsset.asset_id}`);
            }
        }

        // URL — hero için cache-buster yok (CDN cache'i kırma), card'lar için de kaldırıldı
        let newUrl = chosenAsset.url;
        if (newUrl && !newUrl.startsWith('http') && !newUrl.startsWith('/')) {
            newUrl = '/' + newUrl;
        }

        // Scarcity badge
        if (slotData.is_scarce) {
            let container = el.parentElement;
            if (container && !container.querySelector('.nv-scarcity-badge')) {
                container.style.position = 'relative';
                const badge = document.createElement('div');
                badge.className = 'nv-scarcity-badge reveal-up';
                badge.innerHTML = `<span class="nv-pulse-dot"></span><span class="nv-scarcity-text">${slotData.scarcity_message || 'Premium Slot'}</span>`;
                container.appendChild(badge);
            }
        }

        el.classList.add('nv-asset-loading');

        // ── Ortak yükleme mührü — tek bir yerden yönetilir ──────────────────
        const markLoaded = (target) => {
            target.classList.remove('nv-asset-loading');
            target.classList.add('nv-asset-loaded');   // Skeleton shimmer söner
            target.style.opacity = '1';
        };

        if (el.tagName.toLowerCase() === 'img') {
            // VVIP (hero): fetchpriority=high + eager — tarayıcıya öncelik sinyali
            if (isHero) {
                el.setAttribute('fetchpriority', 'high');
                el.setAttribute('loading', 'eager');
                el.decoding = 'sync';
            } else {
                el.setAttribute('loading', 'lazy');
                el.decoding = 'async';
            }

            el.onload = () => markLoaded(el);

            // 🛡️ CDN Drop / 404 Koruması — Sovereign fallback
            el.onerror = () => {
                console.warn(`[Phantom Injector] Asset failed: ${newUrl}. Deploying fallback.`);
                el.src = '/assets/img/luxury-placeholder.webp';
                markLoaded(el);
            };

            el.src = newUrl;

            // 🔑 Memory Cache Bypass (WebKit/Safari: cache'den gelince onload hiç tetiklenmez)
            if (el.complete && el.naturalWidth > 0) {
                markLoaded(el);
            }

        } else {
            // Background-image: hero'da senkron, card'larda async
            if (isHero) {
                el.style.backgroundImage = `url('${newUrl}')`;
                markLoaded(el);   // Senkron — shimmer hemen söner
            } else {
                const img = new Image();
                img.onload = () => {
                    el.style.backgroundImage = `url('${newUrl}')`;
                    markLoaded(el);
                };
                img.onerror = () => {
                    console.warn(`[Phantom Injector] BG Asset failed. Deploying fallback.`);
                    el.style.backgroundImage = `url('/assets/img/luxury-placeholder.webp')`;
                    markLoaded(el);
                };
                img.src = newUrl;
            }
        }
        return 1;
    },

    // ── H3: Predictive Prefetch — Hover & Scroll Intent ─────────────────────
    _activatePredictivePrefetch(slotMap) {
        const prefetchedUrls = new Set();
        const prefetchedRoutes = new Set();

        const prefetchAsset = (url) => {
            if (!url || prefetchedUrls.has(url)) return;
            prefetchedUrls.add(url);
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
        };

        const prefetchRoute = (route) => {
            if (!route || prefetchedRoutes.has(route)) return;
            prefetchedRoutes.add(route);
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.as = 'document'; // Tell browser this is an HTML navigation intent
            link.href = route;
            document.head.appendChild(link);
            console.log(`[Phantom Injector] ⚡ Prefetching Route Intent: ${route}`);
        };

        // Scroll intent: viewport'a giren her slotted element'in assetini prefetch et
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const slotKey = entry.target.getAttribute('data-santis-slot');
                        const slotData = slotMap[slotKey];
                        if (slotData && slotData.assets) {
                            slotData.assets.forEach(a => prefetchAsset(a.url));
                        }
                        io.unobserve(entry.target); // Bir kez prefetch yeterli
                    }
                });
            }, { rootMargin: '200px' }); // 200px önce → görünmeden önce başla

            document.querySelectorAll('[data-santis-slot]:not(.nv-prefetch-bound)').forEach(el => {
                io.observe(el);
                // Class addition will be handled below to avoid duplicates
            });
        }

        // Hover intent: herhangi bir nav/card hover'ında slotları önceden çek + ROTAYI PREFETCH ET + SALES TRIGGER
        document.querySelectorAll('[data-santis-slot]:not(.nv-prefetch-bound)').forEach(el => {
            el.classList.add('nv-prefetch-bound'); // Duplicate guard
            let hoverTimer;

            el.addEventListener('mouseenter', () => {
                const slotKey = el.getAttribute('data-santis-slot');
                const slotData = slotMap[slotKey];
                if (slotData && slotData.assets) {
                    slotData.assets.forEach(a => prefetchAsset(a.url));
                }

                // SOVEREIGN PREFETCH ENGINE: Ön yükleme rotası (Document Transition)
                if (slotData && slotData.page_route && slotData.page_route !== window.location.pathname) {
                    prefetchRoute(slotData.page_route);
                }

                // --- PHASE 9: PREDICTIVE SALES TRIGGER ---
                // Eğer misafir kart üzerinde tıklamadan 3.5 sn beklerse, ilgi yüksektir. Agentic AI devreye girer.
                hoverTimer = setTimeout(() => {
                    console.log(`[Phantom Injector] 💎 High Hover Intent Detected on: ${slotKey}. Dispatching Aurelia...`);
                    window.dispatchEvent(new CustomEvent('santis:aurelia_wakeup', {
                        detail: { score: 95, intent_source: slotKey }
                    }));
                }, 3500);

            }); // { once: true } kaldırıldı, çünkü Hover Intent her mouseenter'da sayılmalı. (Prefetch cache'i kendini korur)

            el.addEventListener('mouseleave', () => clearTimeout(hoverTimer));
            el.addEventListener('click', () => clearTimeout(hoverTimer));
        });

        console.log('[Phantom Injector] 🔮 Predictive Prefetch Engine: Active');
    },


    injectBranding() {
        // Replaces general names with specific hotel branding if possible
        const targetElements = document.querySelectorAll('[data-os-hotel-name]');
        targetElements.forEach(el => el.textContent = this.hotel.name);
    }
};

// Async boot
if (!window.__SANTIS_EDGE_OS_BOOTED__) {
    window.__SANTIS_EDGE_OS_BOOTED__ = true;
    SantisOS.init();
}

/* ==========================================================================
   PROTOCOL 23: THE QUANTUM GATEWAY (Sovereign Sayfa Geçişleri)
   ========================================================================== */
document.addEventListener('click', (e) => {
    // Sadece site içi linklere tıklandığında devreye gir
    const link = e.target.closest('a');
    if (!link || link.hostname !== window.location.hostname) return;

    // Hedef URL'nin uzantısını kontrol et (Sadece HTML sayfalarında çalışmalı)
    const targetUrl = link.href;
    if (targetUrl.match(/\.(pdf|jpg|jpeg|png|gif|mp4)$/i) || targetUrl.includes('#')) {
        return; // Dosya indirmeleri veya çapa (anchor) linklerini engelleme
    }

    // 🛡️ SOVEREIGN FALLBACK: SPA geçişinde scriptlerin (innerHTML) execute edilmemesi kart bozulmalarına
    // yol açtığı için Quantum Gateway devre dışı bırakılarak doğal geçiş zorlandı.
    // e.preventDefault();
    // return; // Bırak tarayıcı normal geçiş yapsın.
});

// Quantum Gateway implementation temporarily disabled to prevent script execution failures (innerHTML bug)
// Geri (Back) butonunu desteklemek için
window.addEventListener('popstate', () => {
    window.location.reload();
});
