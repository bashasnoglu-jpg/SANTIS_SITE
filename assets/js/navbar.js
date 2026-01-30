/* SANTIS NAVBAR ENGINE v4.0 (Performance Optimized) */
(function () {
    const nav = document.getElementById('nv-main-nav');
    if (!nav) return;

    // SCROLL MATEMATİĞİ: Throttling (requestAnimationFrame)
    // Scroll olayını her pikselde değil, sadece ekran çizim anında tetikler.
    let isScrolling = false;

    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                // Matematiksel Eşik: 50px
                if (window.scrollY > 50) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
                isScrolling = false;
            });
            isScrolling = true;
        }
    }, { passive: true }); // Passive: Scroll performansını %20 artırır

    // MOBİL MENÜ FİZİĞİ
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            const isActive = mobileMenu.classList.toggle('active');
            hamburger.classList.toggle('active');

            // Kaydırmayı Kilitle/Aç
            document.body.style.overflow = isActive ? 'hidden' : '';
        });
    }

    // GÜVENLİK: Linklere tıklandığında menüyü kapat
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            hamburger.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Active Link Highlighter (Basitleştirilmiş)
    function highlightActive() {
        const path = window.location.pathname;
        const links = document.querySelectorAll('.nav-link, .mobile-link');
        links.forEach(l => {
            if (l.getAttribute('href') === path || (path.endsWith('/') && l.getAttribute('href').endsWith('index.html'))) {
                l.classList.add('active');
            } else {
                l.classList.remove('active');
            }
        });
    }
    highlightActive();
})();
