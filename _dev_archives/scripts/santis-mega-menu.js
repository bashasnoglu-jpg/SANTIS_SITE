// ==========================================
// 🍏 PHASE 71: APPLE MEGA MENU ORCHESTRATOR
// ==========================================

const MegaMenuEngine = {
    panel: null,
    content: null,
    overlay: null,
    navbar: null,
    activeTimeout: null,

    // JSON'dan veya DOM'dan gelecek içerikler
    menus: {
        'hamam': `
            <div class="liquid-menu-grid">
                <div>
                    <h4 class="liquid-col-title">Hamam Deneyimi</h4>
                    <a href="/tr/hamam/index.html#kopuk" class="liquid-link">Köpük Ritüeli</a>
                    <a href="/tr/hamam/index.html#sultan" class="liquid-link">Sultanın Hamamı</a>
                    <a href="/tr/hamam/index.html#geleneksel" class="liquid-link">Geleneksel Kese</a>
                </div>
                <div>
                    <h4 class="liquid-col-title">Zaman Çizelgesi</h4>
                    <a href="#" class="liquid-sublink">45 Dakikalık Arınma</a>
                    <a href="#" class="liquid-sublink">60 Dakikalık Dönüşüm</a>
                </div>
                <div class="col-span-2">
                    <!-- Boşluk veya İmaj gelebilir -->
                </div>
            </div>
        `,
        'masajlar': `
            <div class="liquid-menu-grid">
                <div>
                    <h4 class="liquid-col-title">Dünya Masajları</h4>
                    <a href="/tr/masajlar/index.html#bali" class="liquid-link">Bali Masajı</a>
                    <a href="/tr/masajlar/index.html#aromaterapi" class="liquid-link">Aromaterapi</a>
                    <a href="/tr/masajlar/index.html#derindoku" class="liquid-link">Derin Doku</a>
                </div>
                <div>
                    <h4 class="liquid-col-title">Özel Terapiler</h4>
                    <a href="/tr/masajlar/index.html#lomi" class="liquid-sublink">Lomi Lomi Nui</a>
                    <a href="/tr/masajlar/index.html#thai" class="liquid-sublink">Thai Geleneksel</a>
                    <a href="/tr/masajlar/index.html#sicaktasc" class="liquid-sublink">Sıcak Taş</a>
                </div>
            </div>
        `,
        'cilt': `
            <div class="liquid-menu-grid">
                <div>
                    <h4 class="liquid-col-title">Premium Cilt Bakımı</h4>
                    <a href="/tr/cilt-bakimi/index.html#antiaging" class="liquid-link">Anti-Aging Serisi</a>
                    <a href="/tr/cilt-bakimi/index.html#nemlendirici" class="liquid-link">Hyalüronik Nem</a>
                </div>
            </div>
        `,
        'hakkimizda': `
            <div class="liquid-menu-grid">
                <div>
                    <h4 class="liquid-col-title">Kurumsal</h4>
                    <a href="/tr/hakkimizda/index.html#felsefe" class="liquid-link">Manifestomuz</a>
                    <a href="/tr/hakkimizda/index.html#ekip" class="liquid-link">Sovereign Ekibi</a>
                </div>
            </div>
        `
    },

    init() {
        this.panel = document.getElementById('santis-liquid-menu');
        this.content = document.getElementById('liquid-menu-content');
        this.overlay = document.getElementById('liquid-nav-overlay');
        this.navbar = document.getElementById('nv-main-nav');

        if (!this.panel || !this.content || !this.overlay || !this.navbar) {
            console.warn("🍎 [Mega Menu] Elements missing. Delaying initialization.");
            return;
        }

        const triggers = document.querySelectorAll('.liquid-trigger[data-menu]');

        triggers.forEach(trigger => {
            trigger.addEventListener('mouseenter', (e) => this.openMenu(e.target.dataset.menu));
        });

        // Fare menüden tamamen çıkınca kapat
        this.navbar.addEventListener('mouseleave', () => this.scheduleClose());
        this.panel.addEventListener('mouseenter', () => clearTimeout(this.activeTimeout));
        this.panel.addEventListener('mouseleave', () => this.scheduleClose());
        this.overlay.addEventListener('mouseenter', () => this.scheduleClose());

        console.log("🍏 [Mega Menu] Apple Liquid Fiziği Aktif.");
    },

    openMenu(menuKey) {
        clearTimeout(this.activeTimeout);

        if (!this.menus[menuKey]) return this.closeMenu();

        // Cinematic open delay: hover on it for 300ms before it actually triggers
        this.activeTimeout = setTimeout(() => {
            // Kasa Zaten Açıksa Sadece İçeriği Değiştir (Video'daki Akışkanlık)
            if (this.panel.classList.contains('active')) {
                this.content.classList.remove('reveal');
                setTimeout(() => {
                    this.content.innerHTML = this.menus[menuKey];
                    this.content.classList.add('reveal');
                }, 200); // Hızlı fade geçişi (150 -> 200)
            } else {
                // Kasa Kapalıysa Önce İçeriği Bas, Sonra Kasayı Aç
                this.content.innerHTML = this.menus[menuKey];
                this.overlay.classList.add('active');
                this.panel.classList.add('active');
                setTimeout(() => this.content.classList.add('reveal'), 250); // 100 -> 250
            }
        }, 150); // 150ms hover trigger delay
    },

    scheduleClose() {
        this.activeTimeout = setTimeout(() => this.closeMenu(), 400); // 250 -> 400 (Hover affı daha geniş)
    },

    closeMenu() {
        if (this.overlay) this.overlay.classList.remove('active');
        if (this.panel) this.panel.classList.remove('active');
        if (this.content) this.content.classList.remove('reveal');
    }
};

// Vanilla event listener - async DOM content load uyumu
document.addEventListener('DOMContentLoaded', () => MegaMenuEngine.init());
// Eğer navigation dynamic load ediliyorsa (örn. santis-nav.js sonrası):
window.initLiquidMegaMenu = () => MegaMenuEngine.init();
