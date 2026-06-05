/**
 * ═══════════════════════════════════════════════════════════════
 * 🔮 SANTIS MEDYUM v39.0 (Offline-First Hybrid God Mode)
 * ═══════════════════════════════════════════════════════════════
 * 
 * "L1 (RAM) + L2 (SW Disk) Symbiosis" - Algısal Hız Mühendisliği
 * - Service Worker Orchestrator: Başlatır ve diskteki cache'leri okur.
 * - Intent Graph & Adaptive Tripwire: V38'in tüm Pre-Cognitive gücü.
 * - RAM Pre-Warming: Disk cache'indeki (L2) kritik sayfaları RAM'e (L1) alır.
 */

class SantisMedyum {
    constructor() {
        this.CACHE_VERSION = 'v39.0';
        
        // 1. L1 Segmentli Hafıza (Segmented Memory)
        this.cache = {
            critical: new Map(),
            warm: new Map(),     
            cold: new Map()      
        };
        this.maxWarmSize = 15;
        this.activeFetches = new Map();
        
        // 2. Adaptif Tripwire & Intent
        this.hoverTimer = null;
        this.baseThreshold = 65;
        this.lastMouseY = 0;
        this.lastMouseTime = Date.now();
        this.cursorVelocity = 0;
        this.intentGraph = JSON.parse(localStorage.getItem('santis_intent_graph') || '{}');
        this.currentPath = window.location.pathname;
        this.CRITICAL_ROUTES = ['/tr/index.html', '/en/index.html', '/tr/contact.html'];

        console.log(`🔮 [Santis Medyum V39] Uyanıyor... Hybrid God Mode (L1+L2) Aktif.`);
        this.init();
    }

    async init() {
        // V39: Service Worker Entegrasyonu (L2 Orchestration)
        await this.registerShadowWorker();
        await this.preWarmFromDisk();

        this.bindTripwires();
        this.predictNextMoves();
        this.monitorCursorVelocity();
    }

    async registerShadowWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // Sadece mevcut değilse/kontrol edilmiyorsa kaydeder
                const registration = await navigator.serviceWorker.register('/santis-sw.js', { scope: '/' });
                console.log('🌑 [Medyum V39] Shadow Worker (L2) Mühürlendi. Scope:', registration.scope);
            } catch (error) {
                console.warn('🌑 [Medyum V39] Shadow Worker Bağlantı Hatası:', error);
            }
        }
    }

    async preWarmFromDisk() {
        if (!('caches' in window)) return;
        try {
            // Service Worker'ın dinamik cache adını bul
            const keys = await window.caches.keys();
            const swCacheName = keys.find(k => k.includes('santis-dynamic') || k.includes('santis-core'));
            if (!swCacheName) return;

            const cacheLayer = await window.caches.open(swCacheName);
            const requests = await cacheLayer.keys();
            
            let promoted = 0;
            for (let req of requests) {
                if (req.url.endsWith('.html') || req.url.endsWith('/')) {
                    const u = new URL(req.url);
                    const isPredicted = this.intentGraph[this.currentPath] && this.intentGraph[this.currentPath][u.pathname] > 0;
                    
                    if (isPredicted || this.CRITICAL_ROUTES.includes(u.pathname)) {
                        const res = await cacheLayer.match(req);
                        if (res) {
                            const html = await res.text();
                            // Doğrudan L1 Cold Segment'e al (Disk'ten RAM'e terfi)
                            this.storeInSegment(req.url, { version: this.CACHE_VERSION, html, timestamp: Date.now() }, 'cold');
                            promoted++;
                        }
                    }
                }
            }
            if (promoted > 0) console.log(`🔥 [Medyum V39] Hybrid Pre-Warming: ${promoted} Kritik Rota L2'den L1'e Çekildi.`);
        } catch(e) {
            console.warn(`[Medyum V39] L2 Pre-Warming Başarısız:`, e);
        }
    }

    // --- ADAPTIVE INTELLIGENCE ---
    monitorCursorVelocity() {
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            const dy = Math.abs(e.clientY - this.lastMouseY);
            const dt = now - this.lastMouseTime;
            if (dt > 0) this.cursorVelocity = dy / dt; 
            this.lastMouseY = e.clientY;
            this.lastMouseTime = now;
        }, { passive: true });
    }

    getDynamicThreshold() {
        if (this.cursorVelocity > 2) return 120;
        if (this.cursorVelocity < 0.5) return 30;
        return this.baseThreshold; 
    }

    // --- TRIPWIRES & INTENT GRAPH ---
    bindTripwires() {
        // HOVER (Intent detection)
        document.body.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href^="/"]');
            if (!link) return;
            const url = link.href;
            if (this.shouldIgnore(url)) return;

            const delay = this.getDynamicThreshold();
            
            this.hoverTimer = setTimeout(() => {
                this.prefetch(url, 'warm');
            }, delay);
        }, { passive: true });

        // MOUSEOUT (Network Disconnect)
        document.body.addEventListener('mouseout', (e) => {
            if (this.hoverTimer) clearTimeout(this.hoverTimer);
            const link = e.target.closest('a[href^="/"]');
            if (link) this.abortFetch(new URL(link.href, window.location.origin).href);
        }, { passive: true });
        
        // CLICK (Graph Training)
        document.body.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="/"]');
            if (link) this.recordIntent(new URL(link.href, window.location.origin).pathname);
        }, { passive: true });
        
        // MOBILE TOUCH
        document.body.addEventListener('touchstart', (e) => {
            const link = e.target.closest('a[href^="/"]');
            if (link && !this.shouldIgnore(link.href)) this.prefetch(link.href, 'warm');
        }, { passive: true });
    }

    recordIntent(targetPath) {
        if (!this.intentGraph[this.currentPath]) this.intentGraph[this.currentPath] = {};
        this.intentGraph[this.currentPath][targetPath] = (this.intentGraph[this.currentPath][targetPath] || 0) + 1;
        localStorage.setItem('santis_intent_graph', JSON.stringify(this.intentGraph));
    }

    predictNextMoves() {
        const transitions = this.intentGraph[this.currentPath];
        if (!transitions) return;

        let totalClicks = 0;
        for (let path in transitions) totalClicks += transitions[path];

        for (let path in transitions) {
            const probability = transitions[path] / totalClicks;
            if (probability > 0.4) {
                console.log(`🧠 [Medyum V39] Pre-Cognitive Hit (${(probability*100).toFixed(0)}%). Otonom Prefetch: ${path}`);
                this.prefetch(new URL(path, window.location.origin).href, 'cold');
            }
        }
    }

    shouldIgnore(url) {
        try {
            const u = new URL(url);
            if (u.origin !== window.location.origin) return true;
            if (u.hash && u.pathname === window.location.pathname) return true;
            if (u.pathname.match(/\.(jpg|png|webp|css|js|json|pdf|mp4)$/i)) return true;
            if (this.isInL1Cache(u.href)) return true;
            return false;
        } catch(e) { return true; }
    }

    isInL1Cache(url) {
        return this.cache.critical.has(url) || this.cache.warm.has(url) || this.cache.cold.has(url);
    }

    abortFetch(url) {
        if (this.activeFetches.has(url)) {
            this.activeFetches.get(url).abort();
            this.activeFetches.delete(url);
        }
    }

    async prefetch(urlPath, segment = 'warm') {
        const url = new URL(urlPath, window.location.origin).href;
        
        // V42: Governor Ağ Trafiği Kilidi
        // Bir URL'in peş peşe indirilmesini veya spamlenmesini önler (Kovan Aklında herhangi bir sekme indiriyorsa diğerleri bekler)
        if (window.__SANTIS_GOVERNOR__ && !window.__SANTIS_GOVERNOR__.canExecute(`prefetch:${url}`, { cooldown: 5000 })) {
            return;
        }

        // Önce L1'de (RAM) var mı kontrol et, varsa network harcama
        if (this.isInL1Cache(url)) return;

        // Ardından L2'de (Disk) var mı kontrol et. Varsa RAM'e al ve network harcama
        if ('caches' in window) {
            try {
                const cachedRes = await window.caches.match(url);
                if (cachedRes) {
                    const html = await cachedRes.text();
                    this.storeInSegment(url, { version: this.CACHE_VERSION, html, timestamp: Date.now() }, segment);
                    console.log(`💾 [Medyum V39] Network Tasarrufu: L2 Caches'te bulunan ${url} isteği L1'e taşındı.`);
                    return;
                }
            } catch(e) {}
        }

        const path = new URL(url).pathname;
        if (this.CRITICAL_ROUTES.includes(path)) segment = 'critical';

        const controller = new AbortController();
        this.activeFetches.set(url, controller);

        try {
            // V39: Shadow Worker (SW) bu isteği zaten yakalıyor ve DYNAMIC_CACHE'e de koyuyor. L2'ye otomatik yazılır!
            const response = await fetch(url, { priority: 'low', signal: controller.signal, headers: { 'X-Santis-Prefetch': '1' } });
            if (!response.ok) {
                this.activeFetches.delete(url);
                if (response.status === 404) {
                    const deadPath = new URL(url).pathname;
                    if (this.intentGraph[this.currentPath] && this.intentGraph[this.currentPath][deadPath]) {
                        delete this.intentGraph[this.currentPath][deadPath];
                        localStorage.setItem('santis_intent_graph', JSON.stringify(this.intentGraph));
                        console.warn(`🧹 [Medyum V39] 404 Dead Branch Pruned from Intent Graph: ${deadPath}`);
                    }
                }
                return;
            }

            const htmlData = await response.text();
            
            // L1'e de mühürle
            const cachePackage = { version: this.CACHE_VERSION, html: htmlData, timestamp: Date.now() };
            this.storeInSegment(url, cachePackage, segment);
            this.activeFetches.delete(url);
            
            console.log(`⚡ [Medyum V39] L1/L2 Mühürlendi -> [${segment.toUpperCase()}]: ${url}`);
        } catch (err) {
            this.activeFetches.delete(url);
        }
    }

    storeInSegment(url, payload, segment) {
        const targetMap = this.cache[segment];
        if (segment === 'warm' && targetMap.size >= this.maxWarmSize) {
            const firstKey = targetMap.keys().next().value;
            targetMap.delete(firstKey);
        }
        targetMap.set(url, payload);
    }

    // Router bu fonksiyonu çağırıp ASYNC olarak L1 ve L2'den dönecek sonucu bekler
    async get(urlPath) {
        const url = new URL(urlPath, window.location.origin).href;
        
        // 1. L1 CACHE (SAF RAM - O(1)) 
        for (const segment of ['critical', 'warm', 'cold']) {
            if (this.cache[segment].has(url)) {
                const data = this.cache[segment].get(url);
                
                if (data.version !== this.CACHE_VERSION) {
                    this.cache[segment].delete(url);
                    return null; 
                }

                if (segment === 'warm') {
                    this.cache.warm.delete(url);
                    this.cache.warm.set(url, data);
                }

                if (segment === 'cold') {
                    this.cache.cold.delete(url);
                    this.storeInSegment(url, data, 'warm');
                }
                
                return data.html; 
            }
        }

        // 2. L2 CACHE (DISC - Caches API)
        if ('caches' in window) {
            try {
                const cachedRes = await window.caches.match(url);
                if (cachedRes) {
                    const htmlData = await cachedRes.text();
                    
                    // L2'den okunanı hemen L1 WARM'a terfi ettir (Adaptive Tiering Up)
                    const cachePackage = { version: this.CACHE_VERSION, html: htmlData, timestamp: Date.now() };
                    this.storeInSegment(url, cachePackage, 'warm');
                    
                    console.log(`💾 [Medyum V39] L2 Disk Hit (Promoted to RAM): ${url}`);
                    return htmlData;
                }
            } catch (e) {
                console.warn(`[Medyum V39] L2 Okuma Hatası:`, e);
            }
        }
        
        return null; // Cache Miss (Network Error/Fetch Falls Back)
    }
}

// Global Bootloader Kaydı
import { register } from '../core/santis-kernel.js';
export let MedyumInstance;
register('medyum', async () => {
    MedyumInstance = new SantisMedyum();
    window.SANTIS.Medyum = MedyumInstance;
    window.SantisOracle = MedyumInstance; // Legacy
}, ['governor', 'neural']);

export default SantisMedyum;
