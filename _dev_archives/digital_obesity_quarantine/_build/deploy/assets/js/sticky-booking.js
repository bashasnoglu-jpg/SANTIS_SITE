/**
 * Santis Club — Sticky Booking Bar
 * Extracted from inline script for CSP compliance (Phase 3)
 */
(function () {
    var b = document.getElementById('stickyBooking');
    if (!b) return;
    var s = false;
    window.addEventListener('scroll', function () {
        if (window.scrollY > 600 && !s) {
            b.classList.add('visible');
            s = true;
        } else if (window.scrollY <= 600 && s) {
            b.classList.remove('visible');
            s = false;
        }
    }, { passive: true });
})();
