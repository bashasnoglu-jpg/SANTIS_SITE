/**
 * SANTIS NAVIGATION MODULE v2.1
 * Standardized Header/Footer Injection with Defensive Pathing.
 */

function initNavAndFooter() {
    // --- HELPER FUNCTIONS ---
    const pathParts = window.location.pathname.split('/').filter(p => p !== '');
    const isLiveServerRoot = pathParts[0] === 'SANTIS_SITE';

    // Depth calculation strictly relying on slash count.
    // E.g. /tr/masajlar/index.html -> length is 3. tr, masajlar, index.html.
    // We want depth = 2. So we subtract 1 for the file itself.
    // If there is a subfolder like SANTIS_SITE, we ignore it.
    let baseDepth = window.location.pathname.split('/').length - 2;
    const depthPrefix = baseDepth > 0 ? "../".repeat(baseDepth) : "./";

    // Fallback getter if really needed
    const getPath = (file) => {
        // if the file is already prefixed natively, just return it
        if (file.startsWith('.') || file.startsWith('/')) return file;
        return depthPrefix + file;
    };

    // 2. Helper to fix paths in injected content
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
                        // Only convert to relative if on file protocol OR if we are in a subfolder structure locally
                        // The 'prefix' is calculated based on depth.
                        // If we are at depth 2 (tr/masajlar), prefix is ../../
                        // So /assets/img becomes ../../assets/img
                        if (isFileProtocol || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                            // Remove leading slash and prepend prefix
                            const cleanVal = val.substring(1);
                            node.setAttribute(attr, prefix + cleanVal);
                        }
                    }
                    // Case 2: Path is relative but needs prefix adjustment (e.g. "/assets/img")
                    // If we are deep, "/assets/img" looks for tr/masajlar/assets/img (wrong)
                    // It needs ../../assets/img
                    else if (!val.startsWith('../') && !val.startsWith('./') && !val.startsWith('http')) {
                        // This case is tricky. If the HTML was written as "/assets/...", it assumes root.
                        // But if we are in deep folder, we MUST prefix.
                        node.setAttribute(attr, prefix + val);
                    }
                }
            });
        }
    };

    // 3. Dynamic Home Link Fix for Multi-Lang
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

    // 4. CSP-safe image fallback wiring
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

    // 5. Booking Triggers
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

    // --- MAIN LOGIC ---

    // ULTRA MEGA FIX: Skip navbar loading if static navbar already exists
    if (document.getElementById('nv-main-nav')) {
        console.log('[Santis Nav] Static navbar detected. Skipping dynamic load.');

        // Still load footer
        const lang = document.documentElement.lang || 'tr';
        const intlLangs = ['en', 'de', 'fr', 'ru'];
        const isIntl = intlLangs.includes(lang) || intlLangs.some(l => window.location.pathname.includes('/' + l + '/'));
        const footerFile = isIntl ? "components/footer-en.html" : "components/footer.html";

        if (typeof window.loadComp === 'function') {
            window.loadComp(getPath(footerFile), "footer-container", () => {
                const footer = document.getElementById("footer-container");
                if (footer) {
                    fixPaths(footer); // CODE X FIX: Now fixPaths is defined!
                    bindBookingTriggers(footer);
                }
            });
        }
        // Init interactions for the static navbar
        if (typeof initNavbarInteractions === 'function') initNavbarInteractions();
        return;
    }

    // Dynamic Loading Logic
    if (typeof window.loadComp === 'function') {
        // Smart Language Detection (v2.2 -> v2.3: All non-TR = International)
        const lang = document.documentElement.lang || 'tr';
        const intlLangs = ['en', 'de', 'fr', 'ru'];
        const isIntl = intlLangs.includes(lang) || intlLangs.some(l => window.location.pathname.includes('/' + l + '/'));

        const navFile = isIntl ? "/components/navbar-en.html" : "/components/navbar.html";
        const footerFile = isIntl ? "/components/footer-en.html" : "/components/footer.html";

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
            if (!document.querySelector('script[src*="language-switcher.js"]')) {
                const sc = document.createElement('script');
                sc.src = getPath('/assets/js/language-switcher.js');
                document.body.appendChild(sc);
            }

            // APPLE LIQUID MEGA MENU ORCHESTRATOR INJECT
            if (!document.querySelector('script[src*="santis-mega-menu.js"]')) {
                const mm = document.createElement('script');
                mm.src = getPath('/assets/js/santis-mega-menu.js');
                mm.onload = () => { if (window.initLiquidMegaMenu) window.initLiquidMegaMenu(); };
                document.body.appendChild(mm);
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

    // --- Refresh language switcher if exists ---
    if (window.SANTIS_LANG && window.SANTIS_LANG.refresh) {
        window.SANTIS_LANG.refresh();
    }

    // --- SOVEREIGN MEGA MENU: THE DIMMER ENGINE ---
    let dimmer = document.querySelector('.nv-global-dimmer');
    if (!dimmer) {
        dimmer = document.createElement('div');
        dimmer.className = 'nv-global-dimmer';
        document.body.appendChild(dimmer);
    }
    const megaItems = document.querySelectorAll('.nav-item.has-mega');
    megaItems.forEach(item => {
        if (item.dataset.megaBound === '1') return;
        item.dataset.megaBound = '1';

        item.addEventListener('mouseenter', () => dimmer.classList.add('is-active'));
        item.addEventListener('mouseleave', () => dimmer.classList.remove('is-active'));
    });

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

    // --- SANTIS NAV: MAGNETIC HOVER ENGINE ---
    const magnetBtns = document.querySelectorAll('.nv-btn-primary');
    magnetBtns.forEach(magnetBtn => {
        if (magnetBtn.dataset.magnetBound === '1') return;
        magnetBtn.dataset.magnetBound = '1';

        magnetBtn.addEventListener('mousemove', (e) => {
            const rect = magnetBtn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            magnetBtn.classList.add('is-magnetic');
            magnetBtn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.02)`;
        });

        magnetBtn.addEventListener('mouseleave', () => {
            magnetBtn.classList.remove('is-magnetic');
            magnetBtn.style.transform = 'translate(0px, 0px) scale(1)';
        });
    });

    // --- SCROLL EFFECT (Quiet Luxury & Scroll Intent) ---
    const navbar = document.getElementById('nv-main-nav');
    if (navbar) {
        let ticking = false;
        let lastScrollY = window.scrollY;
        const SCROLL_THRESHOLD = 60; // px before shrink kicks in

        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;

                    // 1. Shrink state (Glassmorphism)
                    if (currentScrollY > SCROLL_THRESHOLD) {
                        navbar.classList.add('navbar--scrolled');

                        // 2. Scroll Intent (Hide on down, show on up)
                        if (currentScrollY > lastScrollY && currentScrollY > SCROLL_THRESHOLD * 2) {
                            // Scrolling down & past a safe buffer -> Hide
                            navbar.classList.add('navbar--hidden');
                        } else {
                            // Scrolling up -> Show instantly
                            navbar.classList.remove('navbar--hidden');
                        }
                    } else {
                        // At the top -> Reset everything
                        navbar.classList.remove('navbar--scrolled');
                        navbar.classList.remove('navbar--hidden');
                    }

                    lastScrollY = currentScrollY;
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // Initial state
    }
}

// ==========================================
// 🧠 PHASE 71.5: PREDICTIVE ORCHESTRATION & DIMMING
// ==========================================

const UIOrchestrator = {
    prefetchCache: new Set(),

    init() {
        this.bindHoverIntents();
        this.bindNavOverlay();
    },

    bindHoverIntents() {
        const navLinks = document.querySelectorAll('.nav-link[data-target]');

        navLinks.forEach(link => {
            let hoverTimer;
            link.addEventListener('mouseenter', () => {
                // 3 saniye menüde durursa, "İlgileniyor" varsay ve sayfayı ön-yükle
                hoverTimer = setTimeout(() => {
                    this.triggerCinematicPulse(link);
                    this.prefetch(link.dataset.target);
                }, 3000);
            });

            link.addEventListener('mouseleave', () => clearTimeout(hoverTimer));
        });
    },

    triggerCinematicPulse(element) {
        if (!element.classList.contains('intent-pulse')) {
            element.classList.add('intent-pulse');
            // Telemetry'e sinyal gönder (Phase 66 beslemesi)
            if (window.SantisOS && typeof window.SantisOS.broadcastTelemetry === 'function') {
                window.SantisOS.broadcastTelemetry({ event: "NAV_HESITATION", target: element.dataset.target });
            }
        }
    },

    prefetch(url) {
        if (!url || url === '#' || this.prefetchCache.has(url)) return;

        console.log(`⚡ [UI KERNEL] Predictive Pre-rendering initiated for: ${url}`);
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
        this.prefetchCache.add(url);
    },

    bindNavOverlay() {
        const overlay = document.getElementById('santis-nav-overlay');
        if (!overlay) return;

        const hasMegaItems = document.querySelectorAll('.nav-item.hover-trigger');
        hasMegaItems.forEach(item => {
            item.addEventListener('mouseenter', () => overlay.classList.add('active'));
            item.addEventListener('mouseleave', () => overlay.classList.remove('active'));
        });
    }
};

// Start Orchestrator after Nav loads
function startUIOrchestrator() {
    UIOrchestrator.init();
}

// Hook into the script loading process
const originalInitNavbarInteractions = initNavbarInteractions;
window.initNavbarInteractions = function () {
    originalInitNavbarInteractions();
    startUIOrchestrator();
};

// Auto-run on load
document.addEventListener("DOMContentLoaded", () => {
    initNavAndFooter();
    // Static navbar fallback for orchestrator
    if (document.getElementById('nv-main-nav')) {
        setTimeout(startUIOrchestrator, 500);
    }
});
