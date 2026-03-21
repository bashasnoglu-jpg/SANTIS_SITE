/**
 * ⚡ SOVEREIGN OS v6.0 — SANTIS BOOTLOADER (OMNI-ROUTER)
 * The Absolute Aegis | Doomsday Edition
 *
 * FEATURES:
 *   - Dynamic Code Splitting (await import)
 *   - Global Guillotine (AbortController)
 *   - Thermal Sentinel (Battery + SaveData adaptive prerender)
 *   - Ghost Mode Detector (Incognito → bypass tüm vault/telemetri)
 *   - Sentinel Device Profiling (ULTRA / BASIC / LITE_ESSENTIAL)
 *
 * CONTRACTS:
 *   - URL/pathname analizi YASAK. Sadece <body data-page="X">.
 *   - Statik import YASAK.
 */

(() => {
    'use strict';

    // =========================================================
    // 🛡️ ULTRA-MEGA ZIRH: Çift Yükleme Kalkanı (Singleton Guard)
    // =========================================================
    if (window.__SANTIS_OS_BOOTED__) {
        console.warn("🛡️ [Sovereign OS] Çift yükleme (Double-Boot) saldırısı savuşturuldu.");
        throw new Error("HALT_EXECUTION"); // Altındaki kodların okunmasını bıçak gibi keser!
    }
    window.__SANTIS_OS_BOOTED__ = true;

    console.log('⚡ [Sovereign Bootloader] Quantum Core Awakening...');


    // =========================================================
    // 1. GLOBAL GUILLOTINE
    //    Tüm modüller bu controller signal'ini dinler.
    //    Bootloader kendini öldürmek isterse abort() çağırır.
    // =========================================================
    const masterController = new AbortController();
    window.__SovereignAbort = masterController;

    // =========================================================
    // 🟢 PHASE 40: AUTO SIZE ENFORCER & SOUL ENGINE SYNC
    // =========================================================
    function runPhase40Hardening() {
        // Enforcer: CLS risk check
        document.querySelectorAll('img').forEach(img => {
            if (!img.getAttribute('width') || !img.getAttribute('height')) {
                console.warn("🚨 [Santis OS] CLS Zafiyeti Tespit Edildi (Eksik Boyut):", img);
            }
        });
        
        // Soul Engine Sync for Hero LCP
        const heroImg = document.querySelector('img[fetchpriority="high"]');
        if (heroImg) {
            if (heroImg.complete) {
                document.documentElement.style.setProperty('--soul-breath-intensity', '1');
                console.log("🦋 [Soul API] Hero Loaded Instantly - Breath Intensity 1");
            } else {
                heroImg.addEventListener('load', () => {
                    document.documentElement.style.setProperty('--soul-breath-intensity', '1');
                    console.log("🦋 [Soul API] Hero Loaded - Breath Intensity 1");
                });
            }
        }
    }

    if (document.readyState === 'loading') {    
        document.addEventListener('DOMContentLoaded', runPhase40Hardening);
    } else {
        runPhase40Hardening();
    }

    // =========================================================
    // 🛡️ SOVEREIGN SHIELD (Global Error Boundary)
    // Ağ kopmaları ve dinamik modül (chunk) hatalarını sönümler
    // =========================================================
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && (event.reason.name === 'AbortError' || event.reason.name === 'TypeError' || String(event.reason.message).includes('dynamically imported'))) {
            event.preventDefault(); // Sistemi kilitlemesini ve konsolu kırmızıya boyamasını engelle
            console.warn('🛡️ [Sovereign Shield] Ağ/Modül kesintisi başarıyla nötralize edildi:', event.reason.message || 'AbortError');
        }
    });

    // =========================================================
    // 2. GHOST MODE DETECTOR
    //    IndexedDB kota testi: Hata = Incognito/Özel Sekme.
    //    0. milisaniyede sonucu window.__SOVEREIGN_GHOST'a yaz.
    // =========================================================
    function detectGhostMode() {
        return new Promise((resolve) => {
            window.__SOVEREIGN_GHOST = false;
            try {
                const req = indexedDB.open('__sov_ghost_probe__', 1);
                req.onerror = () => {
                    window.__SOVEREIGN_GHOST = true;
                    console.warn('[Ghost Mode] 👻 Incognito tespit edildi. Vault bypass aktif.');
                    resolve(true);
                };
                req.onsuccess = (e) => {
                    e.target.result.close();
                    indexedDB.deleteDatabase('__sov_ghost_probe__');
                    resolve(false);
                };
            } catch {
                window.__SOVEREIGN_GHOST = true;
                resolve(true);
            }
        });
    }

    // =========================================================
    // 3. SENTINEL DEVICE PROFILING
    //    Donanım skoruna göre tier belirle.
    // =========================================================
    function detectTier() {
        const cores = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4;
        if (cores <= 2 || memory <= 2) return 'LITE_ESSENTIAL';
        if (cores <= 4 || memory <= 4) return 'BASIC';
        return 'ULTRA';
    }

    // =========================================================
    // 4. THERMAL SENTINEL
    //    Pil < %20 veya saveData → Prerender → Prefetch düşür.
    //    Battery API event'leri sürekli dinlenir (runtime adaptive).
    // =========================================================
    function downgradePrerender() {
        document.querySelectorAll('script[type="speculationrules"]').forEach(tag => {
            try {
                const rules = JSON.parse(tag.textContent);
                if (rules.prerender) {
                    rules.prefetch = rules.prerender.map(r => ({ ...r, eagerness: 'moderate' }));
                    delete rules.prerender;
                    tag.textContent = JSON.stringify(rules);
                    console.warn('[Thermal Sentinel] 🌡️ Prerender → Prefetch düşürüldü (batarya/bant genişliği).');
                }
            } catch { /* Malformed speculationrules → dokunma */ }
        });
    }

    async function initThermalSentinel() {
        // saveData (Veri Tasarrufu) kontrolü
        if (navigator.connection?.saveData) {
            downgradePrerender();
            return;
        }

        // Battery API (opsiyonel, destekleniyorsa)
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();

                const check = () => {
                    if (!battery.charging && battery.level < 0.20) {
                        downgradePrerender();
                    }
                };

                check(); // İlk açılışta kontrol
                battery.addEventListener('levelchange', check, { signal: masterController.signal });
                battery.addEventListener('chargingchange', check, { signal: masterController.signal });
            } catch { /* getBattery desteklenmiyor → geç */ }
        }
    }

    // =========================================================
    // 5. SPECULATION RULES INJECTOR
    //    Eğer henüz sayfada yoksa yükle.
    //    Thermal Sentinel'dan sonra çalışır.
    // =========================================================
    function injectSpeculationRules() {
        if (!HTMLScriptElement.supports?.('speculationrules')) return;
        if (document.querySelector('#sov-neural-prefetch')) return;

        const script = document.createElement('script');
        script.id = 'sov-neural-prefetch';
        script.type = 'speculationrules';
        script.textContent = JSON.stringify({
            prerender: [{ 
                source: 'document', 
                where: { and: [ { href_matches: '/*' }, { not: { href_matches: '/admin/*' } } ] }, 
                eagerness: 'moderate' 
            }]
        });
        document.head.appendChild(script);
    }

    // =========================================================
    // 6. OMNI-ROUTER — CODE SPLITTING
    //    Tek Gerçeklik: <body data-page="X">
    //    URL analizi yasak.
    // =========================================================
    const PAGE_MAP = {
        'index': () => import('/assets/js/pages/home-page.js'),
        'rituals': () => import('/assets/js/pages/rituals.js'),
        // Bento Pages use orchestrator, but need headless data bridge for Concierge
        'hamam': async () => { if(window.SantisDataBridge) SantisDataBridge.bootMatrix('/assets/data/services.json', null, 'hamam'); },
        'massage': async () => { if(window.SantisDataBridge) SantisDataBridge.bootMatrix('/assets/data/services.json', null, 'massage'); },
        'skincare': async () => { if(window.SantisDataBridge) SantisDataBridge.bootMatrix('/assets/data/services.json', null, 'skincare'); },
        'boutique': async () => { if(window.SantisDataBridge) SantisDataBridge.bootMatrix('/assets/data/product-data.json', null, 'boutique'); },
    };

    async function dispatchModule(page, signal) {
        const loader = PAGE_MAP[page];
        if (!loader) {
            console.info(`[Omni-Router] Sayfa "${page}" için kayıtlı modül yok. Geçildi.`);
            return;
        }

        try {
            // THE BRIDGE INJECTION: Ağ hatalarına karşı Error Boundary eklendi
            if (['skincare', 'rituals', 'hamam', 'index', 'massage', 'boutique'].includes(page)) {
                await import('/assets/js/santis-data-bridge.js').catch((e) => {
                    if (e.name === 'AbortError') console.warn("🛡️ [Omni-Router] Data bridge aborted (Hızlı Navigasyon).");
                    else console.warn("🛡️ [Omni-Router] Data bridge pas geçildi (Ağ hatası):", e.message);
                });
            }

            // GÜVENLİ DİNAMİK YÜKLEME (TypeError ve AbortError Korumalı)
            const mod = await loader().catch((e) => {
                // Hızlı sekme geçişlerinde VEYA ağ kopmalarında Fatal Error fırlatmasını engelle
                if (e.name === 'AbortError' || e.name === 'TypeError' || String(e.message).includes('fetch') || String(e.message).includes('dynamically imported')) {
                    console.warn(`🛡️ [Omni-Router] "${page}" modülü ağ kesintisi/navigasyon sebebiyle iptal edildi.`);
                    return null; // Sistemi kilitletmek yerine null dön
                }
                throw e; // Gerçek mantıksal syntax hatalarını fırlat
            });
            
            if (!mod) return; // Modül inmeden kesildiyse sessizce çık
            if (signal.aborted) return; // Guillotine Kalkanı
            
            if (typeof mod.init === 'function') {
                try {
                    // Modülün kendi init() metodundaki hataların tüm sistemi çökertmemesi için izolasyon
                    await Promise.resolve(mod.init(signal));
                    console.log(`✅ [Omni-Router] "${page}" modülü ateşlendi.`);
                } catch (initErr) {
                    console.error(`🚨 [Omni-Router] "${page}" modülü init edilirken çöktü (Bootloader korundu):`, initErr);
                }
            }
        } catch (err) {
            console.error(`💥 [Omni-Router] İzole edilmiş çalışma zamanı hatası ("${page}"):`, err);
        }
    }

    // =========================================================
    // 7. BOOT SEQUENCE — Tüm sistemleri sırayla başlat
    // =========================================================
    async function bootSequence() {
        const page = document.body?.dataset?.page;
        if (!page) {
            console.warn('[Bootloader] <body data-page> eksik. Omni-Router durdu.');
            return;
        }

        // 7.0 Omniverse Core (Phase 37) - Single Source of Truth
        import('/assets/js/core/santis-omniverse-core.js').catch(e => console.error('[Omniverse] Yüklenemedi:', e));

        // 7.0b Aurelia Neural Nexus (Phase 38)
        import('/assets/js/core/santis-aurelia-nexus.js').catch(e => console.error('[Aurelia] Yüklenemedi:', e));

        // 7a. Ghost dedektörü (senkron sonuç için await)
        await detectGhostMode();

        // 7b. Cihaz profili
        const tier = detectTier();
        console.log(`[Sentinel] Device Profile Locked: ${tier}`);

        // 7c. Thermal Sentinel (GPU koruma, async)
        await initThermalSentinel();

        // 7d. Speculation Rules (thermal başladıktan sonra)
        if (tier !== 'LITE_ESSENTIAL') {
            injectSpeculationRules();
        }

        // 7e. SovereignRail fizik motoru (Katman 1)
        requestAnimationFrame(() => {
            if (typeof window.initSovereignRails === 'function') {
                window.initSovereignRails();
            }
        });

        // 7f. Sovereign Quantum Cursor Engine (Phase 30)
        if (tier !== 'LITE_ESSENTIAL') {
            import('/assets/js/core/santis-cursor.js').then((module) => {
                if (!document.querySelector('link[href*="santis.cursor.css"]')) {
                    const styleLink = document.createElement('link');
                    styleLink.rel = 'stylesheet';
                    styleLink.href = '/assets/css/santis-v6/santis.cursor.css';
                    document.head.appendChild(styleLink);
                }
                window.SovereignCursorEngine = new module.SovereignCursor();
            }).catch(err => console.warn('[Quantum Cursor] Motor başlatılamadı:', err));
        }

        // 7g. Neuro-Vault yükle (Ghost Mode yoksa)
        if (!window.__SOVEREIGN_GHOST && tier === 'ULTRA') {
            import(`/assets/js/neuro-sync.js?v=${Date.now()}`)
                .then(m => m.init(masterController.signal))
                .catch(() => { /* Neuro-Vault opsiyonel, sorun değil */ });
        }

        // 7g. Sayfa modülünü dinamik yükle (Code Splitting)
        await dispatchModule(page, masterController.signal);

        console.log('🌌 [Sovereign Bootloader] Bütüncül Sistem Devrede. Sovereign Sanctuary Aktif.');
    }

    // DOM hazır olunca başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootSequence, { once: true });
    } else {
        bootSequence();
    }

})();
