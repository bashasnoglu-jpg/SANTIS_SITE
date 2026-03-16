/**
 * SANTIS REVEAL ENGINE v1.0 (Cinematic Entrance)
 * Handles scroll-triggered animations using IntersectionObserver.
 * "Quiet Luxury" philosophy: Slow, smooth, barely noticeable but felt.
 */

class SantisReveal {
    constructor() {
        this.options = {
            root: null, // viewport
            rootMargin: '0px',
            threshold: 0.15 // Trigger when 15% visible
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animate(entry.target);
                    this.observer.unobserve(entry.target); // Play once
                }
            });
        }, this.options);

        this.init();
    }

    init() {
        console.log("🎬 [Santis Reveal] Scene Director Active.");

        // Scan for elements
        // We can either look for explicit .reveal classes OR auto-tag certain elements
        const targets = document.querySelectorAll('.reveal-up, .reveal-fade, .reveal-left, .reveal-right, .reveal-zoom');

        targets.forEach(el => {
            // Set initial state (opacity 0 handled in CSS to avoid FOUC)
            this.observer.observe(el);
        });

        // Auto-tagging (Optional - for legacy content without classes)
        // Uncomment to auto-animate all H2s
        /*
        document.querySelectorAll('h2:not(.revealed)').forEach(el => {
            el.classList.add('reveal-up');
            this.observer.observe(el);
        });
        */
    }

    animate(element) {
        // Add class to trigger CSS transition
        element.classList.add('active');

        // Stagger handling for children
        if (element.classList.contains('reveal-stagger')) {
            const children = element.children;
            Array.from(children).forEach((child, index) => {
                child.style.transitionDelay = `${index * 100}ms`;
                child.classList.add('active');
            });
        }
    }

    // Manual trigger for dynamic content
    refresh() {
        this.init();
    }
}

// Global Export
window.SantisReveal = SantisReveal;

// Auto-Launch if not in Admin
document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('/admin/')) {
        window.SantisRevealEngine = new SantisReveal();
    }
});
