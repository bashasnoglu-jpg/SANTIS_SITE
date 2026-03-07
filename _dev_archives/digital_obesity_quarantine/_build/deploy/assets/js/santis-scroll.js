/**
 * SANTIS SCROLL ENGINE v2.0 (Powered by Lenis)
 * Replaces custom 'hijack' implementation with robust Lenis library.
 * Features:
 * - Butter-smooth "Quiet Luxury" inertia
 * - Touch & Wheel support
 * - Hardware Accelerated
 * - Auto-Injection of Library
 */

class SantisScroll {
    constructor() {
        this.isActive = true;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Mobile Strategy: Use Lenis for unification, or Native for performance?
        // Lenis is actually great on mobile too, fixing scroll chaining.
        // But for "safety", let's keep native on mobile if desired.
        // User reported "zor kayma" (hard scroll), which implies desktop mousewheel friction usually.

        this.init();
    }

    async init() {
        console.log("🌊 [Santis Scroll] Initializing V2 (Lenis Core)...");

        // 1. Ensure Lenis Library is Loaded
        if (typeof Lenis === 'undefined') {
            console.log("⬇️ [Santis Scroll] Injecting Lenis CDN...");
            await this.loadScript('https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.29/bundled/lenis.min.js');
        }

        // 2. Configure Settings (Tuned for Responsiveness)
        // User feedback: "zor kayıyor" -> Needs lighter friction, higher multiplier
        this.lenis = new Lenis({
            duration: 0.7, // Lower = Snappier (Standard for luxury is usually 1.2, but user wants less resistance)
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Expo.out
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 2.0, // Multiplier for mouse wheel (Higher = less rolling needed)
            smoothTouch: false,
            touchMultiplier: 2,
        });

        // 3. Bind Animation Loop
        this.raf(0);

        console.log("🌊 [Santis Scroll] Engine Active.");

        // Expose for Global Control (e.g., stop/start)
        window.lenis = this.lenis;

        // 4. Connect to Soul Engine (Flux Capacitor)
        // If Soul Engine exists, let's feed it velocity.
        this.lenis.on('scroll', (e) => {
            if (window.SantisSoul) {
                // Determine scrolling status
                window.SantisSoul.scrollVelocity = e.velocity;
                window.SantisSoul.isScrolling = Math.abs(e.velocity) > 0.1;
                window.SantisSoul.scrollY = e.scroll;
            }
        });
    }

    raf(time) {
        this.lenis.raf(time);
        requestAnimationFrame(this.raf.bind(this));
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // API Wrapper
    scrollTo(target) {
        this.lenis.scrollTo(target);
    }
}

// Auto-Launch
document.addEventListener('DOMContentLoaded', () => {
    // Only activate if not in Admin Panel
    if (!window.location.pathname.includes('/admin/')) {
        window.SantisScroll = new SantisScroll();
    }
});
