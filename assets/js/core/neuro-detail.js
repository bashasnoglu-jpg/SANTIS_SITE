/**
 * ========================================================================
 * 🦅 SANTIS OS v32 — L3 NEURO-DETAIL INJECTOR
 * ========================================================================
 * Ghost Module: Sleeps until user touches the UI, then awakens.
 * Zero DOM mutation. Pure event delegation + CSS variable whispering.
 *
 * Features:
 *   1. Liquid Metal Cards (Hooke's Law 3D tilt + spring recoil)
 *   2. Biometric Scanner (golden laser overlay on product images)
 *   3. Newtonian Button Magnetism (Inverse Square Law gravity)
 * ========================================================================
 */

const SantisL3Injector = (() => {
    'use strict';

    // ── INVERSE SQUARE LAW (Gravity Well) ─────────────
    const gravity = (dist, radius) => Math.max(0, Math.pow((radius - dist) / radius, 2));

    // ── CARD SELECTORS (matches your existing class names) ──
    const CARD_SELECTOR = '.option-card, .santis-config-option, .variant-box, .santis-card, .nv-matrix-card, .matrix-service-card';
    const IMG_CONTAINER_SELECTOR = '.config-left, .product-image-container, .modal-image, .nv-hero-card';
    const BUY_BTN_SELECTOR = '.buy-btn, #main-buy-btn, .add-to-cart, #apex-btn, .btn-rezervasyon, .sovereign-rituals-cta';

    const init = () => {
        // ── 1. LIQUID METAL CARDS (Hooke's Law 3D Tilt) ───────
        document.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 768) return; // Mobile guard

            const card = e.target.closest(CARD_SELECTOR);

            if (card) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Hooke's Law: -8° to +8° 3D bending based on mouse position
                const tiltX = ((y - centerY) / centerY) * -8;
                const tiltY = ((x - centerX) / centerX) * 8;

                card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(1)}deg) rotateY(${tiltY.toFixed(1)}deg) scale3d(1.03, 1.03, 1.03)`;
                card.style.transition = 'transform 0.1s linear, box-shadow 0.2s ease';
                card.style.zIndex = '10';
                card.style.boxShadow = '0 20px 40px rgba(197, 160, 89, 0.15)';

                // Biometric scanner: activate on nearest image container
                const imgContainer = document.querySelector(IMG_CONTAINER_SELECTOR);
                if (imgContainer && !imgContainer.classList.contains('neuro-scanner-active')) {
                    imgContainer.classList.add('neuro-scanner-active');
                }
            } else {
                // Deactivate scanner when not hovering cards
                const activeScanner = document.querySelector('.neuro-scanner-active');
                if (activeScanner) activeScanner.classList.remove('neuro-scanner-active');
            }
        }, { passive: true });

        // Hooke's Spring Recoil on mouse leave
        document.addEventListener('mouseout', (e) => {
            const card = e.target.closest(CARD_SELECTOR);
            if (card) {
                // Damped spring oscillation (cubic-bezier overshoot)
                card.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.6s ease';
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                card.style.zIndex = '1';
                card.style.boxShadow = '';
            }
        });

        // ── 2. NEWTONIAN BUTTON MAGNETISM (Inverse Square) ──
        let lastBtnCheck = 0;
        document.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 768) return;

            // Throttle: check every 32ms (~30Hz) for button gravity
            const now = performance.now();
            if (now - lastBtnCheck < 32) return;
            lastBtnCheck = now;

            const btn = document.querySelector(BUY_BTN_SELECTOR);
            if (!btn || btn.offsetParent === null) return;

            const rect = btn.getBoundingClientRect();
            const btnCX = rect.left + rect.width / 2;
            const btnCY = rect.top + rect.height / 2;
            const dist = Math.hypot(e.clientX - btnCX, e.clientY - btnCY);

            const HORIZON = 250; // Event Horizon radius in px

            if (dist < HORIZON) {
                const force = gravity(dist, HORIZON);

                // Pull button toward cursor (max 40% displacement)
                const pullX = (e.clientX - btnCX) * force * 0.4;
                const pullY = (e.clientY - btnCY) * force * 0.4;
                const scale = 1 + (force * 0.05);

                btn.style.transition = 'transform 0.1s linear, box-shadow 0.2s ease';
                btn.style.transform = `translate(${pullX.toFixed(1)}px, ${pullY.toFixed(1)}px) scale(${scale.toFixed(3)})`;

                // Gold glow at close range
                if (force > 0.3) {
                    btn.style.boxShadow = `0 15px 40px rgba(197, 160, 89, ${force.toFixed(2)})`;
                }
            } else {
                // Spring back to aristocratic rest
                if (btn.style.transform !== '') {
                    btn.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s ease';
                    btn.style.transform = '';
                    btn.style.boxShadow = '';
                }
            }
        }, { passive: true });

        console.log('🧬 [Santis OS v32] L3 Neuro-Detail Studio Mühürlendi. Sıvı Metal + Biyometrik Tarayıcı + Çekim Ufku Aktif.');
    };

    return { init };
})();

// ── BOOTSTRAP ─────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SantisL3Injector.init);
} else {
    SantisL3Injector.init();
}
