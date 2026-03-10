/**
 * SANTIS PIXEL ENGINE V1.0 (Ultra Mega Marketing Sync)
 * ---------------------------------------------------
 * Medya Üssü (social.json) verilerini okur ve eğer Admin tarafından 
 * Pixel ya da GTAG ID girilmişse sitenin <head> tagine canlı olarak enjekte eder.
 */

(function () {
    'use strict';

    if (window.__SANTIS_PIXEL_BOOTED__) return;
    window.__SANTIS_PIXEL_BOOTED__ = true;

    // State
    const PixelEngine = {
        initialized: false,
        config: {
            fbq: null,
            gtag: null
        },

        init: async function () {
            if (this.initialized) return;
            this.initialized = true;

            try {
                // Fetch Config from absolute root path
                const res = await fetch('/assets/data/social.json', { cache: 'no-cache' });

                if (res.ok) {
                    const data = await res.json();
                    if (data.pixels) {
                        this.config.fbq = data.pixels.fbq || null;
                        this.config.gtag = data.pixels.gtag || null;
                    }
                }

                // Inject Scripts
                this.injectMetaPixel();
                this.injectGoogleGtag();

            } catch (e) {
                console.warn("🎯 [PixelEngine] Init failed:", e);
            }
        },

        injectMetaPixel: function () {
            const pixelId = this.config.fbq;
            if (!pixelId) {
                console.log("🎯 [PixelEngine] Meta Pixel is disabled.");
                return;
            }

            console.log("🎯 [PixelEngine] Injecting Meta Pixel ID:", pixelId);

            !function (f, b, e, v, n, t, s) {
                if (f.fbq) return; n = f.fbq = function () {
                    n.callMethod ?
                        n.callMethod.apply(n, arguments) : n.queue.push(arguments)
                };
                if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
                n.queue = []; t = b.createElement(e); t.async = !0;
                t.src = v; s = b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t, s)
            }(window, document, 'script',
                'https://connect.facebook.net/en_US/fbevents.js');

            fbq('init', pixelId);
            fbq('track', 'PageView');

            // Inject noscript tag for FB
            const noscript = document.createElement('noscript');
            const img = document.createElement('img');
            img.height = 1;
            img.width = 1;
            img.style.display = "none";
            img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
            noscript.appendChild(img);
            document.head.appendChild(noscript);
        },

        injectGoogleGtag: function () {
            const gtagId = this.config.gtag;
            if (!gtagId) {
                console.log("🎯 [PixelEngine] Google Tag is disabled.");
                return;
            }

            console.log("🎯 [PixelEngine] Injecting Google Tag ID:", gtagId);

            // GTAG Script
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
            document.head.appendChild(script);

            // GTAG Init Code
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            window.gtag = gtag; // expose to global
            gtag('js', new Date());
            gtag('config', gtagId);
        }
    };

    // Expose globally for manual tracking (like bio link clicks)
    window.SantisPixelEngine = PixelEngine;

    // Phase 10: Zihin Okuma (Speculative Rules API) Ghost Traffic Kalkanı
    // Eğer sayfa arka planda ön-yükleniyorsa (prerender), Pixel'leri ateşleme. Görünür olmasını bekle.
    if (document.prerendering) {
        document.addEventListener('prerenderingchange', () => {
            PixelEngine.init();
        });
    } else {
        window.addEventListener('load', () => PixelEngine.init());
    }

})();
