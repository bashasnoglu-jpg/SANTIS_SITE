/**
 * SANTIS OS - Sovereign Speculation Engine (Phase 23)
 * Predictive Rendering & Speculative Navigation API orchestrator.
 * Transforms the "Zero-Jank Morph" into a "Zero-Latency" experience.
 */

class SantisSpeculator {
    constructor() {
        this.supportsSpeculation = HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules');
        this.prefetchedUrls = new Set();
        this.prerenderedUrls = new Set();
        
        if (!this.supportsSpeculation) {
            console.warn("🦅 [Speculator] Browser does not support Speculation Rules API. Predictive navigation disabled.");
            return;
        }

        // Delay viewport observation until the main thread is idle
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.initViewportObserver());
        } else {
            setTimeout(() => this.initViewportObserver(), 1000);
        }
    }

    initViewportObserver() {
        console.log("🦅 [Speculator] Viewport Radar devrede. Niyet analizi yapılıyor...");
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const link = entry.target.href || entry.target.dataset.target || entry.target.querySelector('a')?.href;
                    if (link && this.isValidSantisRoute(link)) {
                        this.prefetch(link);
                        // Stop observing once prefetched
                        this.observer.unobserve(entry.target);
                    }
                }
            });
        }, {
            rootMargin: '200px' // Start fetching when the element is 200px away from entering the screen
        });

        this.scanDOM();
    }

    scanDOM() {
        // Observe all Santis Cards and Liquid Triggers for soft-prefetching
        const targets = document.querySelectorAll('.santis-card, .liquid-trigger, .bento-card-dark');
        targets.forEach(t => this.observer.observe(t));
    }

    isValidSantisRoute(url) {
        if (!url) return false;
        try {
            const parsed = new URL(url, window.location.origin);
            // Only speculate on same-origin paths, avoid external/WA links or anchors
            if (parsed.origin !== window.location.origin) return false;
            if (parsed.pathname.startsWith('/admin')) return false;
            if (parsed.pathname === window.location.pathname) return false;
            return true;
        } catch (e) {
            return false;
        }
    }

    injectRule(ruleObj) {
        const script = document.createElement('script');
        script.type = 'speculationrules';
        script.textContent = JSON.stringify(ruleObj);
        document.head.appendChild(script);
    }

    /**
     * Aggressive Prerender (Render instantly in background)
     * Used exclusively for AI recommended Morph Cards.
     */
    static prerender(url) {
        if (!window.santisSpeculator) return;
        const spec = window.santisSpeculator;
        
        if (!spec.supportsSpeculation || spec.prerenderedUrls.has(url)) return;
        
        spec.prerenderedUrls.add(url);
        
        const rule = {
            prerender: [{
                source: "list",
                urls: [url]
            }]
        };
        spec.injectRule(rule);
        console.log(`💎 [Speculator] PRERENDER Mühürlendi: ${url} (AI Hedefi)`);
    }

    /**
     * Soft Prefetch (Fetch HTML/CSS only)
     * Used for general links floating into the viewport.
     */
    prefetch(url) {
        if (!this.supportsSpeculation || this.prefetchedUrls.has(url) || this.prerenderedUrls.has(url)) return;
        
        this.prefetchedUrls.add(url);

        const rule = {
            prefetch: [{
                source: "list",
                urls: [url]
            }]
        };
        this.injectRule(rule);
        console.log(`🌌 [Speculator] PREFETCH Taraması: ${url} (Viewport Algısı)`);
    }
}

// Auto-boot Global Speculator
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.santisSpeculator = new SantisSpeculator();
    });
} else {
    window.santisSpeculator = new SantisSpeculator();
}
