/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ⚡ SANTIS INTERACTION ENGINE v1.0                          ║
 * ║  DOM Events · UI Effects · Living Card · Reservation Modal  ║
 * ║  "Aptal UI" Prensibi: Sadece DOM'u okur, EventBus'a yazar  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Kernel tarafından yüklenir: resolveModule('interaction')
 * Bağımlılık: yok (deps: [])
 */

/* ─── 0. SANTIS FRICTION ENGINE & EMOTIONAL CACHING (Phase 27 & 34) ────────── */
window.SantisFrictionEngine = (() => {
    let score = localStorage.getItem('santis_emotional_cache') ? parseInt(localStorage.getItem('santis_emotional_cache')) : 0;
    const threshold = 70; // Sentient Trigger lowered for Route B Protocol
    let lastY = 0;
    let idleTimer = null;
    let hasTriggered = false;

    // Kuantum Önbelleğe (Emotional Caching) Duygu Durumunu Kaydet
    const persistEmotion = () => {
        if(score > 0) localStorage.setItem('santis_emotional_cache', Math.round(score));
        else localStorage.removeItem('santis_emotional_cache');
    };

    const increaseScore = (points, reason) => {
        if (hasTriggered) return;
        score += points;
        persistEmotion();
        // console.debug(\`[FrictionEngine] +\${points} (\${reason}) -> Score: \${Math.round(score)}\`);
        
        if (score >= threshold) {
            hasTriggered = true;
            console.warn(`[FrictionEngine] Kalkan aşıldı! Sentient Guide başlatılıyor... (${reason})`);
            
            // 🔥 YENİ: Phase 42(B) Bilişsel Dekuplaj (Decoupling) ve Görsel Tetikleyici
            window.dispatchEvent(new CustomEvent('SantisStressLevelHigh', { 
                detail: { score: score, trigger: reason, timestamp: Date.now() } 
            }));

            // 💎 PHASE 33: SOUL FLASH TETİKLEYİCİSİ
            if (window.SantisSoul && typeof window.SantisSoul.triggerSoulFlash === 'function') {
                window.SantisSoul.triggerSoulFlash(4000); // 4 Saniyelik Sıvı Metal Flash
            }

            if (window.SantisVoice && typeof window.SantisVoice.triggerZenMode === 'function') {
                window.SantisVoice.triggerZenMode();
            } else {
                console.log("[FrictionEngine] Fallback: Zen modu isteği (Ses motoru aktif değil).");
                if (typeof window.openReservationModal === 'function') {
                    window.openReservationModal('Zen Therapy / Sentient Auto-Nudge');
                }
            }
        }
    };

    const init = () => {
        // Scroll friction
        document.addEventListener('scroll', () => {
            const currentY = window.scrollY;
            const delta = Math.abs(currentY - lastY);
            if (delta > 20 && delta < 200) {
                // Erratic reading/scrolling
                increaseScore(2, 'scroll_jitter');
            }
            lastY = currentY;
            resetIdle();
        }, { passive: true });

        // Mouse jitter
        let lastX = 0, lastMY = 0;
        document.addEventListener('mousemove', (e) => {
            const moveDelta = Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastMY);
            if (moveDelta > 100) { 
                increaseScore(1.5, 'mouse_erratic');
            }
            lastX = e.clientX;
            lastMY = e.clientY;
            resetIdle();
        }, { passive: true });

        // Idle hesitation
        const resetIdle = () => {
            clearTimeout(idleTimer);
            if (!hasTriggered && document.visibilityState === 'visible') {
                idleTimer = setTimeout(() => {
                    increaseScore(15, 'hesitation_idle'); // 5s idle = hesitation
                    resetIdle();
                }, 5000);
            }
        };

        // Confident action reduces score
        document.addEventListener('click', () => {
            score = Math.max(0, score - 20);
            persistEmotion();
            resetIdle();
        });

        // Decay
        setInterval(() => {
            if (score > 0 && !hasTriggered) {
                score = Math.max(0, score - 5);
                persistEmotion();
            }
        }, 3000);

        // Nöro-Kalıcılık (Phantom Compassion) Check on Boot
        if (score > 60) {
            console.warn(`🌌 [Emotional Cache] Misafir yüksek stresle ayrılmıştı (Skor: ${score}). Otonom Şefkat Protokolü aktif.`);
            // Sisteme yapay bir dinginlik fırsatı ver
            setTimeout(() => {
                if(window.SantisSoul && window.SantisSoul.triggerSoulFlash) window.SantisSoul.triggerSoulFlash(3000);
                score = 30; // 30'a indirerek sistemi rahatlat
                persistEmotion();
                const welcomeMsg = "Tekrar hoş geldiniz... Zihninizi yoran her şeyi dışarıda bırakın, bugün ritminizi ben devralıyorum.";
                console.log(`🎙️ [Aurelia AI] ${welcomeMsg}`);
                // TODO: Phase 34.2 TTS Aurelia Voice integration
            }, 1000);
        }

        // Before Unload: Son mühür
        window.addEventListener('beforeunload', persistEmotion);

        resetIdle();
        console.log(`⚡ [Interaction] Santis Friction Engine & Emotional Caching devrede. Geçmiş Stres Yükü: ${score}`);
    };

    return { init, getScore: () => score, resetScore: () => { score = 0; persistEmotion(); } };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.SantisFrictionEngine.init);
} else {
    window.SantisFrictionEngine.init();
}

/* ─── 1. BENTO CORE INJECTOR ─────────────────────────────────────────────── */
(function initBentoCore() {
    // editorial.css layer
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = '/assets/css/editorial.css';
    document.head.appendChild(link);

    // Grain overlay
    if (!document.querySelector('.santis-grain-overlay')) {
        const grain = document.createElement('div');
        grain.className = 'santis-grain-overlay';
        document.body.appendChild(grain);
    }

    // Ultra Motion feature detection (CSS Scroll Timeline)
    if (CSS.supports('animation-timeline: view()')) {
        document.documentElement.classList.add('ultra-motion');
        console.log('🚀 [Interaction] Ultra Motion: GPU animations aktif.');
    } else {
        console.log('⚠️ [Interaction] Ultra Motion: CSS Transitions fallback.');
    }

    // Instant hover prefetch — sadece gerçek mouse'lu cihazlarda
    if (window.matchMedia('(hover: hover)').matches) {
        document.body.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.bento-card');
            if (card && card.dataset.href && !card.dataset.prefetched) {
                let href = card.dataset.href;
                if (!href.startsWith('http') && !href.startsWith('../') && !href.startsWith('/')) {
                    const dRoot = window.SITE_ROOT || '/';
                    href = dRoot + href;
                    if (!href.endsWith('.html') && !href.includes('.')) {
                        href = href.endsWith('/') ? href + 'index.html' : href + '/index.html';
                    }
                }
                const pl = document.createElement('link');
                pl.rel  = 'prefetch';
                pl.href = href;
                document.head.appendChild(pl);
                card.dataset.prefetched = 'true';
                console.debug('⚡ [Interaction] Prefetch:', href);
            }
        }, { passive: true });
    }
})();

/* ─── 2. SAFE PRELOADER REMOVER ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const p = document.getElementById('preloader');
        if (p) p.classList.add('hidden');
    }, 500);
});

/* ─── 3. FINAL POLISH ENGINE ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    // 3a. Erişilebilirlik: icon butonlarını isimlendir
    document.querySelectorAll('.icon-btn').forEach(btn => {
        if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', 'Santis Action');
    });

    // 3b. SEO & Güvenlik: harici linkleri zırhla
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        link.setAttribute('rel', 'noopener noreferrer');
    });

    // 3c. CLS koruması: görsellere varsayılan boyut ekle
    document.querySelectorAll('img').forEach(img => {
        if (!img.getAttribute('width'))  img.setAttribute('width',  '600');
        if (!img.getAttribute('height')) img.setAttribute('height', '400');
    });

    // 3d. Canonical Link Tornado — eski /en/ /ru/ /de/ vb. → /tr/
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/') && !href.startsWith('//')) {
            const newHref = href.replace(/^\/(en|ru|de|fr|sr)\//, '/tr/');
            if (href !== newHref) {
                link.setAttribute('href', newHref);
                console.debug('⚡ [Interaction] Canonical link forced:', href, '->', newHref);
            }
        }
    });

    console.log('🏆 [Interaction] Final Polish Engine: 10/10 Mükemmellik Mührü.');
});

/* ─── 4. IMAGE ERROR RECOVERY ────────────────────────────────────────────── */
window._imgRecoveryLog = window._imgRecoveryLog || new Set();
document.addEventListener('error', (e) => {
    if (e.target?.tagName?.toLowerCase() !== 'img') return;
    const origSrc = e.target.getAttribute('src') || '';
    if (origSrc.includes('luxury-placeholder') || origSrc.includes('placeholder.webp')) return;
    if (window._imgRecoveryLog.has(origSrc)) return;
    window._imgRecoveryLog.add(origSrc);
    console.debug('[Interaction] Görsel kurtarılıyor:', origSrc);
    e.target.src = '/assets/img/luxury-placeholder.webp';
    e.target.style.filter = 'grayscale(1) opacity(0.5)';
}, true);

/* ─── 5. LIVING CARD — Mobile Touch UX v2 ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    if (!window.matchMedia('(hover: none)').matches && window.innerWidth >= 992) return;

    const cards = document.querySelectorAll('.mega-feature-card, .santis-card, .svc-card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a, button, .santis-btn')) return; // actionable → geç
            e.preventDefault();
            e.stopPropagation();
            const wasFlipped = card.classList.contains('is-flipped');
            cards.forEach(c => c.classList.remove('is-flipped'));
            if (!wasFlipped) card.classList.add('is-flipped');
        });
    });

    // Boş alana dokununca tümünü sıfırla
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.mega-feature-card, .santis-card, .svc-card')) {
            cards.forEach(c => c.classList.remove('is-flipped'));
        }
    });
});

/* ─── 6. RESERVATION MODAL v1.1 (WhatsApp Entegre) ─────────────────────── */
window.openReservationModal = function(serviceName = 'Genel Rezervasyon') {
    const modal = document.getElementById('reservation-modal');
    if (modal) {
        modal.classList.add('active');
        const input = document.getElementById('res-service-input');
        if (input) input.value = serviceName;
    } else {
        const phone = window.SANTIS_CONCIERGE_NUMBER || '905000000000';
        const msg   = encodeURIComponent(`Merhaba, ${serviceName} hakkında bilgi almak istiyorum.`);
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }
    console.log(`[Interaction] Reservation Modal: ${serviceName}`);
};

/* ─── 7. QUANTUM GLARE ENGINE & SCROLL REVEAL ───────────── */
class QuantumGlareEngine {
    constructor() {
        this.init();
    }

    init() {
        window.addEventListener('mousemove', (e) => {
            const targetCard = e.target.closest('.bento-card-v6, .bento-card-v7');
            if (!targetCard) return;

            const rect = targetCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            requestAnimationFrame(() => {
                targetCard.style.setProperty('--mouse-x', `${x}px`);
                targetCard.style.setProperty('--mouse-y', `${y}px`);
            });
        }, { passive: true });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Scroll Reveal Observer
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // MutationObserver: dinamik eklenen kartların scroll reveal izleyicisini yakala
    const domWatcher = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;
                const reveals = node.classList?.contains('santis-reveal')
                    ? [node] : [...node.querySelectorAll('.santis-reveal')];
                reveals.forEach(el => revealObserver.observe(el));
            });
        });
    });
    domWatcher.observe(document.body, { childList: true, subtree: true });

    // İlk yükleme: statik elemanları bağla
    document.querySelectorAll('.santis-reveal').forEach(el => revealObserver.observe(el));

    // Kuantum Işık Motorunu Başlat
    new QuantumGlareEngine();
    console.log("Sovereign OS: Quantum Glare Engine Aktif Edildi. [Zero-Jank Mode: ON]");
});

/* ─── 8. DUMMY LOADER — Eksik Modül 404 Susturucu ───────────────────────── */
(function initDummyLoaders() {
    const dummyFn = (name) => () => console.debug(`[Santis] '${name}' modülü henüz aktif değil. Dummy fallback devrede.`);
    const missingModules = [
        'santis-booking', 'booking-wizard', 'cms-image-loader', 'nuclear-cards',
        'card-effects', 'lenis-init', 'hreflang-injector', 'hreflang-loader',
        'canonical-loader', 'schema-loader', 'santis-language-sync',
        'santis-ai-chatbot', 'santis-telemetry', 'santis-chameleon',
        'santis-persuader', 'aurelia-engine'
    ];
    missingModules.forEach(mod => {
        const camelCased = mod.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        if (!window[camelCased]) window[camelCased] = dummyFn(mod);
        if (!window[mod])        window[mod]        = dummyFn(mod);
    });
    console.log('✅ [Interaction] Dummy Loader aktif. Eksik modüller susturuldu.');
})();

/* ─── 9. KERNEL ENTEGRASYON SİNYALİ ─────────────────────────────────────── */
// Kernel yükleme tamamlandığında SantisEventBus'a bildir
if (typeof SantisEventBus !== 'undefined') {
    SantisEventBus.emit('interaction:ready', { ts: performance.now() });
} else if (typeof globalThis.__SANTIS__ !== 'undefined') {
    globalThis.__SANTIS__.services.bus?.emit('interaction:ready', { ts: performance.now() });
}
console.log('⚡ [Interaction Engine v1.0] Ready.');

/**
 * SANTIS OS - MATRIX STABILIZER [PHASE 30.5]
 * Otonom Boyut Gözlemcisi & Zero-Jank Relayout Trigger
 */
class SantisMatrixStabilizer {
    constructor() {
        this.debounceTimer = null;
        
        // Donanım seviyesinde kart hacimlerini izleyen Kuantum Gözü
        this.observer = new ResizeObserver((entries) => {
            this.fireRelayoutSignal();
        });
    }

    init(cardSelector = '.bento-card-v6, .santis-card, .luxury-card') {
        const cards = document.querySelectorAll(cardSelector);
        if (cards.length > 0) {
            console.log(`👁️ [Matrix Stabilizer] ${cards.length} Kuantum Kartı dinamik gözlem altına alındı.`);
            cards.forEach(card => this.observer.observe(card));
        }

        // Dinamik olarak Data Bridge'den eklenenleri otomatik tespit etmek için (Bento Orchestrator chunkları)
        const mutObs = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.matches && node.matches(cardSelector)) {
                            this.observer.observe(node);
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll(cardSelector).forEach(c => this.observer.observe(c));
                        }
                    }
                });
            });
        });
        mutObs.observe(document.body, { childList: true, subtree: true });
    }

    fireRelayoutSignal() {
        // ZERO-JANK KORUMASI (Debounce):
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            document.dispatchEvent(new CustomEvent('matrix:recalculate'));
            console.log("⚡ [Santis OS] Fiziksel hacim değişimi saptandı (ResizeObserver). Relayout ateşlendi.");
        }, 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.SantisStabilizer = new SantisMatrixStabilizer();
    window.SantisStabilizer.init();
});

/* ─── V45 3D STACKED CAROUSEL ENGINE (COVER FLOW) ─── */
window.initCoverFlowCarousel = function() {
    const stackStages = document.querySelectorAll('.santis-carousel-stage');
    if (!stackStages || stackStages.length === 0) return; // Silent abort if not present

    stackStages.forEach((stage) => {
        // Safe Listener Purge without Detaching Virtual DOM References
        if (stage._coverFlowAborter) {
            stage._coverFlowAborter.abort();
        }
        stage._coverFlowAborter = new AbortController();
        const signal = stage._coverFlowAborter.signal;

        let isStackDragging = false;
        let stackStartX = 0;
        let activeIndex = 0;
        const stackCards = stage.querySelectorAll('.santis-stack-card');
        
        // Skip setup until the worker injects cards
        if (!stackCards || stackCards.length === 0) return;
        
        function updateSovereignStack() {
            stackCards.forEach((card, index) => {
                const diff = index - activeIndex; 
                const absDiff = Math.abs(diff);

                // Logarithmic distance calculation
                let translateX = diff * (130 - absDiff * 15); 
                let scale = 1 - (absDiff * 0.15);
                let opacity = 1 - (absDiff * 0.4);
                let zIndex = 100 - absDiff;

                if (scale < 0) scale = 0;
                if (opacity < 0) opacity = 0;

                card.style.transform = `translateX(${translateX}%) scale(${scale}) translate(var(--mx, 0px), var(--my, 0px))`;
                card.style.opacity = opacity;
                card.style.zIndex = zIndex;

                
                if (diff === 0) {
                    card.classList.add('is-active');
                    if (window.bindMagnetic) window.bindMagnetic(card);
                } else {
                    card.classList.remove('is-active');
                    if (window.magneticInstances && window.magneticInstances.has(card)) {
                        window.magneticInstances.get(card).unbind();
                        window.magneticInstances.delete(card);
                    }
                }
            });
        }

        // Initial render hook
        requestAnimationFrame(updateSovereignStack);

        // Friction Engine: Click Focus
        stackCards.forEach((card, i) => {
            card.addEventListener('click', (e) => {
                if (activeIndex === i) {
                    if (typeof 
window.triggerSovereignReveal === 'function') window.triggerSovereignReveal(card);
                } else {
                    activeIndex = i;
                    updateSovereignStack();
                }
                updateSovereignStack();
            }, { signal });
        });

        // Friction Engine: Wheel/Scroll Navigate
        stage.addEventListener('wheel', (e) => {
            e.preventDefault(); 
            if (e.deltaY > 0 && activeIndex < stackCards.length - 1) {
                activeIndex++;
                updateSovereignStack();
            } else if (e.deltaY < 0 && activeIndex > 0) {
                activeIndex--;
                updateSovereignStack();
            }
        }, { passive: false, signal });

        // Friction Engine: Drag & Swipe Momentum (Mouse + Touch)
        stage.addEventListener('mousedown', (e) => {
            isStackDragging = true;
            stackStartX = e.clientX;
        }, { signal });
        
        stage.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                isStackDragging = true;
                stackStartX = e.touches[0].clientX;
            }
        }, { passive: true, signal });
        
        stage.addEventListener('mousemove', (e) => {
            if (!isStackDragging) return;
            const diffX = e.clientX - stackStartX;
            
            // 80px drag intent limit
            if (diffX > 80) { 
                if (activeIndex > 0) {
                    activeIndex--;
                    updateSovereignStack();
                }
                isStackDragging = false; 
                stackStartX = e.clientX;
            } else if (diffX < -80) { 
                if (activeIndex < stackCards.length - 1) {
                    activeIndex++;
                    updateSovereignStack();
                }
                isStackDragging = false;
                stackStartX = e.clientX;
            }
        }, { signal });

        stage.addEventListener('touchmove', (e) => {
            if (!isStackDragging || e.touches.length === 0) return;
            const diffX = e.touches[0].clientX - stackStartX;
            
            // 80px drag intent limit
            if (diffX > 80) { 
                if (activeIndex > 0) {
                    activeIndex--;
                    updateSovereignStack();
                }
                isStackDragging = false; 
                stackStartX = e.touches[0].clientX;
            } else if (diffX < -80) { 
                if (activeIndex < stackCards.length - 1) {
                    activeIndex++;
                    updateSovereignStack();
                }
                isStackDragging = false;
                stackStartX = e.touches[0].clientX;
            }
        }, { passive: true, signal });

        stage.addEventListener('mouseup', () => { isStackDragging = false; }, { signal });
        stage.addEventListener('mouseleave', () => { isStackDragging = false; }, { signal });
        stage.addEventListener('touchend', () => { isStackDragging = false; }, { signal });
        stage.addEventListener('touchcancel', () => { isStackDragging = false; }, { signal });
    });
    
    console.log("🎡 [Interaction Engine] Sovereign 3D Carousel (Cover Flow) Multi-Stage Engaged.");
};



// ==========================================
// 🦋 SANTIS SOVEREIGN REVEAL v1.2 (STATE MACHINE & FLIP)
// ==========================================
let revealState = {
    isOpen: false,
    isAnimating: false,
    activeCard: null,
    ghostEl: null
};

// 🧭 History API - Initialize Deep Link Listener
// 🧭 History API - Initialize Deep Link (Runs on module load since DOM is likely ready)
(function initDeepLink() {
    const params = new URLSearchParams(location.search);
    const revealSlug = params.get('reveal');
    if (revealSlug) {
        // Find the card after Santis Core Boot sequence (Sovereign Engine delay)
        setTimeout(() => {
            const card = document.querySelector(`[data-reveal="${revealSlug}"]`) || document.querySelector(`[data-id="${revealSlug}"]`);
            if (card) window.triggerSovereignReveal(card, true);
        }, 1800); 
    }
})();

// 🧭 History API - Back button support
window.addEventListener('popstate', (e) => {
    if (!e.state?.reveal && revealState.isOpen) {
        window.closeSovereignReveal(true);
    }
});

// 📐 Resize Guardian - Keep Ghost Fullscreen
window.addEventListener('resize', () => {
    if (revealState.isOpen && revealState.ghostEl) {
        revealState.ghostEl.style.width = '100vw';
        revealState.ghostEl.style.height = '100vh';
    }
});

// ==========================================

// ==========================================
// 🧲 SENSORY LAYER: MAGNETIC ENGINE v1.0
// ==========================================
class SovereignMagneticEngine {
    constructor(el, strength = 0.3, radius = 120) {
        this.el = el;
        this.strength = strength;
        this.radius = radius;
        this.boundMove = this.handleMove.bind(this);
        this.boundReset = this.reset.bind(this);
        this.bind();
    }

    bind() {
        this.el.addEventListener('mousemove', this.boundMove);
        this.el.addEventListener('mouseleave', this.boundReset);
    }

    unbind() {
        this.el.removeEventListener('mousemove', this.boundMove);
        this.el.removeEventListener('mouseleave', this.boundReset);
        this.reset();
    }

    handleMove(e) {
        // Mobile Kill Switch
        if (window.matchMedia('(pointer: coarse)').matches) return;
        
        const rect = this.el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const distX = e.clientX - cx;
        const distY = e.clientY - cy;

        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance > this.radius) {
            this.reset();
            return;
        }

        const force = (1 - distance / this.radius);
        const dx = distX * force * this.strength;
        const dy = distY * force * this.strength;

        this.el.style.setProperty('--mx', `${dx}px`);
        this.el.style.setProperty('--my', `${dy}px`);
    }

    reset() {
        this.el.style.setProperty('--mx', `0px`);
        this.el.style.setProperty('--my', `0px`);
    }
}

// Global Magnetic Bind Array cache for unbinding cards
window.magneticInstances = window.magneticInstances || new Map();

// Helper to bind a single sticky element (e.g. Buttons)
window.bindMagnetic = function(el) {
    if (!el.classList.contains('santis-magnetic')) el.classList.add('santis-magnetic');
    if (!window.magneticInstances.has(el)) {
        window.magneticInstances.set(el, new SovereignMagneticEngine(el));
    }
};


// ==========================================
// 🌊 SENSORY LAYER: SOVEREIGN TICKER (MASTER LOOP) & CURSOR ENGINE v2.0
// ==========================================
class SovereignTicker {
    constructor() {
        this.inertiaElements = document.querySelectorAll('[data-inertia]');
        this.maxClamp = 60;
        
        // Cursor State
        this.cursorDot = document.getElementById('santis-cursor-dot');
        this.cursorRing = document.getElementById('santis-cursor-ring');
        this.cursorLabel = this.cursorRing ? this.cursorRing.querySelector('.santis-cursor-label') : null;
        
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.ring = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        
        this.isMobile = window.matchMedia('(pointer: coarse)').matches;
        
        this.cursorState = 'normal'; // 'normal', 'snap', 'text', 'lens'
        this.snapTarget = null;
        this.isMouseDown = false;
        
        if (!this.isMobile && this.cursorDot && this.cursorRing) {
            this.bindCursor();
        }
        
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    bindCursor() {
        // Track true mouse coordinates completely decoupled from tick rate
        window.addEventListener('mousemove', (e) => {
            if (!document.body.classList.contains('cursor-initialized')) {
                document.body.classList.add('cursor-initialized');
            }
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            // Dot is instantaneous, Zero-Latency constraint
            this.cursorDot.style.transform = `translate(calc(${this.mouse.x}px - 50%), calc(${this.mouse.y}px - 50%)) scale(${this.isMouseDown ? 0.5 : 1})`;
        });

        // ZIRH 3: Micro-Compression
        window.addEventListener('mousedown', () => {
            this.isMouseDown = true;
            this.cursorDot.style.transform = `translate(calc(${this.mouse.x}px - 50%), calc(${this.mouse.y}px - 50%)) scale(0.5)`;
        });
        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
            this.cursorDot.style.transform = `translate(calc(${this.mouse.x}px - 50%), calc(${this.mouse.y}px - 50%)) scale(1)`;
        });

        // ZIRH 2: Window Edge Death
        document.addEventListener('mouseleave', () => {
            document.body.classList.add('cursor-hidden');
        });
        document.addEventListener('mouseenter', () => {
            document.body.classList.remove('cursor-hidden');
        });
        
        // Dynamic Delegation for Hover States
        document.addEventListener('mouseover', (e) => {
            const target = e.target;
            
            // Text Detection
            if (target.matches('h1, h2, h3, p, span, blockquote')) {
                // Ignore Cover Flow elements for I-Beam or things inside buttons
                if (!target.closest('.santis-btn, .santis-magnetic, .santis-stack-card')) {
                    this.setCursorState('text');
                    return;
                }
            }

            // Magnetic Bounding Snap (The Liquid Fusion)
            const snapEl = target.closest('.santis-magnetic, .santis-btn, .hero-cta, .santis-ghost-close');
            if (snapEl) {
                this.snapTarget = snapEl;
                this.setCursorState('snap');
                return;
            }

            // Lens / Explore Hover (Cover flow cards)
            const lensEl = target.closest('.santis-stack-card:not(.is-active)');
            if (lensEl) {
                this.setCursorLabel('KEŞFET');
                this.setCursorState('lens');
                return;
            }
            
            const closeEl = target.closest('.santis-ghost-overlay');
            if (closeEl && revealState && revealState.isOpen) {
                this.setCursorLabel('KAPAT');
                this.setCursorState('lens');
                return;
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target;
            const snapEl = target.closest('.santis-magnetic, .santis-btn, .hero-cta, .santis-ghost-close');
            if (snapEl === this.snapTarget) {
                this.snapTarget = null;
                this.resetCursorStyle();
                this.setCursorState('normal');
            } else if (target.matches('h1, h2, h3, p, span, blockquote') && this.cursorState === 'text') {
                this.setCursorState('normal');
            } else if (target.closest('.santis-stack-card') || target.closest('.santis-ghost-overlay')) {
                if (this.cursorState === 'lens') {
                    this.setCursorState('normal');
                    this.setCursorLabel('');
                }
            }
        });
    }

    setCursorState(state) {
        document.body.classList.remove('cursor-text-hover', 'cursor-snap-hover', 'cursor-lens-hover');
        this.cursorState = state;
        if (state !== 'normal') {
            document.body.classList.add(`cursor-${state}-hover`);
        }
    }
    
    setCursorLabel(text) {
        if (this.cursorLabel) this.cursorLabel.textContent = text;
    }

    resetCursorStyle() {
        this.cursorRing.style.width = '';
        this.cursorRing.style.height = '';
        this.cursorRing.style.borderRadius = '';
    }

    animate() {
        // --- INERTIA COMPUTATION ---
        if (!(revealState && revealState.isOpen) && !this.isMobile) {
            const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
            this.inertiaElements.forEach(el => {
                const speed = parseFloat(el.dataset.inertia) || 0.15;
                const offset = Math.min(scrollY * speed, this.maxClamp);
                el.style.transform = `translateY(${offset}px)`;
            });
        }

        // --- CURSOR CORE COMPUTATION ---
        if (!this.isMobile && this.cursorRing) {
            let targetX = this.mouse.x;
            let targetY = this.mouse.y;
            
            // ZIRH 1: Scroll Desync Protection (Live Rect Calculation)
            if (this.cursorState === 'snap' && this.snapTarget) {
                const rect = this.snapTarget.getBoundingClientRect();
                targetX = rect.left + rect.width / 2;
                targetY = rect.top + rect.height / 2;
                
                // Inherit shape dimensions smoothly
                this.cursorRing.style.width = `${rect.width + 10}px`;
                this.cursorRing.style.height = `${rect.height + 10}px`;
                this.cursorRing.style.borderRadius = window.getComputedStyle(this.snapTarget).borderRadius;
            } else {
                this.cursorRing.style.width = '';
                this.cursorRing.style.height = '';
                this.cursorRing.style.borderRadius = '';
            }

            // Fluid LERP Physics (16ms Intent Response - approx 0.15 smoothing)
            const ease = this.cursorState === 'snap' ? 0.25 : 0.15;
            this.ring.x += (targetX - this.ring.x) * ease;
            this.ring.y += (targetY - this.ring.y) * ease;
            
            // ZIRH 3: Micro-compression matrix multiplier
            const compressionScale = this.isMouseDown ? 0.85 : 1;
            
            // Note: We use the inline width/height from the Snap logic, OR fallback to CSS dynamically.
            this.cursorRing.style.transform = `translate(calc(${this.ring.x}px - 50%), calc(${this.ring.y}px - 50%)) scale(${compressionScale})`;
        }

        requestAnimationFrame(this.animate);
    }
}

// Global hook: Execute immediately as OS Bootloader pulls this dynamically post-DOM
document.querySelectorAll('.santis-magnetic, .hero-cta').forEach(btn => {
    if (window.bindMagnetic) window.bindMagnetic(btn);
});

// Boot the Supreme Master Loop
if (!window.santisTicker) {
    window.santisTicker = new SovereignTicker();
}



// 🧬 SOVEREIGN MORPH ENGINE v2.0 (GOD-TIER FLIP)
// ==========================================
class SovereignMorphEngine {
  constructor() {
    this.activeAnimations = new Set();
    // Apple-vari fizik: Yay gibi gerilir, yumuşak oturur (Snappy but smooth)
    this.easing = 'cubic-bezier(0.32, 0.72, 0, 1)'; 
    this.duration = 600;
  }

  play(sourceCard, targetGhost) {
    // 1. Guard: Kullanıcı çılgın gibi aç/kapa yaparsa patlamaması için
    this.abort();

    const elements = sourceCard.querySelectorAll('[data-morph]');

    elements.forEach(sourceEl => {
      const key = sourceEl.dataset.morph;
      const targetEl = targetGhost.querySelector(`[data-morph="${key}"]`);
      if (!targetEl) return;

      // 2. İlk ve Son durum hesaplamaları (FIRST & LAST)
      const first = sourceEl.getBoundingClientRect();
      const last = targetEl.getBoundingClientRect();

      const dx = first.left - last.left;
      const dy = first.top - last.top;
      const dw = first.width / last.width;
      const dh = first.height / last.height;

      // 🚨 KRİTİK ZIRH 1: Matematik sapmasını önlemek için orijin sıfırlama
      targetEl.style.transformOrigin = 'top left';
      targetEl.style.willChange = 'transform, filter';

      // 🚨 KRİTİK ZIRH 2: Metin ezilmesini engelleme
      const isText = targetEl.tagName.match(/^H[1-6]$|^P$|^SPAN$|^A$/i);
      const isImage = targetEl.tagName.toLowerCase() === 'img';

      // Metinse scale yapma (1'de tut), boyut değişimi CSS font-size transition'ına kalsın
      const scaleX = isText ? 1 : dw;
      const scaleY = isText ? 1 : dh;

      // Cinematic Focus
      const startFilter = isImage ? 'blur(12px) brightness(1.2)' : 'none';

      const animation = targetEl.animate([
        {
          transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
          filter: startFilter
        },
        {
          transform: 'translate(0px, 0px) scale(1, 1)',
          filter: 'none'
        }
      ], {
        duration: this.duration,
        easing: this.easing,
        fill: 'both'
      });

      this.activeAnimations.add(animation);

      // 3. Memory Cleanup: Animasyon bitince GPU'yu rahatlat
      animation.onfinish = () => {
        targetEl.style.transformOrigin = '';
        targetEl.style.willChange = 'auto';
        this.activeAnimations.delete(animation);
      };
    });
  }

  abort() {
    this.activeAnimations.forEach(a => a.cancel());
    this.activeAnimations.clear();
  }
}

// Global kullanıma hazır
window.morphEngine = new SovereignMorphEngine();

window.triggerSovereignReveal = function(card, fromUrl = false) {
    if (revealState.isOpen || revealState.isAnimating) return;
    
    // Check if clicked card is active in the Cover Flow
    // If we clicked from DOM, interaction-engine handles activeIndex. 
    // We assume interaction-engine only calls this for active cards.
    
    revealState.isAnimating = true;
    revealState.activeCard = card;
    
    // 1. Measure the source
    const rect = card.getBoundingClientRect();
    
    // 2. Setup the Overlay
    let overlay = document.getElementById('santis-ghost-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'santis-ghost-overlay';
        overlay.className = 'santis-ghost-overlay';
        document.body.appendChild(overlay);
    }
    
    // 3. Clone the Card (Ghost)
    const ghost = card.cloneNode(true);
    ghost.className = 'santis-ghost-card';
    Object.assign(ghost.style, {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: '0',
        transform: 'translateZ(0)',
        filter: 'none',
        opacity: '1',
        zIndex: '9999'
    });
    
    revealState.ghostEl = ghost;
    
    // 4. Inject Close Button
    const closeBtn = document.createElement('div');
    closeBtn.className = 'santis-ghost-close';
    closeBtn.innerHTML = '&times;';
    ghost.appendChild(closeBtn);
        if (window.bindMagnetic) window.bindMagnetic(closeBtn);
    
    // 5. Inject Gradient
    const grad = document.createElement('div');
    grad.className = 'santis-ghost-gradient';
    ghost.appendChild(grad);
    
    document.body.appendChild(ghost);
    
    // 6. Hide Original & Lock Body
    card.classList.add('ghost-hidden');
    document.body.classList.add('ghost-active');
    
    // 7. Push History State
    if (!fromUrl) {
        const slug = card.getAttribute('data-reveal') || card.getAttribute('data-id') || 'premium-service';
        history.pushState({ reveal: slug }, '', `?reveal=${slug}`);
    }
    
    // 8. FLIP Automation (Start Expansion)
    requestAnimationFrame(() => {
        // Force Reflow
        void ghost.offsetWidth;
        
        // Target fullscreen expansion coordinates using purely GPU-accelerated parameters
        Object.assign(ghost.style, {
            width: '100vw',
            height: '100vh',
            transform: `translate(${-rect.left}px, ${-rect.top}px)`,
            borderRadius: '0'
        });
        

        // Clean up data-morph on the stale copy inside the ghost card so querySelector maps correctly to .santis-reveal-data
        ghost.querySelectorAll(':not(.santis-reveal-data) > [data-morph]').forEach(el => el.removeAttribute('data-morph'));

        overlay.classList.add('is-active');
        ghost.classList.add('is-expanded');
        
        // 🧬 IGNITE MORPH ENGINE
        window.morphEngine.play(card, ghost);

        
        // Use transitionend for deterministic lifecycle
        ghost.addEventListener('transitionend', (e) => {
            // Ensure we are responding to the primary expansion transform/width/height
            if (e.propertyName === 'transform' || e.propertyName === 'opacity') {
                revealState.isAnimating = false;
                revealState.isOpen = true;
            }
        }, { once: true });
    });
    
    closeBtn.addEventListener('click', () => window.closeSovereignReveal());
    overlay.addEventListener('click', () => window.closeSovereignReveal());
};

window.closeSovereignReveal = function(fromHistory = false) {
    if (!revealState.isOpen || revealState.isAnimating) return;
    revealState.isAnimating = true;
    
    const { ghostEl, activeCard } = revealState;
    if (!ghostEl || !activeCard) return;
    
    // 1. Re-measure the original card dynamically (handles resize/scroll shifts)
    const rect = activeCard.getBoundingClientRect();
    
    // 2. Clear History State
    if (!fromHistory) {
        history.replaceState({}, '', location.pathname);
    }
    
    let overlay = document.getElementById('santis-ghost-overlay');
    if (overlay) overlay.classList.remove('is-active');
    
    // 3. FLIP reverse (V2 Collapse)
    window.morphEngine.abort();
    
    // Smooth Native iOS exit scale
    ghostEl.style.transform = 'scale(0.95)';
    ghostEl.style.opacity = '0';
    ghostEl.style.transition = 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease-out';
    ghostEl.classList.remove('is-expanded');
    
    // 4. Cleanup on transition end
    const cleanup = (e) => {
        if (e.propertyName === 'transform' || e.propertyName === 'width') {
            ghostEl.remove();
            activeCard.classList.remove('ghost-hidden');
            document.body.classList.remove('ghost-active');
            
            revealState.isOpen = false;
            revealState.isAnimating = false;
            revealState.ghostEl = null;
            revealState.activeCard = null;
        }
    };
    
    ghostEl.addEventListener('transitionend', cleanup, { once: true });
    
    // Fallback cleanup if transition fails
    setTimeout(() => {
        if (revealState.isAnimating) {
            cleanup({ propertyName: 'width' });
        }
    }, 800);
};

// Global Esc Key Listener
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && revealState.isOpen) {
        window.closeSovereignReveal();
    }
});
// ==========================================
