/**
 * SANTIS SOVEREIGN OS - DECOY MATRIX CONTROLLER
 * Kiosk Mode - Zero Storage - Zero Network - Sovereign Grade
 */

if (window.SantisDecoyMatrixLoaded) {
    console.warn('[Santis Decoy Matrix] Duplicate initialization prevented.');
} else {
    window.SantisDecoyMatrixLoaded = true;

    document.addEventListener('DOMContentLoaded', () => {
    // 1. Safe DOM Retrieval
    const initBtn = document.getElementById('init-btn');
    const decoyMatrix = document.getElementById('decoy-matrix');
    const decoyCards = document.querySelectorAll('.decoy-card');
    const scrambleTargets = document.querySelectorAll('.scramble-target');

    // Safe Exit Check
    if (!initBtn || !decoyMatrix) {
        console.warn('SantisDecoyMatrix: Essential DOM elements missing. Exiting gracefully.');
        return;
    }

    // A11y & Device Capabilities
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // 2. Cinematic Boot Sequence
    initBtn.addEventListener('click', () => {
        // Fade out button
        initBtn.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        initBtn.style.opacity = '0';
        initBtn.style.transform = 'translateY(-20px)';
        initBtn.style.pointerEvents = 'none';

        setTimeout(() => {
            initBtn.style.display = 'none';

            // Prepare Matrix Panel
            decoyMatrix.style.display = 'flex';
            decoyMatrix.style.transform = isReducedMotion ? 'translateY(0)' : 'translateY(20px)';

            // Trigger reflow
            void decoyMatrix.offsetWidth;

            // Fade in Matrix Panel
            decoyMatrix.style.transition = 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1), transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
            decoyMatrix.style.opacity = '1';
            decoyMatrix.style.transform = 'translateY(0)';
        }, 800);
    });

    // 3. Matrix Scramble Effect (Sovereign Style)
    const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+_-=';

    scrambleTargets.forEach(target => {
        const originalText = target.innerText;
        const hoverText = target.getAttribute('data-hover-text');
        if (!hoverText) return;

        let scrambleInterval;

        const startScramble = () => {
            if (isReducedMotion) {
                target.innerText = hoverText;
                return;
            }

            let iteration = 0;
            const targetLength = hoverText.length;

            clearInterval(scrambleInterval);

            scrambleInterval = setInterval(() => {
                target.innerText = hoverText.split('').map((letter, index) => {
                    if (index < iteration) {
                        return hoverText[index];
                    }
                    if (hoverText[index] === ' ') return ' ';
                    return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                }).join('');

                if (iteration >= targetLength) {
                    clearInterval(scrambleInterval);
                }
                iteration += 1 / 3; // Refined speed for quiet luxury feel
            }, 30);
        };

        const resetScramble = () => {
            clearInterval(scrambleInterval);
            target.innerText = originalText;
        };

        // Attach events correctly depending on device capability
        const interactionElement = target.closest('.decoy-card') || target;

        if (!isTouchDevice) {
            interactionElement.addEventListener('mouseenter', startScramble);
            interactionElement.addEventListener('mouseleave', resetScramble);
        } else {
            // Touch fallback
            interactionElement.addEventListener('touchstart', startScramble, { passive: true });
            interactionElement.addEventListener('touchend', () => {
                setTimeout(resetScramble, 2000); // Hold for 2s on mobile
            }, { passive: true });
        }
    });

    // 4. Parallax 3D Tilt Effect on Cards
    if (!isReducedMotion && !isTouchDevice) {
        decoyCards.forEach(card => {
            // Setup initial transition state
            card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Maximum rotation: 4 degrees (subtle, quiet luxury)
                const rotateX = ((y - centerY) / centerY) * -4;
                const rotateY = ((x - centerX) / centerX) * 4;

                // Keep the target class scale if active
                const isTarget = card.classList.contains('target');
                const baseScale = isTarget ? 1.05 : 1;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${baseScale}, ${baseScale}, ${baseScale})`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease';
                const isTarget = card.classList.contains('target');
                const baseScale = isTarget ? 'scale(1.05)' : 'scale(1)';
                card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) ${baseScale}`;
            });

            card.addEventListener('mouseenter', () => {
                // Remove transition to avoid lag while mouse moves
                card.style.transition = 'transform 0.1s linear, background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease';
            });
        });
    }
});
}
