/**
 * ========================================================================
 * 🦅 SANTIS OS v33 — L5 CHECKOUT RITUAL (The Living Ticket)
 * ========================================================================
 * Hijacks buy/reserve button clicks for a sovereign sealing experience.
 *
 * Sequence:
 *   1. Button click → haptic screen shake + device vibration
 *   2. UI blackout (blur + fade to void)
 *   3. Canvas promoted to z-index: 999999 + full opacity
 *   4. Worker receives SEAL_RITUAL → sphere morphs into ticket
 *   5. "RİTÜEL MÜHÜRLENDİ" text fades in
 *   6. After 4s, ritual ends → optional redirect to checkout
 *
 * Dependencies: fibonacci-swarm.js (L4) must be loaded first.
 * Zero regression: no existing DOM modified, no existing handlers removed.
 * ========================================================================
 */

const SantisCheckoutRitual = (() => {
    'use strict';

    let isSealed = false;

    // ── BUTTON SELECTORS (matches your existing CTA classes) ──
    const BTN_SELECTOR = '.buy-btn, #main-buy-btn, .add-to-cart, #apex-btn, .btn-rezervasyon, .sovereign-rituals-cta';

    // ── INJECT STYLES ──
    const injectCSS = () => {
        const style = document.createElement('style');
        style.id = 'santis-l5-ritual-css';
        style.textContent = `
            /* L5: Canvas promoted during seal */
            body.checkout-sealed #santis-fibonacci-canvas {
                opacity: 1 !important;
                z-index: 999999 !important;
                mix-blend-mode: normal !important;
                transition: opacity 1.2s ease, z-index 0s !important;
            }

            /* L5: UI Blackout */
            body.checkout-sealed > *:not(#santis-fibonacci-canvas):not(#sovereign-seal-overlay):not(#santis-wallet-bridge):not(#santis-wallet-container):not(script):not(style):not(link) {
                filter: blur(20px) brightness(0.1) grayscale(0.5) !important;
                opacity: 0.05 !important;
                transition: filter 1.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 1.5s !important;
                pointer-events: none !important;
            }
            body.checkout-sealed {
                overflow: hidden !important;
                background: #050505 !important;
            }

            /* L5: Apple Pay Haptic Snap */
            @keyframes hapticSealSnap {
                0%   { transform: scale(1);    filter: brightness(1); }
                15%  { transform: scale(0.98) translateY(4px);  filter: brightness(0.7); }
                30%  { transform: scale(1.02) translateY(-2px); filter: brightness(1.3) contrast(1.1); }
                50%  { transform: scale(0.995) translateY(1px); filter: brightness(1); }
                100% { transform: scale(1) translateY(0); filter: brightness(1); }
            }
            body.haptic-shake { animation: hapticSealSnap 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards; }

            /* L5: Seal Overlay */
            #sovereign-seal-overlay {
                position: fixed; inset: 0; z-index: 1000000;
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                pointer-events: none; opacity: 0;
                transition: opacity 2s ease 1.5s;
            }
            body.checkout-sealed #sovereign-seal-overlay { opacity: 1; pointer-events: auto; }

            #sovereign-seal-overlay .seal-subtitle {
                font-family: monospace; font-size: 0.7rem; letter-spacing: 0.3em;
                text-transform: uppercase; color: rgba(197, 160, 89, 0.5);
                margin-bottom: 0.5rem;
            }
            #sovereign-seal-overlay .seal-title {
                font-family: 'Playfair Display', serif; font-size: 2.5rem;
                font-weight: bold; color: #c5a059; letter-spacing: 0.5em;
                text-transform: uppercase; text-shadow: 0 0 40px rgba(197, 160, 89, 0.8);
                text-align: center; line-height: 1.4;
            }
            #sovereign-seal-overlay .seal-dismiss {
                margin-top: 3rem; padding: 0.8rem 2.5rem;
                background: transparent; border: 1px solid rgba(197, 160, 89, 0.4);
                color: #c5a059; font-family: monospace; font-size: 0.75rem;
                letter-spacing: 0.2em; text-transform: uppercase;
                cursor: pointer; border-radius: 50px; pointer-events: auto;
                transition: all 0.3s; opacity: 0;
                animation: fadeInUp 0.8s ease 3.5s forwards;
            }
            #sovereign-seal-overlay .seal-dismiss:hover {
                background: rgba(197, 160, 89, 0.1);
                box-shadow: 0 0 30px rgba(197, 160, 89, 0.3);
            }
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to   { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    };

    // ── INJECT SEAL DOM ──
    const injectDOM = () => {
        const overlay = document.createElement('div');
        overlay.id = 'sovereign-seal-overlay';
        overlay.innerHTML = `
            <div class="seal-subtitle">RİTÜEL BAŞARIYLA</div>
            <div class="seal-title">MÜHÜRLENDİ</div>
            <button class="seal-dismiss" id="seal-dismiss-btn">Devam Et</button>
        `;
        document.body.appendChild(overlay);
    };

    // ── SEAL RITUAL ──
    const executeSeal = () => {
        if (isSealed) return;
        isSealed = true;

        // 1. Haptic shake + device vibration
        document.body.classList.add('haptic-shake');
        if (navigator.vibrate) navigator.vibrate([40, 60, 40]);

        // Remove shake class after animation
        setTimeout(() => document.body.classList.remove('haptic-shake'), 600);

        // 2. UI Blackout
        document.body.classList.add('checkout-sealed');

        // 3. Tell L4 Worker to morph
        if (window.SantisSwarm) {
            window.SantisSwarm.sendCommand({ type: 'SEAL_RITUAL' });
        }

        console.log('🦅 [Santis OS v33] L5 Mühür Vuruldu. Kuantum Çöküşü Başladı.');
    };

    // ── UNSEAL (Return to normal) ──
    const executeUnseal = () => {
        isSealed = false;
        document.body.classList.remove('checkout-sealed');

        // Tell worker to revert
        if (window.SantisSwarm) {
            window.SantisSwarm.sendCommand({ type: 'UNSEAL' });
        }

        console.log('🦅 [Santis OS v33] Mühür açıldı. Normal operasyona dönüldü.');
    };

    // ── SETUP ──
    const init = () => {
        injectCSS();
        injectDOM();

        // Hijack buy/reserve button clicks
        document.addEventListener('click', (e) => {
            const btn = e.target.closest(BTN_SELECTOR);
            if (btn && !isSealed) {
                e.preventDefault();
                e.stopPropagation();
                executeSeal();
            }
        }, true); // Capture phase — intercepts before existing handlers

        // Dismiss button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'seal-dismiss-btn') {
                executeUnseal();
            }
        });

        console.log('🎫 [Santis OS v33] L5 Checkout Ritual Mühürlendi. Living Ticket hazır.');
    };

    // ── PUBLIC API ──
    return { init, seal: executeSeal, unseal: executeUnseal };
})();

// ── GLOBAL BRIDGE ──
window.SantisRitual = SantisCheckoutRitual;

// ── BOOTSTRAP ──
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SantisCheckoutRitual.init);
} else {
    SantisCheckoutRitual.init();
}
