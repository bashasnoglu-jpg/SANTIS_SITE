(function () {
    // Navbar Logic
    function initNavbar() {
        const hamburger = document.getElementById('hamburger');
        const mobileMenu = document.getElementById('mobileMenu');

        if (hamburger && mobileMenu) {
            // Clone to remove old listeners if any (prevents duplicates on re-injection)
            const newHamburger = hamburger.cloneNode(true);
            if (hamburger.parentNode) {
                hamburger.parentNode.replaceChild(newHamburger, hamburger);
            }

            newHamburger.addEventListener('click', function () {
                this.classList.toggle('active');
                mobileMenu.classList.toggle('active');
                document.body.classList.toggle('no-scroll');
            });

            // Close menu when clicking a link
            const links = mobileMenu.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', () => {
                    newHamburger.classList.remove('active');
                    mobileMenu.classList.remove('active');
                    document.body.classList.remove('no-scroll');
                });
            });
        }
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavbar);
    } else {
        initNavbar();
    }

    // Expose for loader.js
    window.NV_INIT_NAVBAR = initNavbar;
})();
