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

                // ---------------------------------------------------------
                // 🛑 LOCALHOST FIX: Prevent jumping to Live Site
                // ---------------------------------------------------------
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
                    if (clickHref && clickHref.includes('santis-club.com')) {
                        console.warn('🔧 [NuclearCards] Local Dev: Rewriting Live URL to Local Path');
                        clickHref = clickHref.replace('https://santis-club.com', '').replace('http://santis-club.com', '');
                        // If empty after replace, default to /
                        if (!clickHref) clickHref = '/';
                    }
                }

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
                    if (item && (item.slug || item.id)) {
                        // STATIC URL FIX
                        var lang = (window.SITE_LANG || 'tr').toLowerCase();
                        var cat = (item.categoryId || item.category || '').toLowerCase();
                        var section = 'masajlar';

                        if (cat.indexOf('hammam') > -1 || cat.indexOf('hamam') > -1) section = 'hamam';
                        else if (cat.indexOf('skin') > -1 || cat.indexOf('cilt') > -1 || cat.indexOf('face') > -1 || cat.indexOf('sothys') > -1) section = 'cilt-bakimi';

                        var slug = item.slug || item.id;
                        var fixedUrl = '/' + lang + '/' + section + '/' + slug + '.html';

                        console.log('🔧 [NuclearCards] Fixed empty slug! Navigating to:', fixedUrl);
                        window.location.href = fixedUrl;
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
