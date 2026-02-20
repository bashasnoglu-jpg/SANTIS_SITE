/**
 * SCROLL OBSERVER v1.0
 * Handles "Reveal on Scroll" logic
 */

const SCROLLER = {
    observer: null,

    init() {
        // Feature Check
        if (!('IntersectionObserver' in window)) {
            // Fallback for very old browsers: just show everything
            document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('visible'));
            return;
        }

        // Setup Observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Optional: Unobserve after reveal to run only once
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1, // Trigger when 10% visible
            rootMargin: "0px 0px -50px 0px" // Offset slightly so it triggers before very bottom
        });

        // Attach to elements
        this.scan();
    },

    scan() {
        const elements = document.querySelectorAll('.reveal-on-scroll');
        elements.forEach(el => this.observer.observe(el));
        console.log(`🎬 Scroller tracking ${elements.length} elements.`);
    }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    SCROLLER.init();
});
