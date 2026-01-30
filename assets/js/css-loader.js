/**
 * SANTIS CLUB - CSS LOADER
 * Optimized CSS Loading System v1.0
 * 
 * Bu dosya CSS yüklemesini optimize eder:
 * - Kritik CSS inline'da
 * - Core CSS hemen yükle
 * - Non-critical CSS defer yükle
 */

(function () {
    'use strict';

    // CSS dosya grupları
    const CSS_FILES = {
        // Kritik - Hemen yükle
        critical: [
            '/assets/css/style.css'
        ],

        // Core - Sayfa yağlamada yükle
        core: [
            '/assets/css/components.css',
            '/assets/css/card-effects.css'
        ],

        // Lazy - Kullanıldığında yükle (defer)
        lazy: [
            '/assets/css/animations.css',
            '/assets/css/video-hero.css',
            '/assets/css/moods.css',
            '/assets/css/intro.css',
            '/assets/css/booking-wizard.css'
        ],

        // Legacy - Geriye dönük uyumluluk (kaldırılabilir)
        legacy: [
            '/assets/css/editorial.css',
            '/assets/css/editorial-zigzag.css',
            '/assets/css/luxury-cards.css',
            '/assets/css/santis-cards.css',
            '/assets/css/detail-split.css',
            '/assets/css/reviews.css'
        ]
    };

    /**
     * CSS dosyasını yükler
     * @param {string} href - CSS dosya yolu
     * @param {boolean} defer - Defer yükleme
     */
    function loadCSS(href, defer = false) {
        // Zaten yüklenmişse atla
        if (document.querySelector(`link[href="${href}"]`)) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;

        if (defer) {
            link.media = 'print';
            link.onload = function () {
                this.media = 'all';
            };
        }

        document.head.appendChild(link);
    }

    /**
     * Lazy CSS'leri yükler (requestIdleCallback ile)
     */
    function loadLazyCSS() {
        const loadFn = () => {
            CSS_FILES.lazy.forEach(href => loadCSS(href, true));
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(loadFn);
        } else {
            setTimeout(loadFn, 100);
        }
    }

    /**
     * Sayfa türüne göre ek CSS yükler
     */
    function loadPageSpecificCSS() {
        const path = window.location.pathname;

        // Detay sayfası
        if (path.includes('service-detail') || path.includes('detail')) {
            loadCSS('/assets/css/detail-split.css');
        }

        // Kategori sayfaları
        if (path.includes('/tr/hamam') || path.includes('/tr/masaj') || path.includes('/tr/cilt')) {
            loadCSS('/assets/css/editorial-zigzag.css');
        }

        // Booking
        if (path.includes('booking')) {
            loadCSS('/assets/css/booking-wizard.css');
        }
    }

    // Ana başlatıcı
    function init() {
        // Core CSS'leri yükle
        CSS_FILES.core.forEach(href => loadCSS(href));

        // DOM hazır olduğunda
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                loadPageSpecificCSS();
                loadLazyCSS();
            });
        } else {
            loadPageSpecificCSS();
            loadLazyCSS();
        }

        console.log('📦 CSS Loader v1.0 aktif');
    }

    init();

    // Global API
    window.SANTIS_CSS = {
        load: loadCSS,
        files: CSS_FILES
    };

})();
