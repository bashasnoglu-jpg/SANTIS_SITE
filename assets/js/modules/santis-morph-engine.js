/**
 * ═══════════════════════════════════════════════════════════
 * ⚡ SANTIS SPATIAL UI MORPH ENGINE (Phase Q)
 * ═══════════════════════════════════════════════════════════
 * Kaptan's Production-Ready Blueprint:
 * 1. 5-State Machine Lock (IDLE, PRE_EXPAND, EXPANDING, EXPANDED, CLOSING)
 * 2. AI Intent Prediction (Dwell Time & Vector Analysis)
 * 3. Bungee Fling Physics (Apple Rubber-Banding)
 * 4. Context Memory (Zero-Jank Scroll Restoration)
 * 5. Multi-Card Depth Blur
 */
/* ─── 0. LOOSE AUGMENTATION SHIELD ────────── */
var SantisMorphEngine = (function(engine) {
    if (typeof engine === 'function' && engine.name === 'SantisMorphEngine') return engine; // Phase A Guard

    const MORPH_STATES = {
        IDLE: 'IDLE',
    PRE_EXPAND: 'PRE_EXPAND',
    EXPANDING: 'EXPANDING',
    EXPANDED: 'EXPANDED',
    CLOSING: 'CLOSING'
};

class SantisMorphEngine {
    constructor() {
        this.state = MORPH_STATES.IDLE;
        this.activeTrigger = null;
        this.ghostNode = null;
        this.overlayNode = null;
        
        // AI Intent Tracking
        this.intentTimer = null;
        this.dwellThreshold = 120; // 120ms to trigger PRE_EXPAND
        
        // Physics Engine
        this.touchStartY = 0;
        this.touchCurrentY = 0;
        this.touchStartTime = 0;
        this.isSwiping = false;

        this.initEventListeners();
        this.initDeepLink();
        
        console.log("🌌 [Morph Engine] Spatial UI 5-State Machine Kalkanı Devrede.");
    }

    initDeepLink() {
        const params = new URLSearchParams(location.search);
        const revealSlug = params.get('reveal');
        if (revealSlug) {
            setTimeout(() => {
                const trigger = document.querySelector(`[data-reveal="${revealSlug}"]`) || document.querySelector(`[data-id="${revealSlug}"]`);
                if (trigger) this.openMorph(trigger, true);
            }, 1800); // OS Boot Delay
        }
    }

    initEventListeners() {
        // Event Delegation for predictive hover and clicks
        document.addEventListener('pointerenter', this.handlePointerEnter.bind(this), true);
        document.addEventListener('pointerleave', this.handlePointerLeave.bind(this), true);
        document.addEventListener('click', this.handleClick.bind(this), true);
        
        // History Pop (Back button)
        window.addEventListener('popstate', (e) => {
            if (!e.state?.reveal && this.state === MORPH_STATES.EXPANDED) {
                this.closeMorph(true);
            }
        });

        // Resize Guard
        window.addEventListener('resize', () => {
            if (this.state === MORPH_STATES.EXPANDED && this.ghostNode) {
                this.ghostNode.style.width = '100vw';
                this.ghostNode.style.height = '100vh';
            }
        });
        
        // Esc Key Guard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state === MORPH_STATES.EXPANDED) {
                this.closeMorph();
            }
        });
    }

    // ─── 1. AI INTENT PREDICTION (PRE_EXPAND) ─────────────
    handlePointerEnter(e) {
        if (!e.target || !e.target.closest) return;
        
        const trigger = e.target.closest('.santis-ghost-trigger, [data-reveal]');
        if (!trigger) return;

        // Clear existing intent
        clearTimeout(this.intentTimer);
        
        // Dwell Time Prediction (120ms)
        this.intentTimer = setTimeout(() => {
            if (this.state === MORPH_STATES.IDLE) {
                this.state = MORPH_STATES.PRE_EXPAND;
                trigger.style.transform = 'scale(1.02)';
                trigger.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                trigger.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.5)';
                
                // Intent Bus Sinyali (Kuantum ön-yükleme tetikleyicisi)
                window.dispatchEvent(new CustomEvent('morph:intent_locked', { detail: { target: trigger } }));
            }
        }, this.dwellThreshold);
    }

    handlePointerLeave(e) {
        if (!e.target || !e.target.closest) return;
        const trigger = e.target.closest('.santis-ghost-trigger, [data-reveal]');
        if (!trigger) return;
        
        clearTimeout(this.intentTimer);
        if (this.state === MORPH_STATES.PRE_EXPAND) {
            this.state = MORPH_STATES.IDLE;
            trigger.style.transform = '';
            trigger.style.boxShadow = '';
            window.dispatchEvent(new CustomEvent('morph:intent_aborted', { detail: { target: trigger } }));
        }
    }

    // ─── 2. EXPANDING STATE (Cinematic Boot) ─────────────
    async handleClick(e) {
        if (!e.target || !e.target.closest) return;
        const trigger = e.target.closest('.santis-ghost-trigger, [data-reveal]');
        if (!trigger) return;
        
        // Bazen linklere tıklanır, engelle
        e.preventDefault();
        
        if (this.state !== MORPH_STATES.IDLE && this.state !== MORPH_STATES.PRE_EXPAND) {
            console.warn("🛑 [Morph Engine] Strict Guard: Zaten işlem sürüyor.");
            return;
        }

        await this.openMorph(trigger);
    }

    async openMorph(sourceEl, fromUrl = false) {
        this.state = MORPH_STATES.EXPANDING;
        this.activeTrigger = sourceEl;

        // 1. Context Memory (Scroll Y)
        this.contextScrollY = window.scrollY;

        // 2. Measure Orijinal Koordinatlar
        const rect = sourceEl.getBoundingClientRect();
        
        // Faz M: Ağır DOM okumalarından sonra ekrana Paint payı bırak (Zero CLS)
        if (window.yieldToMain) await window.yieldToMain();
        
        // 3. Multi-card Depth Blur (Arka planı ve diğer kartları bulanıklaştır)
        document.body.classList.add('morph-active-depth');
        sourceEl.classList.add('morph-hidden-source');

        // 4. Overlay Inject
        if (!this.overlayNode) {
            this.overlayNode = document.createElement('div');
            this.overlayNode.className = 'santis-morph-overlay';
            this.overlayNode.addEventListener('click', () => this.closeMorph());
            document.body.appendChild(this.overlayNode);
        }

        // 5. Ghost Node Clone & CSS Inject
        this.ghostNode = sourceEl.cloneNode(true);
        this.ghostNode.className = 'santis-morph-ghost';
        Object.assign(this.ghostNode.style, {
            position: 'fixed',
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            margin: '0',
            zIndex: '9999',
            opacity: '1',
            transform: 'translateZ(0) scale(1)',
            filter: 'none',
            transformOrigin: 'top left',
            willChange: 'transform, width, height, border-radius'
        });

        // 6. Close Button Inject
        const closeBtn = document.createElement('div');
        closeBtn.className = 'santis-ghost-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.closeMorph(); });
        this.ghostNode.appendChild(closeBtn);

        document.body.appendChild(this.ghostNode);

        // 7. URL History push
        if (!fromUrl) {
            const slug = sourceEl.getAttribute('data-reveal') || sourceEl.id || 'service';
            history.pushState({ reveal: slug }, '', `?reveal=${slug}`);
        }

        // 8. ANIMATION (FLIP)
        requestAnimationFrame(() => {
            void this.ghostNode.offsetWidth; // Reflow
            
            // Overlay Ac
            this.overlayNode.classList.add('is-active');

            // Hedef Fullscreen
            Object.assign(this.ghostNode.style, {
                transition: 'transform 0.6s cubic-bezier(0.32, 0.72, 0, 1), width 0.6s cubic-bezier(0.32, 0.72, 0, 1), height 0.6s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.6s',
                width: '100vw',
                height: '100vh',
                top: '0px',
                left: '0px',
                transform: `translate(${-rect.left}px, ${-rect.top}px)`,
                borderRadius: '0px'
            });

            // Gelişmiş İçerik Morfu (İç resim ve yazılar)
            this.ghostNode.classList.add('morph-expanded-mode');

            // 9. Transition End Lock -> EXPANDED
            const onExpandEnd = (e) => {
                if (e.propertyName !== 'transform' && e.propertyName !== 'width') return;
                this.ghostNode.removeEventListener('transitionend', onExpandEnd);
                
                if (this.state === MORPH_STATES.EXPANDING) {
                    this.state = MORPH_STATES.EXPANDED;
                    console.log("✅ [Morph Engine] State -> EXPANDED. Etkileşime açık.");
                    this.bindBungeePhysics();
                }
            };
            this.ghostNode.addEventListener('transitionend', onExpandEnd);
        });
    }

    // ─── 3. BUNGEE PHYSICS & SWIPE FING (EXPANDED) ─────────────
    bindBungeePhysics() {
        if (!this.ghostNode) return;

        this.ghostNode.addEventListener('touchstart', (e) => {
            if (this.state !== MORPH_STATES.EXPANDED) return;
            
            // Eğer içeriği scroll ediyorsa, bunge'ye izin verme
            if (!e.target || !e.target.closest) return;
            const scrollable = e.target.closest('.morph-scrollable-content');
            if (scrollable && scrollable.scrollTop > 0) return;

            this.touchStartY = e.touches[0].clientY;
            this.touchStartTime = performance.now();
            this.isSwiping = true;
            this.ghostNode.style.transition = 'none'; // Kinetik takip için transiton kapat
        }, { passive: true });

        this.ghostNode.addEventListener('touchmove', (e) => {
            if (!this.isSwiping || this.state !== MORPH_STATES.EXPANDED) return;
            
            this.touchCurrentY = e.touches[0].clientY;
            const deltaY = this.touchCurrentY - this.touchStartY;
            
            // Sadece aşağı swipe
            if (deltaY > 0) {
                // Apple Bungee Logarithmic Dampening Formula
                const d = window.innerHeight;
                const c = 0.55;
                const bungee = (1.0 - (1.0 / ((deltaY * c / d) + 1.0))) * d;
                
                this.ghostNode.style.transform = `translateY(${bungee}px) scale(${1 - (bungee / d) * 0.1})`;
                this.overlayNode.style.opacity = Math.max(0, 1 - (deltaY / d));
            }
        }, { passive: true });

        this.ghostNode.addEventListener('touchend', () => {
            if (!this.isSwiping || this.state !== MORPH_STATES.EXPANDED) return;
            this.isSwiping = false;

            const deltaY = this.touchCurrentY - this.touchStartY;
            const deltaTime = Math.max(1, performance.now() - this.touchStartTime);
            const velocity = deltaY / deltaTime; // Fling hızı (px/ms)

            if (deltaY > 0) {
                if (velocity > 1.2 || deltaY > window.innerHeight * 0.25) {
                    // FLING TETİKLENDİ: CLOSING
                    this.closeMorph(false, velocity > 2.0 ? 300 : 500);
                } else {
                    // YETERSİZ GÜÇ: SNAP BACK (Yaylanarak geri dön)
                    this.ghostNode.style.transition = 'transform 0.5s cubic-bezier(0.32, 1.25, 0.32, 1)';
                    this.ghostNode.style.transform = 'translateY(0) scale(1)';
                    this.overlayNode.style.transition = 'opacity 0.5s ease';
                    this.overlayNode.style.opacity = '1';

                    setTimeout(() => {
                        if (this.ghostNode) this.ghostNode.style.transition = '';
                        if (this.overlayNode) this.overlayNode.style.transition = '';
                    }, 500);
                }
            }
        });
    }

    // ─── 4. CLOSING STATE (Context Memory Restore) ─────────────
    async closeMorph(fromHistory = false, duration = 500) {
        if (this.state !== MORPH_STATES.EXPANDED) return;
        this.state = MORPH_STATES.CLOSING;

        if (!fromHistory) {
            history.replaceState({}, '', location.pathname);
        }

        // DOM Measure before shrink (in case user scrolled or resized)
        const rect = this.activeTrigger.getBoundingClientRect();

        this.overlayNode.classList.remove('is-active');
        this.ghostNode.classList.remove('morph-expanded-mode');
        
        // Faz M: DOM ölçümlerinden sonra Thread'i boşalt
        if (window.yieldToMain) await window.yieldToMain();

        requestAnimationFrame(() => {
            Object.assign(this.ghostNode.style, {
                transition: `transform ${duration}ms cubic-bezier(0.32, 0.72, 0, 1), width ${duration}ms, height ${duration}ms, opacity ${duration}ms ease`,
                transform: `translate(${-rect.left}px, ${-rect.top}px) scale(0.95)`,
                opacity: '0'
            });

            const onShrinkEnd = (e) => {
                if (e.propertyName !== 'transform' && e.propertyName !== 'opacity') return;
                this.ghostNode.removeEventListener('transitionend', onShrinkEnd);

                // Garbage Collection & Restorasyon
                this.ghostNode.remove();
                this.ghostNode = null;
                
                this.activeTrigger.classList.remove('morph-hidden-source');
                document.body.classList.remove('morph-active-depth');
                this.activeTrigger.style.transform = ''; // Clear scaled intents

                // Context Memory Scroll Check (Zero-Jank Restorasyon)
                if (Math.abs(window.scrollY - this.contextScrollY) > 5) {
                    window.scrollTo({ top: this.contextScrollY, behavior: 'instant' });
                }

                this.state = MORPH_STATES.IDLE;
                this.activeTrigger = null;
                console.log("♻️ [Morph Engine] State -> IDLE. Bellek temizlendi.");
            };

            this.ghostNode.addEventListener('transitionend', onShrinkEnd);
            
            // Failsafe GC Lock in case transition is interrupted
            setTimeout(() => { if (this.state === MORPH_STATES.CLOSING) onShrinkEnd({propertyName: 'transform'}); }, duration + 100);
        });
    }
}

    return SantisMorphEngine;
})(window.SantisMorphEngine || {});

// OS Singleton Export
window.SovereignMorphEngine = window.SovereignMorphEngine || new SantisMorphEngine();
