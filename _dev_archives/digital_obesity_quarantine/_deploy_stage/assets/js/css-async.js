/* ==========================================================================
   CSS Async Loader v1.1
   Converts <link rel="preload" as="style"> to rel="stylesheet".
   CSP-safe alternative to inline onload handlers.
   Runs immediately (not deferred) so preloaded CSS activates on time.
   ========================================================================== */
(function () {
    function activatePreloads() {
        var links = document.querySelectorAll('link[rel="preload"][as="style"]');
        for (var i = 0; i < links.length; i++) {
            (function (link) {
                if (link.sheet) {
                    // Already loaded from cache
                    link.rel = 'stylesheet';
                } else {
                    link.onload = function () {
                        this.onload = null;
                        this.rel = 'stylesheet';
                    };
                }
            })(links[i]);
        }
    }

    // Run immediately
    activatePreloads();

    // Also run when DOM is ready in case links were added dynamically
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', activatePreloads);
    }
})();
