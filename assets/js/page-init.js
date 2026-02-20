/**
 * SANTIS — Universal Page Init (CSP-Safe)
 * Handles common DOMContentLoaded patterns across pages:
 *   - loadComp (navbar + footer)
 *   - Footer fallback loading
 *   - Soul engine init
 *   - Atmosphere trigger
 * 
 * Config via <html> data-* attributes:
 *   data-page-type="service-detail|booking|showroom|contact|editorial"
 *   data-page-mood="MIDNIGHT|DAWN|..."  (optional Soul mood)
 *   data-no-footer="true" (skip footer loading)
 *   data-no-navbar="true" (skip navbar loading)
 */
document.addEventListener("DOMContentLoaded", function () {
    var html = document.documentElement;
    var pageType = html.getAttribute('data-page-type') || 'default';
    var skipNav = html.getAttribute('data-no-navbar') === 'true';
    var skipFooter = html.getAttribute('data-no-footer') === 'true';
    var mood = html.getAttribute('data-page-mood');

    // Helper: resolve component path relative to current depth or SITE_ROOT
    function compPath(p) {
        var root = (window.SITE_ROOT || '').trim();
        if (root) {
            return (root + p).replace(/\/{2,}/g, '/');
        }
        var depth = window.location.pathname.split('/').length - 2;
        var prefix = depth > 0 ? '../'.repeat(depth) : '';
        return prefix + p;
    }

    // ──────────────────────────────────────────
    // 1. Load Components (navbar + footer)
    // ──────────────────────────────────────────
    if (typeof loadComp === "function") {
        if (!skipNav && document.getElementById("navbar-container")) {
            loadComp("/components/navbar.html", "navbar-container");
        }
        if (!skipFooter && document.getElementById("footer-container")) {
            loadComp("/components/footer.html", "footer-container");
        }
    }

    // ──────────────────────────────────────────
    // 2. Footer Fallback (if loadComp didn't handle it)
    // ──────────────────────────────────────────
    if (!skipFooter) {
        setTimeout(function () {
            var fc = document.getElementById('footer-container');
            if (fc && !fc.innerHTML.trim()) {
                fetch('/components/footer.html')
                    .then(function (r) { return r.text(); })
                    .then(function (h) { fc.innerHTML = h; })
                    .catch(function () { /* silent */ });
            }
        }, 2000);
    }

    // ──────────────────────────────────────────
    // 3. Soul Engine Init (showroom, editorial pages)
    // ──────────────────────────────────────────
    if (mood && window.SantisSoul) {
        try { new SantisSoul(); } catch (e) { /* silent */ }
    }

    // ──────────────────────────────────────────
    // 4. Atmosphere Trigger
    // ──────────────────────────────────────────
    // ──────────────────────────────────────────
    // 4. Atmosphere Trigger
    // ──────────────────────────────────────────
    if (window.SantisAtmosphere || window.Atmosphere) {
        // Atmosphere self-initializes, no action needed
    }

    // ──────────────────────────────────────────
    // 5. Telemetry Layer (Phase 26)
    // ──────────────────────────────────────────
    if (window.SantisTelemetry) {
        window.SantisTelemetry.init();
    } else {
        // Fallback: Lazy load if not present
        var telScript = document.createElement('script');
        telScript.src = '/assets/js/santis-telemetry.js';
        telScript.onload = function () { if (window.SantisTelemetry) window.SantisTelemetry.init(); };
        document.head.appendChild(telScript);
    }
});
