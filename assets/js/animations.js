
/**
 * SANTIS - Cinematic Motions
 * Handles scroll-triggered animations and reveals.
 */

// Global Observer Reference
let globalObserver;

window.NV_InitAnimations = function () {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    if (!globalObserver) {
        globalObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    globalObserver.unobserve(entry.target); // Play once per session
                }
            });
        }, observerOptions);
    }

    const revealElements = document.querySelectorAll('.reveal-on-scroll:not(.visible)');
    revealElements.forEach(el => globalObserver.observe(el));
};

document.addEventListener('DOMContentLoaded', () => {
    window.NV_InitAnimations();
    // Re-check after small delay for lazy rendered items
    setTimeout(window.NV_InitAnimations, 500);
});
