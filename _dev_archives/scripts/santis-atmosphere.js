/**
 * 🎬 SANTIS ATMOSPHERE ENGINE v2.0
 * "Alive" text reveals and breathing visuals.
 * Replaces legacy santis-reveal.js
 */

class SantisAtmosphere {
    constructor() {
        this.observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        this.init();
    }

    init() {
        // console.log("☁️ [Atmosphere] Breathing life into the DOM...");

        // 1. Prepare Text Staggers (Split into words)
        const textElements = document.querySelectorAll('.reveal-text-src');
        textElements.forEach(el => this.splitText(el));

        // 2. Setup Observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.play(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, this.observerOptions);

        // 3. Observe Targets
        // .reveal-text-src becomes .reveal-text after split
        // .reveal-breath for images
        // Legacy support: .reveal-up, .reveal-fade
        const targets = document.querySelectorAll('.reveal-text, .reveal-breath, .reveal-up, .reveal-fade, .santis-quote');
        targets.forEach(el => this.observer.observe(el));
    }

    splitText(el) {
        if (el.dataset.split) return; // Prevent double split
        el.dataset.split = "true";
        el.classList.add('reveal-text');
        el.classList.remove('reveal-text-src'); // Swap class to mark ready

        const text = el.textContent.trim();
        const words = text.split(/\s+/);

        el.innerHTML = ''; // Clear

        words.forEach((word, index) => {
            const span = document.createElement('span');
            span.textContent = word + ' '; // Add space back
            span.className = 'reveal-word';
            span.style.transitionDelay = `${index * 50}ms`; // Raindrop delay
            el.appendChild(span);
        });
    }

    play(el) {
        el.classList.add('active');

        // If it's a wrapper of words, trigger children (handled via CSS .active cascading? No, we need explicit triggering if parent is the observer target but children animate)
        // CSS Approach in santis-motion.css: .reveal-word has transition, .reveal-text doesn't change much but we can rely on inheritance or just add active to children.

        // Actually, easiest is: Parent gets .active, CSS selector `.reveal-text.active .reveal-word { ... }`
        // checking santis-motion.css...
        // .reveal-word.active defines the end state. 
        // So we need to propagate .active to children OR change CSS to `.reveal-text.active .reveal-word`

        // Let's force children active for maximum control
        const children = el.querySelectorAll('.reveal-word');
        children.forEach(child => child.classList.add('active'));
    }
}

// Initialize
window.SantisAtmosphere = new SantisAtmosphere();
