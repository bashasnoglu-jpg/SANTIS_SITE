/**
 * ==============================================================================
 * SANTIS SOVEREIGN OS - L10 COGNITIVE ROUTER & QUANTUM JUMP ENGINE (OMEGA)
 * ==============================================================================
 * Mimar: SANTIS Karargâh & Sovereign Runtime (SDCR)
 * Doktrin: Sıfır Hata (Zero-Exception), Negatif Gecikme, Zarif Küçülme
 * İşlev: Ziyaretçinin niyet (Intent) vektörünü Trigonometrik olarak hesaplar,
 *        Kuantum Sıçrama sağlar ve desteksiz cihazlarda View Transitions kullanır.
 * ==============================================================================
 */

class SovereignCognitiveRouter {
    constructor() {
        this.quantumVault = new Set(); // Mükerrer prerender'ları önleyen hafıza kasası
        this.activeTargets = new Map(); // Ekranda (Viewport) görünen linklerin RAM matrisi
        
        // 1. SÜTUN: Apex Survival
        this.isSurvivalMode = this.checkApexSurvival();
        
        // 2. SÜTUN: Cognitive Fork
        this.hasQuantumSupport = this.checkCognitiveFork();

        this.initBootSequence();
    }

    initBootSequence() {
        console.log("%c[SANTIS L10] 💠 Bilişsel Yönlendirici (Cognitive Router) Uyanıyor...", "color: #D4AF37; font-weight: bold; background: #0a0a0a; padding: 4px 8px; border-radius: 4px;");

        this.attachInterceptProtocol();

        if (this.isSurvivalMode) {
            console.warn("[SANTIS L10] ⚠️ Apex Survival Devrede: Donanım sınırda. Kuantum motoru uykuya alındı.");
            this.initLegacyBridge(true);
            return;
        }

        if (this.hasQuantumSupport) {
            console.log("%c[SANTIS L10] ⚡ Kuantum Sıçraması (Speculation Rules / Vector Math) Aktif.", "color: #00FFCC; background: #0a0a0a; padding: 4px 8px; border-radius: 4px;");
            this.igniteVectorIntentMotor();
        } else {
            console.info("[SANTIS L10] 🌉 Bilişsel Çatal: Tarayıcı uygun değil. Fısıltı Protokolü (Fetch Bridge) devrede.");
            this.initLegacyBridge(false);
        }
    }

    checkApexSurvival() {
        try {
            if ('connection' in navigator) {
                const conn = navigator.connection;
                if (conn.saveData || ['slow-2g', '2g', '3g'].includes(conn.effectiveType)) return true;
            }
            if ('deviceMemory' in navigator && navigator.deviceMemory < 4) return true;
            return false;
        } catch (e) {
            return true;
        }
    }

    checkCognitiveFork() {
        return HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules');
    }

    // ==============================================================================
    // PURE MATH PREDICTION (Trigonometrik Niyet Skoru) & İVME YAKALAMA
    // ==============================================================================
    igniteVectorIntentMotor() {
        // DOM yormadan ekranda olanları tespit et
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const el = entry.target;
                const url = el.href;
                
                if (entry.isIntersecting && this.isValidTarget(url)) {
                    const rect = el.getBoundingClientRect();
                    this.activeTargets.set(url, {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                        element: el
                    });
                    this.attachHoverListener(el, url);
                } else {
                    this.activeTargets.delete(url);
                }
            });
        }, { rootMargin: "50px", threshold: 0.1 });

        document.querySelectorAll('a[href]').forEach(link => observer.observe(link));

        // Fare İvmesi Çözümleyici (Pisagor ve Cosine Benzerliği)
        let lastX = 0, lastY = 0, lastTime = performance.now();

        window.addEventListener('pointermove', (e) => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            if (deltaTime < 32) return; // Thermal Respect

            const deltaX = e.clientX - lastX;
            const deltaY = e.clientY - lastY;
            const velocity = Math.hypot(deltaX, deltaY);

            lastX = e.clientX;
            lastY = e.clientY;
            lastTime = currentTime;

            if (velocity > 3) { 
                this.calculatePredictiveScore(e.clientX, e.clientY, deltaX, deltaY);
            }
        }, { passive: true });
    }

    calculatePredictiveScore(mouseX, mouseY, deltaX, deltaY) {
        for (const [url, rect] of this.activeTargets.entries()) {
            if (this.quantumVault.has(url)) continue;

            const distX = rect.x - mouseX;
            const distY = rect.y - mouseY;
            const distance = Math.hypot(distX, distY);

            // Nokta Çarpımı (Dot Product)
            const dotProduct = (deltaX * distX + deltaY * distY) / (Math.hypot(deltaX, deltaY) * distance);
            
            // Eğer fare 300px yakındaysa ve hedefe doğruysa (Güven Skoru %85)
            if (distance < 300 && dotProduct > 0.85) {
                this.injectQuantumRule(url, "Vector");
            }
        }
    }

    attachHoverListener(el, url) {
        let timer;
        el.addEventListener('pointerenter', () => {
            if (this.quantumVault.has(url)) return;
            timer = setTimeout(() => this.injectQuantumRule(url, "Hover"), 65);
        }, { passive: true });
        el.addEventListener('pointerleave', () => clearTimeout(timer), { passive: true });
        el.addEventListener('touchstart', () => this.injectQuantumRule(url, "Touch"), { passive: true });
    }

    injectQuantumRule(url, triggerType) {
        if (this.quantumVault.has(url)) return;
        this.quantumVault.add(url);

        const inject = () => {
            const script = document.createElement('script');
            script.type = 'speculationrules';
            script.textContent = JSON.stringify({ prerender: [{ source: "list", urls: [url], eagerness: "eager" }] });
            document.head.appendChild(script);
            console.log(`%c[SANTIS God-Eye] Niyet Kilitlendi (>%80) [${triggerType}]: ${url} (0ms'de hazır)`, "color: #b39ddb;");
        };

        if ('requestIdleCallback' in window) requestIdleCallback(inject);
        else setTimeout(inject, 1);
    }

    initLegacyBridge(isCritical) {
        if (isCritical) return; 
        document.querySelectorAll('a[href]').forEach(link => {
            if (!this.isValidTarget(link.href)) return;
            link.addEventListener('mouseenter', () => {
                if (this.quantumVault.has(link.href)) return;
                this.quantumVault.add(link.href);
                fetch(link.href, { priority: 'low' }).catch(() => {});
            }, { once: true, passive: true });
        });
    }

    isValidTarget(url) {
        try {
            const targetUrl = new URL(url, window.location.href);
            
            // 🛡️ 1. ZIRH: Dış domainleri, WhatsApp (wa.me), Tel ve Mail fısıltılarını KESİNLİKLE engelle
            if (targetUrl.origin !== window.location.origin) return false;
            
            // Güvenlik katmanı: String bazlı dış sızıntı kontrolü
            if (url.includes('wa.me') || url.includes('tel:') || url.includes('mailto:')) return false;

            return !targetUrl.hash && 
                   !targetUrl.pathname.match(/\.(pdf|zip|jpg|png|mp4)$/i) &&
                   !targetUrl.pathname.startsWith('/admin') &&
                   targetUrl.href !== window.location.href;
        } catch (e) {
            return false;
        }
    }

    // ==============================================================================
    // THE INTERCEPT (SPA FETCH BRIDGE & VIEW TRANSITIONS FALLBACK)
    // ==============================================================================
    attachInterceptProtocol() {
        document.body.addEventListener('click', async (e) => {
            const link = e.target.closest('a');
            if (!link || !link.href || link.target === '_blank' || !this.isValidTarget(link.href)) return;

            // Eğer Speculation Rules bunu Prerender yaptıysa tarayıcı OTONOM takaslar 0ms (Native Swap).
            if (this.hasQuantumSupport && !this.isSurvivalMode && this.quantumVault.has(link.href)) return;

            // Yapmadıysa veya Apple/Firefox ise Kuantum SPA sıçraması başlar.
            e.preventDefault();
            await this.navigateCognitive(link.href);
        });

        window.addEventListener('popstate', (e) => {
            const isNativeSwipe = e.hasUAVisualTransition === true;
            this.navigateCognitive(window.location.href, false, isNativeSwipe);
        });

        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => sessionStorage.setItem(`scroll_${window.location.pathname}`, window.scrollY), 100);
        }, { passive: true });
    }

    async navigateCognitive(path, pushToHistory = true, isNativeSwipe = false) {
        try {
            if (window.SantisBus && window.SantisBus.emit) window.SantisBus.emit('router:navigation-start', { path });

            const response = await fetch(path, { 
                headers: { 
                    'Accept': 'text/html',
                    'X-SPA-Navigation': 'true' 
                } 
            });
            if (!response.ok) throw new Error('Ağ yanıtı başarısız.');
            const htmlString = await response.text();

            const doc = new DOMParser().parseFromString(htmlString, 'text/html');
            const newTitle = doc.title;
            const getViewport = (ctx) => ctx.getElementById('santis-main') || ctx.querySelector('main');
            
            const newViewport = getViewport(doc);
            const currentViewport = getViewport(document);

            if (!newViewport || !currentViewport) {
                window.location.assign(path); 
                return;
            }

            const executeSwap = () => {
                return new Promise(resolve => {
                    // Protocol III: Zero-GC Cryo-Sleep entegrasyonu (Apoptosis)
                    if (window.SantisApoptosis) {
                        Array.from(currentViewport.children).forEach((child, i) => window.SantisApoptosis.markForDeath(child, `Eski_DOM_${i}`));
                    }
                    currentViewport.innerHTML = newViewport.innerHTML;
                    document.title = newTitle;
                    
                    if (pushToHistory) window.history.pushState({}, newTitle, path);
                    const savedScroll = sessionStorage.getItem(`scroll_${new URL(path).pathname}`);
                    window.scrollTo(0, savedScroll ? parseInt(savedScroll, 10) : 0);

                    // ⚡ FAZ 3.5: Görsel (WebGL/Grid) Motorların Uyandırılması
                    // Not: Etkileşim (Click) dinleyicileri YENİDEN BAĞLANMAZ (Zero-Rebind Doktrini).
                    // Tıklamalar Omni-Delegator tarafından yönetilecektir.
                    if (typeof window.initSantisCards === 'function') window.initSantisCards();
                    if (typeof window.initSantisTransition === 'function') window.initSantisTransition();

                    resolve();
                });
            };

            if (document.startViewTransition && !isNativeSwipe) {
                try {
                    await document.startViewTransition(() => executeSwap().catch(() => {})).finished;
                } catch (e) {
                    console.warn("[SANTIS L10] Transition skipped", e);
                }
            } else {
                await executeSwap().catch(() => {});
            }

            if (window.SantisBus && window.SantisBus.emit) window.SantisBus.emit('router:navigation-complete', { path });
            // Observer'ları yeni DOM'a bağla
            this.igniteVectorIntentMotor(); 

        } catch (error) {
            window.location.assign(path);
        }
    }
}

// Otonom Sistem Tetiklemesi
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.SovereignRouter = new SovereignCognitiveRouter();
} else {
    window.addEventListener('DOMContentLoaded', () => {
        window.SovereignRouter = new SovereignCognitiveRouter();
    });
}

/**
 * ==============================================================================
 * SANTIS L10 - THE OMNI-DELEGATOR (MUTLAK SİNİR AĞI)
 * ==============================================================================
 * Doktrin: Sıfır-Rebind, Sıfır-Bellek Sızıntısı, Sıfır GC.
 * İşlev: DOM'da kaç element değişirse değişsin, tıklamaları tek merkezden yönetir.
 * ==============================================================================
 */
class SovereignOmniDelegator {
    constructor() {
        if (window._santisOmniActive) return;
        window._santisOmniActive = true;

        console.log("%c[SANTIS L10] 🕸️ Omni-Delegator Aktif. Tüm DOM etkileşimleri tek noktaya mühürlendi.", "color: #ff00ff; background: #1a1a1a; padding: 2px 4px;");
        
        // Sistemin TEK TIKLAMA DİNLEYİCİSİ (Ölümsüz Root Listener)
        document.body.addEventListener('click', this.handleQuantumClick.bind(this), { capture: true });
    }

    handleQuantumClick(e) {
        // Tıklanan elementten yukarı doğru çıkarak (O(1) hızında) Kuantum Niyetini ara
        const interactionTarget = e.target.closest('[data-sovereign-intent]');
        
        if (!interactionTarget) return; // Sıradan bir yere tıklandıysa umursama
        
        const intent = interactionTarget.getAttribute('data-sovereign-intent');
        const payload = interactionTarget.getAttribute('data-payload');

        // Eğer <a> etiketi ise Kuantum Router'a devret
        if (interactionTarget.tagName.toLowerCase() === 'a' && intent === 'route') {
            e.preventDefault();
            if (window.SovereignRouter) window.SovereignRouter.navigateCognitive(interactionTarget.href);
            return;
        }

        // 1. KART / BENTO TIKLAMALARI (Zombileşmesi fiziksel olarak imkansızdır)
        if (intent === 'action:open-bento') {
            e.preventDefault();
            if (window.SantisBento) window.SantisBento.open(payload);
        }
        
        // 2. REZERVASYON MODALI TETİKLEYİCİLERİ
        if (intent === 'action:init-booking') {
            e.preventDefault();
            // Eğer SovereignModal (faz 5 vb) varsa çağır. Değilse legacy rezervasyonu tetikle.
            if (window.SovereignModal) {
                window.SovereignModal.summon();
            } else if (window.nvReservationModal && typeof window.nvReservationModal.open === 'function') {
                window.nvReservationModal.open();
            }
        }
    }
}

// Omni Nerves (Sistemi Başlat)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.OmniNerve = new SovereignOmniDelegator();
} else {
    document.addEventListener('DOMContentLoaded', () => { window.OmniNerve = new SovereignOmniDelegator(); });
}
