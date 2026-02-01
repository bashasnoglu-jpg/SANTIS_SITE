/**
 * SANTIS PREMIUM CARD INTERACTIONS v1.0
 * Features: 3D Tilt, Spotlight Follow, Smooth Animations
 */

(function () {
    'use strict';

    // --- CONFIG ---
    const CONFIG = {
        tiltMaxAngle: 8,
        tiltSpeed: 400,
        tiltGlare: true,
        tiltMaxGlare: 0.15,
        tiltPerspective: 1000,
        tiltScale: 1.02,
        spotlightEnabled: true
    };

    // --- INIT ON DOM READY ---
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        console.log('🎨 Santis Card Effects v1.0: Initializing...');

        // Get all premium cards
        const cards = document.querySelectorAll('.nv-card, .nv-card-service, .nv-card-product, article.nv-card, .prod-card-v2');

        if (cards.length === 0) {
            console.log('⚠️ No cards found');
            return;
        }

        console.log(`✅ Found ${cards.length} cards`);

        // Apply effects to each card
        cards.forEach((card, index) => {
            setupSpotlight(card);
            setupTilt(card);

            // Staggered entrance animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';

            setTimeout(() => {
                card.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 + (index * 80));
        });

        console.log('🏆 Card effects initialized!');
    }

    // --- SPOTLIGHT EFFECT ---
    function setupSpotlight(card) {
        if (!CONFIG.spotlightEnabled) return;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            card.style.setProperty('--mouse-x', `${x}%`);
            card.style.setProperty('--mouse-y', `${y}%`);
        });

        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--mouse-x', '50%');
            card.style.setProperty('--mouse-y', '50%');
        });
    }

    // --- 3D TILT EFFECT ---
    function setupTilt(card) {
        // Check if vanilla-tilt is available
        if (typeof VanillaTilt !== 'undefined') {
            VanillaTilt.init(card, {
                max: CONFIG.tiltMaxAngle,
                speed: CONFIG.tiltSpeed,
                glare: CONFIG.tiltGlare,
                'max-glare': CONFIG.tiltMaxGlare,
                perspective: CONFIG.tiltPerspective,
                scale: CONFIG.tiltScale,
                gyroscope: false
            });
            card.setAttribute('data-tilt', '');
        } else {
            // Fallback: Pure CSS/JS tilt
            setupFallbackTilt(card);
        }
    }

    // --- FALLBACK TILT (No Library) ---
    function setupFallbackTilt(card) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;

            const rotateX = (mouseY / (rect.height / 2)) * -CONFIG.tiltMaxAngle;
            const rotateY = (mouseX / (rect.width / 2)) * CONFIG.tiltMaxAngle;

            card.style.transform = `
                perspective(${CONFIG.tiltPerspective}px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                scale3d(${CONFIG.tiltScale}, ${CONFIG.tiltScale}, ${CONFIG.tiltScale})
            `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    }

    // --- SCROLL REVEAL (Intersection Observer) ---
    function setupScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.nv-card, .nv-card-service').forEach(card => {
            observer.observe(card);
        });
    }

    // Expose to global scope if needed
    window.SantisCardEffects = {
        init: init,
        config: CONFIG
    };

})();
