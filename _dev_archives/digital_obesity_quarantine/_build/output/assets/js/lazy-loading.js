/**

 * Lazy Loading Helper - Auto-enable lazy loading for all images

 * Add this script to pages that need automatic lazy loading

 */



(function () {

    'use strict';



    // Configuration

    const CONFIG = {

        rootMargin: '50px',  // Start loading 50px before viewport

        threshold: 0.01,     // Trigger when 1% visible

        excludeClasses: ['no-lazy', 'eager-load'],  // Skip these classes

        heroSelectors: ['.hero img', '[data-priority="high"]']  // Never lazy-load these

    };



    // Check browser support

    const supportsLazyLoading = 'loading' in HTMLImageElement.prototype;

    const supportsIntersectionObserver = 'IntersectionObserver' in window;



    /**

     * Add lazy loading attribute to images

     */

    function enableNativeLazyLoading() {

        const images = document.querySelectorAll('img:not([loading])');



        images.forEach(img => {

            // Skip if excluded

            if (CONFIG.excludeClasses.some(cls => img.classList.contains(cls))) {

                return;

            }



            // Skip hero images

            const isHero = CONFIG.heroSelectors.some(selector => {

                return img.matches(selector) || img.closest(selector);

            });



            if (isHero) {

                img.loading = 'eager';

                img.setAttribute('fetchpriority', 'high');

            } else {

                img.loading = 'lazy';

                img.decoding = 'async';

            }

        });



        console.log(`✅ Lazy loading enabled for ${images.length} images`);

    }



    /**

     * Fallback: IntersectionObserver-based lazy loading

     */

    function enableObserverLazyLoading() {

        const images = document.querySelectorAll('img[data-src]');



        const imageObserver = new IntersectionObserver((entries, observer) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    const img = entry.target;

                    img.src = img.dataset.src;

                    if (img.dataset.srcset) {

                        img.srcset = img.dataset.srcset;

                    }

                    img.classList.remove('lazy');

                    img.classList.add('lazy-loaded');

                    observer.unobserve(img);

                }

            });

        }, {

            rootMargin: CONFIG.rootMargin,

            threshold: CONFIG.threshold

        });



        images.forEach(img => imageObserver.observe(img));

        console.log(`✅ Observer-based lazy loading for ${images.length} images`);

    }



    /**

     * Add width/height attributes from actual dimensions

     * Prevents CLS (Cumulative Layout Shift)

     */

    function addDimensionHints() {

        const images = document.querySelectorAll('img:not([width]):not([height])');



        images.forEach(img => {

            if (img.naturalWidth && img.naturalHeight) {

                img.width = img.naturalWidth;

                img.height = img.naturalHeight;

            } else {

                img.addEventListener('load', function () {

                    if (!img.hasAttribute('width')) img.width = img.naturalWidth;

                    if (!img.hasAttribute('height')) img.height = img.naturalHeight;

                });

            }

        });

    }



    /**

     * Initialize

     */

    function init() {

        if (supportsLazyLoading) {

            enableNativeLazyLoading();

        } else if (supportsIntersectionObserver) {

            enableObserverLazyLoading();

        } else {

            console.warn('⚠️ Lazy loading not supported');

        }



        addDimensionHints();

    }



    // Run on DOM ready

    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', init);

    } else {

        init();

    }



    // Re-run when new images added dynamically

    window.enableLazyLoading = init;



})();

