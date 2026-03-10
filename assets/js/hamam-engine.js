class HamamEngine {

    init() {
        this.cards = document.querySelectorAll(".bento-card");
        if (this.cards.length === 0) return;

        console.log("[HamamEngine] V10 Sovereign Engine Booted. Cards found:", this.cards.length);
        this.initScroll();
    }

    initScroll() {
        // Ensure GSAP and ScrollTrigger are available natively.
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn("[HamamEngine] GSAP or ScrollTrigger missing.");
            return;
        }

        gsap.utils.toArray(this.cards).forEach((card, i) => {
            gsap.to(card, {
                yPercent: 10 + (i * 2), // Staggered smooth parallax
                ease: "none", // Critical for scroll scrub
                scrollTrigger: {
                    trigger: card,
                    scrub: true,
                    start: "top bottom",
                    end: "bottom top"
                }
            });
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new HamamEngine().init();
});
