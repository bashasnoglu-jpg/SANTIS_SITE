/**
 * ========================================================================
 * 🦅 SANTIS OS v35 — LAYER 8: VECTOR GAMMA (BOUTIQUE INFECTION)
 * ========================================================================
 * Ghost Injector for E-Commerce product grids. Zero DOM Mutation.
 * Transforms static product cards into "Heavy Glass Bottles".
 *
 * Features:
 *   1. Liquid Glass 3D Resonance (Hooke's Law ±6° tilt)
 *   2. Dynamic Caustic Light Sweeps (Mouse-tracked glare)
 *   3. Newtonian Micro-Magnetism (150px event horizon)
 *   4. Crystal Acoustics (2800Hz sine + 1200Hz triangle — two-layer clink)
 *   5. L1 Sigmoid integration (cart total → Sovereign Black shift)
 *
 * Zero DOM mutation. Ghost class injection on first hover.
 * Mobile: 3D effects disabled <768px. Acoustics still active.
 * ========================================================================
 */

const SantisBoutiqueInfection = (() => {
    'use strict';

    // ── SELECTORS ──
    const CARD_SELECTOR = '.boutique-item, .product-card, .santis-store-item, .wc-block-grid__product, .urun-karti, .product, .nv-matrix-card, .matrix-service-card, .santis-card';
    const BTN_SELECTOR = '.add-to-cart-btn, .single_add_to_cart_button, .boutique-buy-btn, .ajax_add_to_cart, .sepete-ekle, .buy-btn, .btn-rezervasyon';

    let audioCtx = null;

    const getAudioCtx = () => {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) audioCtx = new AC();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    };

    // ── 1. CRYSTAL ACOUSTICS (Two-layer luxury glass clink) ──
    const playCrystalClink = () => {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const t = ctx.currentTime;

        // Layer 1: Crystal chime (sine 2800→800Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2800, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.02); // Sharp attack
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35); // Delicate decay

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);

        // Layer 2: Glass-on-marble "tık" (triangle 1200→100Hz)
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(1200, t);
        clickOsc.frequency.exponentialRampToValueAtTime(100, t + 0.05);

        clickGain.gain.setValueAtTime(0.2, t);
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.start(t);
        clickOsc.stop(t + 0.1);

        // Delicate haptic (cosmetic bottle feel)
        if (navigator.vibrate) navigator.vibrate([15]);
    };

    // ── 2. INJECT STYLES ──
    const injectStyles = () => {
        if (document.getElementById('santis-l8-gamma-css')) return;
        const style = document.createElement('style');
        style.id = 'santis-l8-gamma-css';
        style.textContent = `
            /* Container 3D Setup */
            .santis-gamma-infected {
                transform-style: preserve-3d !important;
                perspective: 1200px !important;
                position: relative;
            }

            /* Glass Caustics Glare */
            .santis-gamma-glare {
                position: absolute; inset: 0;
                background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 50%);
                opacity: 0; mix-blend-mode: overlay;
                pointer-events: none; z-index: 10;
                transition: opacity 0.4s ease;
                transform: translateZ(20px);
                border-radius: inherit;
            }
            .santis-gamma-infected:hover .santis-gamma-glare { opacity: 1; }

            /* Image 3D pop-out */
            .santis-gamma-infected img {
                transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1) !important;
                will-change: transform;
            }
            .santis-gamma-infected:hover img {
                transform: translateZ(40px) scale(1.05) !important;
                filter: drop-shadow(0 20px 30px rgba(0,0,0,0.3));
            }

            /* Gold resonance on magnetized button */
            .santis-gamma-btn-hover {
                background-color: #c5a059 !important;
                color: #000 !important;
                box-shadow: 0 10px 25px rgba(197, 160, 89, 0.4) !important;
            }
        `;
        document.head.appendChild(style);
    };

    // ── 3. PHYSICS ENGINE ──
    const setupPhysics = () => {
        let lastBtnCheck = 0;

        document.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 768) return;

            const card = e.target.closest(CARD_SELECTOR);
            if (!card) return;

            // Ghost infection on first hover
            if (!card.classList.contains('santis-gamma-infected')) {
                card.classList.add('santis-gamma-infected');
                const glare = document.createElement('div');
                glare.className = 'santis-gamma-glare';
                card.appendChild(glare);
            }

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Heavy Glass Tilt: ±6°
            const tiltX = ((y - centerY) / centerY) * -6;
            const tiltY = ((x - centerX) / centerX) * 6;

            card.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
            card.style.boxShadow = '0 25px 50px rgba(0,0,0,0.15), 0 0 20px rgba(197,160,89,0.05)';
            card.style.borderColor = 'rgba(197, 160, 89, 0.3)';
            card.style.transition = 'transform 0.1s linear, box-shadow 0.2s ease, border-color 0.2s';
            card.style.zIndex = '20';

            // Glass caustic tracking
            const glare = card.querySelector('.santis-gamma-glare');
            if (glare) {
                const px = (x / rect.width) * 100;
                const py = (y / rect.height) * 100;
                glare.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.6) 0%, transparent 60%)`;
            }

            // Micro-magnetism on add-to-cart
            const now = performance.now();
            if (now - lastBtnCheck > 32) {
                lastBtnCheck = now;
                const btn = card.querySelector(BTN_SELECTOR);
                if (btn) {
                    const br = btn.getBoundingClientRect();
                    const bcx = br.left + br.width / 2;
                    const bcy = br.top + br.height / 2;
                    const dist = Math.hypot(e.clientX - bcx, e.clientY - bcy);

                    const HORIZON = 150;
                    if (dist < HORIZON) {
                        const force = Math.pow((HORIZON - dist) / HORIZON, 2);
                        const pullX = (e.clientX - bcx) * force * 0.4;
                        const pullY = (e.clientY - bcy) * force * 0.4;
                        btn.style.transform = `translate(${pullX.toFixed(1)}px, ${pullY.toFixed(1)}px) scale(${1 + force * 0.08})`;
                        btn.style.transition = 'transform 0.1s linear, background-color 0.2s, color 0.2s';
                        if (force > 0.3) btn.classList.add('santis-gamma-btn-hover');
                        else btn.classList.remove('santis-gamma-btn-hover');
                    } else {
                        btn.style.transform = 'translate(0px, 0px) scale(1)';
                        btn.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.5s';
                        btn.classList.remove('santis-gamma-btn-hover');
                    }
                }
            }
        }, { passive: true });

        // Card leave — Hooke spring-back
        document.addEventListener('mouseout', (e) => {
            const card = e.target.closest(CARD_SELECTOR);
            if (!card) return;

            card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            card.style.boxShadow = '';
            card.style.borderColor = '';
            card.style.transition = 'transform 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.7s ease, border-color 0.7s';
            card.style.zIndex = '1';

            const btn = card.querySelector(BTN_SELECTOR);
            if (btn) {
                btn.style.transform = 'translate(0px, 0px) scale(1)';
                btn.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                btn.classList.remove('santis-gamma-btn-hover');
            }
        });

        // Crystal clink on add-to-cart + L1 integration
        document.addEventListener('click', (e) => {
            const btn = e.target.closest(BTN_SELECTOR);
            if (btn) {
                getAudioCtx();
                playCrystalClink();

                // L1 Sigmoid: cart total → Sovereign Black shift
                if (window.SovereignAPI && typeof window.SovereignAPI.setCartTotal === 'function') {
                    const state = window.SovereignAPI.getState ? window.SovereignAPI.getState() : {};
                    const current = state?.lux?.cartTotal || 0;
                    window.SovereignAPI.setCartTotal(current + 85);
                    console.log('🛍️ [Santis OS v35] Mağaza ürünü sepete eklendi. Kristal akustik çaldı.');
                }
            }
        }, { capture: true });
    };

    // ── INIT ──
    const init = () => {
        ['click', 'touchstart'].forEach(evt =>
            document.addEventListener(evt, getAudioCtx, { once: true, capture: true })
        );
        injectStyles();
        setupPhysics();
        console.log('🧴 [Santis OS v35] L8 Vektör Gamma Mühürlendi. Cam Fiziği & Kristal Akustik aktif.');
    };

    return { init, playCrystalClink };
})();

// ── GLOBAL BRIDGE ──
window.SantisGamma = SantisBoutiqueInfection;

// ── BOOTSTRAP ──
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SantisBoutiqueInfection.init);
} else {
    SantisBoutiqueInfection.init();
}
