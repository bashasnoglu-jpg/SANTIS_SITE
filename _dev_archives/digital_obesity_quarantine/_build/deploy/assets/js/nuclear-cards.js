/**
 * NUCLEAR CARD CLICK FIX v1.1
 * ────────────────────────────
 * Forces navigation on .nv-card-tarot clicks.
 * Fixes: invisible overlay blocking, <button> inside <a> issue,
 * and any pointer-events conflicts.
 * 
 * v1.1: Better href reading, debug logging, deferred href resolution
 */
(function () {
    var ARMED = false;

    function nuclearCardFix() {
        var cards = document.querySelectorAll('.nv-card-tarot');
        if (cards.length === 0) return; // No cards on this page
        if (ARMED) return; // Already armed
        ARMED = true;

        console.log('🔧 [NuclearCards] Arming ' + cards.length + ' cards...');

        cards.forEach(function (card, i) {
            // Force clickability styles
            card.style.pointerEvents = 'auto';
            card.style.cursor = 'pointer';
            card.style.position = 'relative';
            card.style.zIndex = '100';

            // Replace <button> with <span> if present
            var btn = card.querySelector('button.card__action');
            if (btn) {
                var span = document.createElement('span');
                span.className = btn.className;
                span.textContent = btn.textContent;
                btn.parentNode.replaceChild(span, btn);
            }

            // Log href for debugging
            var rawHref = card.getAttribute('href');
            var resolvedHref = card.href;
            if (i === 0) {
                console.log('🔧 [NuclearCards] Card 0 raw href:', rawHref);
                console.log('🔧 [NuclearCards] Card 0 resolved href:', resolvedHref);
            }

            // Capture-phase click → forced navigation
            card.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                // Read href at click time (may have been updated after arming)
                var clickHref = this.getAttribute('href') || this.href;

                // Validate slug is not empty
                if (clickHref && clickHref.includes('slug=') && !clickHref.match(/slug=(&|$|#)/)) {
                    console.log('🔧 [NuclearCards] Navigating to:', clickHref);
                    window.location.href = clickHref;
                } else if (clickHref && !clickHref.includes('slug=')) {
                    // Non-slug URL (could be a valid link)
                    console.log('🔧 [NuclearCards] Navigating to (non-slug):', clickHref);
                    window.location.href = clickHref;
                } else {
                    // Empty slug - try to reconstruct from data
                    var cardId = this.dataset.id;
                    var catalog = window.productCatalog || [];
                    var item = catalog.find(function (p) { return p.id === cardId; });
                    if (item && item.slug) {
                        var fixedUrl = '/service-detail.html?slug=' + item.slug;
                        console.log('🔧 [NuclearCards] Fixed empty slug! Navigating to:', fixedUrl);
                        window.location.href = fixedUrl;
                    } else if (item && item.id) {
                        var fixedUrl2 = '/service-detail.html?id=' + item.id;
                        console.log('🔧 [NuclearCards] Using item ID. Navigating to:', fixedUrl2);
                        window.location.href = fixedUrl2;
                    } else {
                        console.error('🔧 [NuclearCards] Cannot determine URL for card:', cardId);
                    }
                }
            }, true); // true = capture phase
        });

        console.log('🔧 [NuclearCards] ' + cards.length + ' cards armed.');
    }

    // Run after cards are rendered (multiple attempts for timing safety)
    var attempts = [1500, 3000, 5000, 7000];
    attempts.forEach(function (ms) {
        setTimeout(nuclearCardFix, ms);
    });

    // Also listen for data-ready event
    document.addEventListener('product-data:ready', function () {
        setTimeout(nuclearCardFix, 500);
    });
    window.addEventListener('product-data:ready', function () {
        setTimeout(nuclearCardFix, 500);
    });
})();
