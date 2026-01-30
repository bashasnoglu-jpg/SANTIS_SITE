/**
 * SANTIS PERFORMANCE OPTIMIZER v1.0
 * Lazy loading, image optimization, and resource hints
 * 2026-01-30
 */

const PERF_OPTIMIZER = {
    config: {
        lazyLoadThreshold: '200px',  // Start loading 200px before viewport
        placeholderColor: '#1a1714', // Warm dark gray
        webpSupport: null
    },

    init() {
        this.detectWebP();
        this.initLazyImages();
        this.initLazyIframes();
        this.prefetchLinks();
        this.optimizeScrollPerformance();
        console.log('⚡ Performance Optimizer initialized');
    },

    /**
     * Detect WebP support
     */
    detectWebP() {
        const canvas = document.createElement('canvas');
        if (canvas.getContext && canvas.getContext('2d')) {
            this.config.webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        } else {
            this.config.webpSupport = false;
        }
        document.documentElement.classList.add(this.config.webpSupport ? 'webp' : 'no-webp');
    },

    /**
     * Initialize lazy loading for images
     */
    initLazyImages() {
        // Images with data-src attribute
        const lazyImages = document.querySelectorAll('img[data-src]');

        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: this.config.lazyLoadThreshold
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for old browsers
            lazyImages.forEach(img => this.loadImage(img));
        }
    },

    /**
     * Load a lazy image
     */
    loadImage(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;

        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
        }

        if (srcset) {
            img.srcset = srcset;
            img.removeAttribute('data-srcset');
        }

        img.classList.add('loaded');
    },

    /**
     * Lazy load iframes (especially YouTube)
     */
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
            }, {
                rootMargin: '400px' // Start loading iframes earlier
            });

            lazyIframes.forEach(iframe => iframeObserver.observe(iframe));
        }
    },

    /**
     * Prefetch links on hover for faster navigation
     */
    prefetchLinks() {
        const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');

        internalLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                const href = link.getAttribute('href');
                if (!href || document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;

                const prefetch = document.createElement('link');
                prefetch.rel = 'prefetch';
                prefetch.href = href;
                document.head.appendChild(prefetch);
            }, { once: true });
        });
    },

    /**
     * Optimize scroll performance with passive listeners
     */
    optimizeScrollPerformance() {
        // Add passive flag to scroll listeners where possible
        document.addEventListener('scroll', () => { }, { passive: true });
        document.addEventListener('touchstart', () => { }, { passive: true });
        document.addEventListener('touchmove', () => { }, { passive: true });
    },

    /**
     * Convert image URL to WebP if supported
     */
    toWebP(url) {
        if (!this.config.webpSupport) return url;
        if (url.endsWith('.webp')) return url;

        // Check if WebP version exists (simple approach)
        const webpUrl = url.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        return webpUrl;
    },

    /**
     * Preload critical resources
     */
    preloadCritical(resources) {
        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as || 'image';
            if (resource.type) link.type = resource.type;
            if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
            document.head.appendChild(link);
        });
    },

    /**
     * Measure and log Core Web Vitals
     */
    measureWebVitals() {
        if ('PerformanceObserver' in window) {
            // LCP - Largest Contentful Paint
            try {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log(`📊 LCP: ${Math.round(lastEntry.startTime)}ms`);
                }).observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (e) { }

            // FID - First Input Delay
            try {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        console.log(`📊 FID: ${Math.round(entry.processingStart - entry.startTime)}ms`);
                    });
                }).observe({ type: 'first-input', buffered: true });
            } catch (e) { }

            // CLS - Cumulative Layout Shift
            try {
                let clsValue = 0;
                new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    console.log(`📊 CLS: ${clsValue.toFixed(4)}`);
                }).observe({ type: 'layout-shift', buffered: true });
            } catch (e) { }
        }
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PERF_OPTIMIZER.init());
} else {
    PERF_OPTIMIZER.init();
}

// Export
window.PERF_OPTIMIZER = PERF_OPTIMIZER;
