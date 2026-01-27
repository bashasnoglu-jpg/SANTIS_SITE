(function () {
    function initNavbar() {
        const nav = document.getElementById('nv-main-nav');
        if (!nav) return;
        if (nav.dataset.nvBound === "1") return;
        nav.dataset.nvBound = "1";

        // Scroll effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) nav.classList.add('scrolled');
            else nav.classList.remove('scrolled');
        });

        // Mobile menu
        const hamburger = document.getElementById('hamburger');
        const mobileMenu = document.getElementById('mobileMenu');
        if (hamburger && mobileMenu) {
            hamburger.addEventListener('click', () => {
                mobileMenu.classList.toggle('active');
                hamburger.classList.toggle('active');
                document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
            });
        }

        // CSP-Safe Handlers for Search & Cart
        const searchBtn = nav.querySelector('[data-action="search"]');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                if (window.SEARCH) window.SEARCH.open();
            });
        }

        const cartBtn = nav.querySelector('[data-action="cart"]');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                if (window.SHOP) window.SHOP.toggleCart();
            });
        }
    }

    // Public Init
    window.NV_INIT_NAVBAR = function () {
        initNavbar();
        highlightActiveLink();
        setTimeout(highlightActiveLink, 100);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.NV_INIT_NAVBAR);
    } else {
        window.NV_INIT_NAVBAR();
    }

    // Active Link Logic
    function highlightActiveLink() {
        const path = window.location.pathname;
        const links = document.querySelectorAll('.nav-link, .mega-item, .mobile-link');

        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;

            // Normalization for comparison
            const normHref = href.split('#')[0].replace(/\/$/, "");
            const normPath = path.split('#')[0].replace(/\/$/, "");

            let isActive = false;

            // 1. Exact Match
            if (normPath === normHref || normPath.endsWith(normHref)) {
                isActive = true;
            }
            // 2. Nested Content Match (e.g. /tr/cilt-bakimi/detail -> /tr/cilt-bakimi/index.html)
            else if (normHref.includes('/tr/cilt-bakimi/') && normPath.includes('/tr/cilt-bakimi/')) {
                isActive = true;
            }
            // 3. Nested Hammam Match
            else if (normHref.includes('/tr/hamam/') && normPath.includes('/tr/hamam/')) {
                isActive = true;
            }
            // 4. Nested Massage Match
            else if (normHref.includes('/tr/masajlar/') && normPath.includes('/tr/masajlar/')) {
                isActive = true;
            }

            if (isActive) {
                link.classList.add('active');
                // If it's a mega item, also highlight parent nav-link
                const parentItem = link.closest('.has-dropdown');
                if (parentItem) {
                    const parentLink = parentItem.querySelector('.nav-link');
                    if (parentLink) parentLink.classList.add('active');
                }
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Run on load and whenever URL changes (if SPA-like)
    highlightActiveLink();
    // Also run after a short delay to ensure DOM is ready if loaded via fetch
    setTimeout(highlightActiveLink, 100);
})();
