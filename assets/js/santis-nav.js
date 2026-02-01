/**
 * SANTIS NAVIGATION MODULE v2.0 (Simplified)
 * Replaces dynamic rendering with reliable Static HTML injection.
 */

/**
 * FAILSAFE: Inject Navbar HTML Manually
 * Used when 'loadComp' fails or file:// protocol blocks external HTML loading.
 * This ensures the menu ALWAYS appears.
 */
function injectNavbar() {
    // console.log("🛡️ Navbar Failsafe: Injecting Static HTML...");
    const container = document.getElementById("navbar-container");
    if (!container) return;

    // Direct HTML Injection (Matches components/navbar.html)
    container.innerHTML = `
    <nav id="nv-main-nav" class="navbar" style="z-index: 999999;">
        <div class="navbar-container">
            <a href="index.html" class="logo">
                <div class="logo-symbol">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </div>
                <div class="logo-text">
                    <span class="brand-name">SANTIS</span>
                    <span class="brand-sub">CLUB</span>
                </div>
            </a>

            <!-- Desktop Links -->
            <div id="navRoot" class="nav-links nav-center">
                <div class="nav-item"><a class="nav-link" href="index.html">ANA SAYFA</a></div>
                <div class="nav-item"><a class="nav-link" href="tr/hamam/index.html">HAMAM</a></div>
                <div class="nav-item"><a class="nav-link" href="tr/masajlar/index.html">MASAJLAR</a></div>
                <div class="nav-item"><a class="nav-link" href="tr/cilt-bakimi/index.html">CİLT BAKIMI</a></div>
                <div class="nav-item"><a class="nav-link" href="tr/urunler/index.html">ÜRÜNLER</a></div>
                <div class="nav-item"><a class="nav-link" href="tr/galeri/index.html">GALERİ</a></div>
            </div>

            <div class="nav-actions">
                <a href="https://wa.me/905348350169" target="_blank" class="nv-btn nv-btn-sm nv-btn-primary mobile-hide">REZERVASYON</a>
                
                <!-- Language Placeholder -->
                <div id="santis-language-root" class="lang-wrapper notranslate"></div>

                <div class="hamburger-btn" id="hamburger" aria-label="Menü">
                    <span class="bar"></span>
                    <span class="bar"></span>
                </div>
            </div>
        </div>
    </nav>
    <div class="mobile-menu-overlay" id="mobileMenu" style="z-index: 999998;">
        <div class="mobile-menu-content">
            <a href="index.html" class="mobile-link">ANA SAYFA</a>
            <a href="tr/hamam/index.html" class="mobile-link">HAMAM RİTÜELLERİ</a>
            <a href="tr/masajlar/index.html" class="mobile-link">DÜNYA MASAJLARI</a>
            <a href="tr/cilt-bakimi/index.html" class="mobile-link">CİLT BAKIMI</a>
            <a href="tr/urunler/index.html" class="mobile-link">ÜRÜNLER</a>
            <a href="tr/galeri/index.html" class="mobile-link">GALERİ</a>
            <a href="booking.html" class="mobile-link">REZERVASYON</a>
        </div>
    </div>
    `;

    // Initialize Interactions (Hamburger)
    initNavbarInteractions();

    // Refresh language switcher if exists
    if (window.SANTIS_LANG && window.SANTIS_LANG.refresh) {
        window.SANTIS_LANG.refresh();
    }
}

function initNavbarInteractions() {
    setTimeout(() => {
        const ham = document.getElementById('hamburger');
        const menu = document.getElementById('mobileMenu');
        if (ham && menu) {
            // Remove old listeners to prevent duplicates
            const newHam = ham.cloneNode(true);
            ham.parentNode.replaceChild(newHam, ham);

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
    }, 100);
}

// Auto-run on load if container is empty behavior
document.addEventListener("DOMContentLoaded", () => {
    // Wait for loader.js to try first
    setTimeout(() => {
        const c = document.getElementById("navbar-container");
        if (c && c.innerHTML.trim() === "") {
            injectNavbar();
        } else {
            // Even if loaded via HTML include, we need interactions
            initNavbarInteractions();
        }
    }, 300);
});
