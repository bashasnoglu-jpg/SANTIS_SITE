/**
 * SANTIS NAVIGATION MODULE v2.1
 * Standardized Header/Footer Injection with Defensive Pathing.
 */

function initNavAndFooter() {
    // ULTRA MEGA FIX: Skip navbar loading if static navbar already exists
    if (document.getElementById('nv-main-nav')) {
        console.log('[Santis Nav] Static navbar detected. Skipping dynamic load.');
        // Still load footer
        const getPath = (file) => {
            if (window.SITE_ROOT) return (window.SITE_ROOT + file).replace(/\/\//g, '/');
            const depth = window.location.pathname.split('/').length - 2;
            const prefix = depth > 0 ? "../".repeat(depth) : "";
            return prefix + file;
        };
        const lang = document.documentElement.lang || 'tr';
        const intlLangs = ['en', 'de', 'fr', 'ru'];
        const isIntl = intlLangs.includes(lang) || intlLangs.some(l => window.location.pathname.includes('/' + l + '/'));
        const footerFile = isIntl ? "components/footer-en.html" : "components/footer.html";
        if (typeof window.loadComp === 'function') {
            window.loadComp(getPath(footerFile), "footer-container", () => {
                const footer = document.getElementById("footer-container");
                if (footer) {
                    fixPaths(footer);
                    bindBookingTriggers(footer);
                }
            });
        }
        // Init interactions for the static navbar
        if (typeof initNavbarInteractions === 'function') initNavbarInteractions();
        return;
    }

    // Determine path based on depth (defensive pathing)
    const getPath = (file) => {
        if (window.SITE_ROOT) return (window.SITE_ROOT + file).replace(/\/\//g, '/');
        // Heuristic for root index
        const depth = window.location.pathname.split('/').length - 2;
        const prefix = depth > 0 ? "../".repeat(depth) : "";
        return prefix + file;
    };

    // Helper to fix paths in injected content
    const fixPaths = (container) => {
        const depth = window.location.pathname.split('/').length - 2;
        const prefix = depth > 0 ? "../".repeat(depth) : "";
        const isFileProtocol = window.location.protocol === 'file:';

        if (depth > 0) {
            container.querySelectorAll('a, img').forEach(node => {
                const attr = node.tagName === 'A' ? 'href' : 'src';
                let val = node.getAttribute(attr);

                if (val && !val.startsWith('http') && !val.startsWith('//') && !val.startsWith('#') && !val.startsWith('mailto:') && !val.startsWith('tel:') && !val.startsWith('javascript:')) {

                    // Case 1: Path starts with / (Absolute relative to root)
                    if (val.startsWith('/')) {
                        // Only convert to relative if on file protocol
                        if (isFileProtocol) {
                            node.setAttribute(attr, prefix + val.substring(1));
                        }
                    }
                    // Case 2: Path is relative (tr/galeri)
                    // If not starting with ./ or ../, prepend prefix
                    else if (!val.startsWith('../') && !val.startsWith('./')) {
                        node.setAttribute(attr, prefix + val);
                    }
                }
            });
        }
    };

    // Dynamic Home Link Fix for Multi-Lang
    const updateHomeLinks = (container) => {
        const path = window.location.pathname;
        const langs = ['en', 'de', 'fr', 'ru'];
        let lang = 'tr';
        for (const l of langs) {
            if (path.includes('/' + l + '/')) {
                lang = l;
                break;
            }
        }
        const homeUrl = `/${lang}/index.html`;

        // 1. Fix Logo
        const logo = container.querySelector('.logo');
        if (logo) logo.setAttribute('href', homeUrl);

        // 2. Fix Desktop Home Link
        container.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href && (href === '/index.html' || href === '/tr/index.html' || href === '/en/index.html')) {
                link.setAttribute('href', homeUrl);
            }
        });

        // 3. Fix Mobile Home Link (Global scope selector)
        const mobileHome = document.querySelector('.mobile-menu-content .mobile-link');
        if (mobileHome) {
            const mHref = mobileHome.getAttribute('href');
            if (mHref === '/index.html' || mHref === '/tr/index.html' || mHref === '/en/index.html') {
                mobileHome.setAttribute('href', homeUrl);
            }
        }
    };

    // CSP-safe image fallback wiring (replaces inline onerror handlers)
    function bindImageFallbacks(container) {
        if (!container) return;
        container.querySelectorAll('img[data-fallback-src]').forEach((img) => {
            if (img.dataset.fallbackBound === '1') return;
            img.dataset.fallbackBound = '1';

            const fallback = img.getAttribute('data-fallback-src');
            if (!fallback) return;

            const applyFallback = () => {
                if (img.getAttribute('src') !== fallback) img.setAttribute('src', fallback);
            };

            img.addEventListener('error', applyFallback, { once: true });

            // If image has already failed before listener binding, apply immediately.
            if (img.complete && img.naturalWidth === 0) applyFallback();
        });
    }

    function bindBookingTriggers(scope = document) {
        scope.querySelectorAll('[data-booking-open]').forEach((link) => {
            if (link.dataset.bookingBound === '1') return;
            link.dataset.bookingBound = '1';
            link.addEventListener('click', (ev) => {
                if (typeof window.BOOKING_WIZARD !== 'undefined' &&
                    window.BOOKING_WIZARD &&
                    typeof window.BOOKING_WIZARD.open === 'function') {
                    ev.preventDefault();
                    window.BOOKING_WIZARD.open();
                }
            });
        });
    }

    // loadComp is now handled globally by loader.js (with CORS fallback)
    // We only trigger init here if DOM is ready
    if (typeof window.loadComp === 'function') {
        // Smart Language Detection (v2.2 -> v2.3: All non-TR = International)
        const lang = document.documentElement.lang || 'tr';
        const intlLangs = ['en', 'de', 'fr', 'ru'];
        const isIntl = intlLangs.includes(lang) || intlLangs.some(l => window.location.pathname.includes('/' + l + '/'));

        const navFile = isIntl ? "components/navbar-en.html" : "components/navbar.html";
        const footerFile = isIntl ? "components/footer-en.html" : "components/footer.html";

        console.log(`[Santis Nav] Language detected: ${isIntl ? lang.toUpperCase() + ' (intl)' : 'TR'} -> Loading ${navFile}`);

        window.loadComp(getPath(navFile), "navbar-container", () => {
            // Callback after load: Initialize Logic
            const container = document.getElementById("navbar-container");
            if (container) {
                fixPaths(container);
                bindImageFallbacks(container);
                updateHomeLinks(container); // Apply dynamic home links
                initNavbarInteractions();
            }

            // Load missing scripts if not present
            // Navbar.js is deprecated/legacy - Removed to fix 404

            if (!document.querySelector('script[src*="language-switcher.js"]')) {
                const sc = document.createElement('script');
                sc.src = getPath('assets/js/language-switcher.js');
                document.body.appendChild(sc);
            }
        });
        window.loadComp(getPath(footerFile), "footer-container", () => {
            const footer = document.getElementById("footer-container");
            if (footer) {
                fixPaths(footer);
                bindBookingTriggers(footer);
            }
        });
    }
}

function initNavbarInteractions() {
    // DOM is ready (called from callback) - No Timeout Needed
    const ham = document.getElementById('hamburger');
    const menu = document.getElementById('mobileMenu');

    if (ham && menu) {
        // Remove old listeners to prevent duplicates (clone node)
        const newHam = ham.cloneNode(true);
        if (ham.parentNode) ham.parentNode.replaceChild(newHam, ham);

        newHam.addEventListener('click', () => {
            newHam.classList.toggle('active');
            menu.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });

        // Close on link click
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                newHam.classList.remove('active');
                menu.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        });
    }

    // Refresh language switcher if exists
    if (window.SANTIS_LANG && window.SANTIS_LANG.refresh) {
        window.SANTIS_LANG.refresh();
    }

    // Footer/CTA links that should open booking wizard when available.
    document.querySelectorAll('[data-booking-open]').forEach((link) => {
        if (link.dataset.bookingBound === '1') return;
        link.dataset.bookingBound = '1';
        link.addEventListener('click', (ev) => {
            if (typeof window.BOOKING_WIZARD !== 'undefined' &&
                window.BOOKING_WIZARD &&
                typeof window.BOOKING_WIZARD.open === 'function') {
                ev.preventDefault();
                window.BOOKING_WIZARD.open();
            }
        });
    });

    // --- SCROLL EFFECT (Quiet Luxury) ---
    const navbar = document.getElementById('nv-main-nav');
    if (navbar) {
        let ticking = false;
        const SCROLL_THRESHOLD = 60; // px before shrink kicks in

        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    navbar.classList.toggle('navbar--scrolled', window.scrollY > SCROLL_THRESHOLD);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // Initial state
    }
}

// Auto-run on load
document.addEventListener("DOMContentLoaded", initNavAndFooter);
