/**
 * SANTIS — Lenis Smooth Scroll Init (CSP-Safe)
 * Replaces identical inline <script> blocks across service pages.
 * Requires Lenis library to be loaded before this script.
 */
(function () {
    if (typeof Lenis === 'undefined') return;
    var lenis = new Lenis();
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
})();
