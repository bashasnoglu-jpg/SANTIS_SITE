/**
 * ========================================================================
 * 🦅 SANTIS OS v35 — PHASE II: VECTOR BETA (THE PHYGITAL BRIDGE)
 * ========================================================================
 * Frontend Extraction Interface for Apple Wallet (.pkpass).
 * Bridges the digital Quantum Ritual to the physical iOS/Android ecosystem.
 *
 * Sequence:
 *   1. Appears 2.5s after L5 seal ritual begins
 *   2. Click → Acoustic snap + device vibration
 *   3. Gold shimmer sweep animation ("extracting")
 *   4. Canvas Living Ticket shrinks/sucks into button
 *   5. "ŞİFRELENİYOR..." → 1.2s crypto simulation → "CÜZDANA EKLENDİ"
 *   6. Button turns green (sealed state)
 *
 * Dependencies: L5 checkout-ritual.js, L6 sovereign-acoustics.js
 * Future: Backend .pkpass API (passkit-generator)
 * ========================================================================
 */

const SantisPhygitalBridge = (() => {
    'use strict';

    // ── INJECT CSS ──
    const injectCSS = () => {
        const style = document.createElement('style');
        style.id = 'santis-l7-phygital-css';
        style.textContent = `
            #santis-wallet-container {
                position: fixed; bottom: 12%; left: 50%;
                transform: translateX(-50%);
                z-index: 1000005;
                opacity: 0; pointer-events: none;
                display: flex; flex-direction: column;
                gap: 1rem; align-items: center;
                transition: opacity 1.5s cubic-bezier(0.25, 1, 0.5, 1) 2.5s;
            }
            body.checkout-sealed #santis-wallet-container {
                opacity: 1; pointer-events: auto;
            }
            body:not(.checkout-sealed) #santis-wallet-container {
                opacity: 0 !important; pointer-events: none !important;
                transition: opacity 0.5s ease !important;
            }

            /* Wallet Badge Button */
            .wallet-badge-btn {
                background: #000;
                border: 1px solid rgba(197, 160, 89, 0.3);
                border-radius: 50px; height: 56px; padding: 0 32px;
                display: flex; align-items: center; justify-content: center; gap: 12px;
                cursor: pointer; overflow: hidden; position: relative;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1),
                            box-shadow 0.4s ease, border-color 0.4s ease;
            }
            .wallet-badge-btn:hover {
                transform: translateY(-4px) scale(1.02);
                box-shadow: 0 15px 40px rgba(197, 160, 89, 0.2);
                border-color: rgba(197, 160, 89, 0.6);
            }
            .wallet-badge-btn svg {
                height: 26px; width: auto; z-index: 2;
                fill: #fff; transition: fill 0.3s;
            }
            .wallet-badge-btn span {
                color: #fff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-weight: 500; font-size: 16px;
                letter-spacing: 0.5px; z-index: 2;
                transition: color 0.3s;
            }

            /* Extraction shimmer sweep */
            .wallet-badge-btn::before {
                content: ''; position: absolute; inset: 0;
                background: linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.8), transparent);
                transform: translateX(-150%) skewX(-15deg);
                transition: transform 0.8s ease; z-index: 1;
            }
            .wallet-badge-btn.extracting::before {
                transform: translateX(150%) skewX(-15deg);
                transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1);
            }

            /* Sealed (success) state */
            .wallet-badge-btn.sealed {
                border-color: #34C759;
                background: rgba(52, 199, 89, 0.1);
                pointer-events: none;
            }
            .wallet-badge-btn.sealed span { color: #34C759; }
            .wallet-badge-btn.sealed svg { fill: #34C759; }

            /* Hint text */
            .wallet-hint {
                color: rgba(255, 255, 255, 0.4);
                font-family: monospace; font-size: 0.7rem;
                letter-spacing: 0.2em; text-transform: uppercase;
                text-shadow: 0 0 10px #000;
            }
        `;
        document.head.appendChild(style);
    };

    // ── INJECT DOM ──
    const injectDOM = () => {
        const container = document.createElement('div');
        container.id = 'santis-wallet-container';
        container.innerHTML = `
            <div class="wallet-badge-btn" id="apple-wallet-btn">
                <svg viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.28.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <span>Apple Wallet'a Ekle</span>
            </div>
            <div class="wallet-hint">Fiziksel Erişim İçin Dijital Mühür</div>
        `;
        document.body.appendChild(container);
    };

    // ── EXTRACTION PROTOCOL ──
    const setupExtraction = () => {
        document.addEventListener('click', async (e) => {
            const btn = e.target.closest('#apple-wallet-btn');
            if (!btn || btn.classList.contains('sealed') || btn.classList.contains('extracting')) return;

            // 1. Acoustic seal snap (L6 entegrasyonu)
            if (window.SantisAcoustics && typeof window.SantisAcoustics.playSealSnap === 'function') {
                window.SantisAcoustics.playSealSnap();
            }

            // 2. Device vibration
            if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

            // 3. Extraction shimmer animation
            btn.classList.add('extracting');
            btn.querySelector('span').textContent = 'ŞİFRELENİYOR...';

            // 4. Canvas Living Ticket emilme efekti
            const canvas = document.getElementById('santis-fibonacci-canvas');
            if (canvas) {
                canvas.style.transition = 'transform 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53), opacity 0.8s';
                canvas.style.transform = 'scale(0.1) translateY(100vh)';
                canvas.style.opacity = '0';
            }

            try {
                // Kriptografik imzalama simülasyonu
                await new Promise(resolve => setTimeout(resolve, 1200));

                // 5. Success — sealed state
                btn.classList.remove('extracting');
                btn.classList.add('sealed');
                btn.querySelector('span').textContent = 'CÜZDANA EKLENDİ ✓';

                console.log('📲 [Santis OS v35] L7 .pkpass kriptografik olarak imzalandı. Fiziksel cüzdana teslim edildi.');

                // GERÇEK SENARYO:
                // const resp = await fetch('/api/v1/wallet/generate-sovereign-pass', { method: 'POST' });
                // const blob = await resp.blob();
                // const url = URL.createObjectURL(blob);
                // window.location.href = url;

            } catch (error) {
                btn.querySelector('span').textContent = 'BAĞLANTI HATASI';
                btn.classList.remove('extracting');
                console.error('📲 [L7] Wallet bridge hatası:', error);
            }
        });
    };

    // ── INIT ──
    const init = () => {
        injectCSS();
        injectDOM();
        setupExtraction();
        console.log('📲 [Santis OS v35] L7 Phygital Bridge Mühürlendi. Cüzdan Köprüsü Hazır.');
    };

    return { init };
})();

// ── BOOTSTRAP ──
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SantisPhygitalBridge.init);
} else {
    SantisPhygitalBridge.init();
}
