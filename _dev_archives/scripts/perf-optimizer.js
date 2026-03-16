/**
 * SANTIS PERFORMANCE OPTIMIZER v1.1 (ULTRA MEGA CODE)
 * Lazy loading, Animation Management, AI Throttling
 * 2026-02-06
 */

const PERF_OPTIMIZER = {
    config: {
        lazyLoadThreshold: '200px',
        placeholderColor: '#1a1714',
        webpSupport: null
    },

    init() {
        this.detectWebP();
        this.initLazyImages();
        this.initLazyIframes();
        this.initPredictivePrefetcher();
        this.optimizeScrollPerformance();
        this.initAnimationManager(); // New V1.1
        console.log('⚡ Performance Optimizer v1.1 initialized');
    },

    detectWebP() {
        const canvas = document.createElement('canvas');
        if (canvas.getContext && canvas.getContext('2d')) {
            this.config.webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        } else {
            this.config.webpSupport = false;
        }
        document.documentElement.classList.add(this.config.webpSupport ? 'webp' : 'no-webp');
    },

    // --- ANIMATION MANAGER (From Ultra Mega Prompt) ---
    initAnimationManager() {
        // 1. Pause Invisible Animations
        if ('IntersectionObserver' in window) {
            const animObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.target.style) {
                        entry.target.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
                    }
                });
            }, { rootMargin: "100px" });

            // Apply to potentially heavy elements
            document.querySelectorAll('.soul-element, .animate-on-scroll, .water-flow, .fog-layer').forEach(el => {
                animObserver.observe(el);
            });
        }
    },

    // --- UTILITIES ---
    throttle(fn, wait) {
        let time = Date.now();
        return () => {
            if ((time + wait - Date.now()) < 0) {
                fn();
                time = Date.now();
            }
        }
    },

    initLazyImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { rootMargin: this.config.lazyLoadThreshold });
            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            lazyImages.forEach(img => this.loadImage(img));
        }
    },

    loadImage(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;
        if (src) { img.src = src; img.removeAttribute('data-src'); }
        if (srcset) { img.srcset = srcset; img.removeAttribute('data-srcset'); }
        img.classList.add('loaded');
    },

    initLazyIframes() {
        const lazyIframes = document.querySelectorAll('iframe[data-src]');
        if ('IntersectionObserver' in window) {
            const iframeObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const iframe = entry.target;
                        iframe.src = iframe.dataset.src;
                        iframe.removeAttribute('data-src');
                        observer.unobserve(iframe);
                    }
                });
            }, { rootMargin: '400px' });
            lazyIframes.forEach(iframe => iframeObserver.observe(iframe));
        }
    },

    initPredictivePrefetcher() {
        // H1 - Predictive Prefetcher (Tahminlemeli Önyükleme)
        const baseThreshold = 800;
        const THRESHOLD_MS = typeof window.__SENTINEL_THROTTLE__ !== 'undefined'
            ? (baseThreshold * window.__SENTINEL_THROTTLE__)
            : baseThreshold;

        // Define predictive map
        const intentMap = {
            '/tr/hamam/': '/tr/vip-suite.html', // Changed from /tr/vip-suite/ to .html based on file structure
            '/tr/masajlar/': '/tr/masajlar/derin-doku-masaji.html',
            '/tr/cilt-bakimi/': '/tr/cilt-bakimi/sothys-hydra.html'
        };

        const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
        let hoverTimer;

        internalLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                const href = link.getAttribute('href');
                if (!href) return;

                // Simple Intent Check: If hover > 800ms and not fetched in this session
                hoverTimer = setTimeout(() => {
                    this.injectPrefetch(href);

                    // Cross-reference with intent map based on current page path
                    const currentPath = window.location.pathname;
                    if (intentMap[currentPath]) {
                        // Check if scroll depth is > 60% as an additional signal before massive prerender
                        const scrollDepth = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
                        if (scrollDepth > 0.6) {
                            this.injectPrefetch(intentMap[currentPath], 'prerender');
                        }
                    }
                }, THRESHOLD_MS);
            });

            link.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimer);
            });
        });
    },

    injectPrefetch(url, relType = 'prefetch') {
        // Avoid duplicate injections in the same session
        const sessionKey = `santis_prefetch_${url}`;
        if (sessionStorage.getItem(sessionKey)) return;

        // Ensure it's not already in DOM
        if (document.querySelector(`link[rel="${relType}"][href="${url}"]`)) return;

        const linkElement = document.createElement('link');
        linkElement.rel = relType;
        linkElement.href = url;
        document.head.appendChild(linkElement);

        sessionStorage.setItem(sessionKey, 'true');
        console.log(`[PredictivePrefetcher] Injection: ${relType} -> ${url}`);
    },

    optimizeScrollPerformance() {
        // Passive listeners are default optimization
        const throttledScroll = this.throttle(() => {
            document.body.classList.toggle('scrolled', window.scrollY > 50);
        }, 100);

        window.addEventListener('scroll', throttledScroll, { passive: true });
        // Keeping global passive for others
        document.addEventListener('touchstart', () => { }, { passive: true });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PERF_OPTIMIZER.init());
} else {
    PERF_OPTIMIZER.init();
}
window.PERF_OPTIMIZER = PERF_OPTIMIZER;
