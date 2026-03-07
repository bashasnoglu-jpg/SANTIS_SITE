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

                // PHASE 2: API-DRIVEN NAVIGATION
                // ---------------------------------------------------------
                var cardId = this.dataset.id;
                var catalog = window.productCatalog || [];
                var item = catalog.find(function (p) { return p.id === cardId; });

                if (item) {
                    // 1. Explicit API URL (Best)
                    if (item.detailUrl) {
                        console.log('🦅 [NuclearCards] API Route (Explicit):', item.detailUrl);
                        window.location.href = item.detailUrl;
                        return;
                    }

                    // 2. Constructed API Route (Santis OS Standard)
                    if (window.SantisAPI && window.SantisAPI.resolveUrl) {
                        const targetUrl = window.SantisAPI.resolveUrl(item);
                        console.log('🦅 [NuclearCards] API Route (Resolved):', targetUrl);
                        window.location.href = targetUrl;
                        return;
                    }

                    // Legacy Fallback (if SantisAPI missing)
                    if (item.slug) {
                        // Yeni Sovereign Routing standartı: URL her zaman Canonical rotada (/tr/).
                        // Aktif dil localStorage üzerinde tutulur, JS (DataBridge vb.) tarafından yönetilir.
                        var constructedUrl = '/tr/masajlar/' + item.slug + '.html';
                        window.location.href = constructedUrl;
                        return;
                    }
                }

                // 3. Fallback to HTML href (Legacy)
                if (clickHref && clickHref !== '#' && !clickHref.includes('javascript:')) {
                    console.log('🔧 [NuclearCards] Legacy Href Fallback:', clickHref);

                    // Eski dil rotalarını (/en/, /ru/, /de/ vb.) temizle ve /tr/'ye yönlendir.
                    var cleanedHref = clickHref.replace(/^\/(en|ru|de|fr|sr)\//, '/tr/');
                    window.location.href = cleanedHref;
                    return;
                }

                console.warn('⚠️ [NuclearCards] No valid navigation route found for card:', cardId);
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

/**
 * NUCLEAR CARDS ENGINE v2.0 (API Compatible)
 * Renders related service cards dynamically.
 * Required by: service-detail-logic.js / hammam-detail.js
 */
window.initNuclearCards = function (config) {
    if (!config || !config.containerId) return;

    // Wait for data if not ready
    if (!window.productCatalog || window.productCatalog.length === 0) {
        document.addEventListener('product-data:ready', () => window.initNuclearCards(config), { once: true });
        return;
    }

    const container = document.getElementById(config.containerId);
    if (!container) return;

    let items = window.productCatalog.filter(config.filterHelper || (() => true));

    if (config.limit) {
        items = items.slice(0, config.limit);
    }

    if (items.length === 0) {
        container.innerHTML = '<p style="opacity:0.5; font-size:14px;">Benzer deneyim bulunamadı.</p>';
        return;
    }

    const html = items.map(item => {
        // Phase 2: Dynamic URL Construction
        let href = item.detailUrl;

        // 1. Try to construct from SantisAPI logic helper if available
        if (!href && window.SantisAPI && window.SantisAPI.resolveUrl) {
            href = window.SantisAPI.resolveUrl(item);
        }

        // 2. Fallback construction (minimal)
        if (!href && (item.slug || item.id)) {
            // Yeni Sovereign Routing standartı: URL her zaman Canonical rotada (/tr/).
            const slug = item.slug || item.id;
            href = `/tr/masajlar/${slug}.html`;
        }

        // Data Normalization
        const img = item.img || '/assets/img/luxury-placeholder.webp';
        // Handle i18n title object or string
        let title = item.title;
        if (typeof title === 'object' && title !== null) {
            title = title[window.SITE_LANG] || title['tr'] || title['en'] || "Service";
        }

        // Handle Pricing (Array or Object or String)
        let price = "";
        if (item.pricing && Array.isArray(item.pricing) && item.pricing.length > 0) {
            price = `${item.pricing[0].amount} ${item.pricing[0].currency}`;
        } else if (item.price) {
            price = typeof item.price === 'number' ? `${item.price} €` : item.price;
        }

        return `
            <a href="${href}" class="nv-card-tarot" data-id="${item.id}">
                <div class="card__visual">
                    <img src="${img}" alt="${title}" loading="lazy" width="300" height="400">
                    <div class="card__overlay"></div>
                </div>
                <div class="card__content">
                    <h3 class="card__title">${title}</h3>
                    ${price ? `<span class="card__price">${price}</span>` : ''}
                </div>
            </a>
        `;
    }).join('');

    container.innerHTML = html;

    // Trigger fix for the new elements
    window.dispatchEvent(new Event('product-data:ready'));
};

/* ==========================================================================
   PHASE 45 H1: SOVEREIGN HALO — 2sn Dwell Timer
   Kullanıcı kart üzerinde 2+ saniye durursa .sovereign-hover class inject edilir
   ========================================================================== */
(function initSovereignHalo() {
    const DWELL_MS = 2000; // 2 Saniye
    const HALO_CLASS = 'sovereign-hover';
    let haloTimers = new Map();

    function attachHaloListeners() {
        const cards = document.querySelectorAll('.nv-card-tarot, .nv-card, .bento-card, .nv-trend-card');
        cards.forEach(function (card, idx) {
            if (card.dataset.haloArmed === '1') return;
            card.dataset.haloArmed = '1';

            card.addEventListener('mouseenter', function () {
                const timerId = setTimeout(function () {
                    card.classList.add(HALO_CLASS);
                    console.log('[Halo] Dwell target reached. Injecting Aura to Card:', idx);

                    // Phantom Injection Stats
                    if (window.SantisGhost && typeof window.SantisGhost.track === 'function') {
                        window.SantisGhost.track('sovereign_hover_dwell', 'card:' + (card.dataset.id || idx));
                    }
                }, DWELL_MS);
                haloTimers.set(card, timerId);
            });

            card.addEventListener('mouseleave', function () {
                const timerId = haloTimers.get(card);
                if (timerId) clearTimeout(timerId);
                haloTimers.delete(card);
                card.classList.remove(HALO_CLASS);
            });
        });
    }

    // Dom hazır olduğunda ve her yeni kart render’ında çalış
    document.addEventListener('DOMContentLoaded', function () { setTimeout(attachHaloListeners, 1500); });
    window.addEventListener('product-data:ready', function () { setTimeout(attachHaloListeners, 500); });
    setTimeout(attachHaloListeners, 3000);
})();

