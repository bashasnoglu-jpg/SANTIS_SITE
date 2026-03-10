/**
 * SANTIS V10 SOVEREIGN SCROLL ENGINE
 * The Pipeline Manager for Safari Jank Elimination & FPS Stabilization
 */

(() => {
    'use strict';

    if (window.__SovereignScrollBooted__) return;
    window.__SovereignScrollBooted__ = true;

    console.log("🌊 [Sovereign Scroll Engine] Initializing Pipeline Manager...");

    const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
    const hasLenis = typeof window.Lenis !== 'undefined';

    // ===============================================
    // 1. GSAP ScrollTrigger Stabilizer
    // ===============================================
    if (hasGSAP) {
        gsap.registerPlugin(ScrollTrigger);

        ScrollTrigger.config({
            ignoreMobileResize: true,
            autoRefreshEvents: "visibilitychange,DOMContentLoaded,load" // Eliminate resize layout thrashing
        });

        console.log("🌊 [Sovereign Scroll Engine] GSAP ScrollTrigger Stabilizer Locked.");
    } else {
        console.warn("🌊 [Sovereign Scroll Engine] GSAP not detected. Pipeline will run barebones.");
    }

    // ===============================================
    // 2. Lenis Strict Integration (The Central Loop)
    // ===============================================
    let lenis;
    if (hasLenis) {
        lenis = new window.Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-like ease
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            smoothTouch: false,
            touchMultiplier: 1.5
        });

        // The unified pipeline trick:
        // Do NOT run a separate requestAnimationFrame loop if GSAP Ticker is active.
        if (hasGSAP) {
            lenis.on('scroll', ScrollTrigger.update);

            gsap.ticker.add((time) => {
                lenis.raf(time * 1000);
            });
            // Disable lag smoothing to prevent GSAP from fighting the scroll pipeline
            gsap.ticker.lagSmoothing(0);
            console.log("🌊 [Sovereign Scroll Engine] GSAP Ticker + Lenis Hybrid Loop Active.");
        } else {
            // Fallback RAF if GSAP doesn't exist
            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
        }

    } else {
        console.warn("🌊 [Sovereign Scroll Engine] Lenis not detected. Operating at OS-level scrolling.");
    }

    // ===============================================
    // 3. Global Sovereign API
    // ===============================================
    window.SovereignScroll = {
        instance: lenis,
        lock: () => {
            if (lenis) lenis.stop();
            document.body.style.overflow = 'hidden';
        },
        unlock: () => {
            if (lenis) lenis.start();
            document.body.style.overflow = '';
        },
        scrollTo: (target, options = {}) => {
            if (lenis) lenis.scrollTo(target, options);
            else {
                let el = typeof target === 'string' ? document.querySelector(target) : target;
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    // ===============================================
    // 4. Force Scroll Refresh Event Hook
    // ===============================================
    window.addEventListener('load', () => {
        if (hasGSAP) ScrollTrigger.refresh();
    });

})();
