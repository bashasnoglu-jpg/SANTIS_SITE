/**
 * HAMMAM RENDER ENGINE v1.0
 * Handles rendering of Featured Cards, Index List, and Detail Pages.
 */

const HAMMAM_RENDER = {
    data: [],

    async init() {
        try {
            const response = await fetch('assets/js/hammam_tr.json');
            this.data = await response.json();

            // Dispatch Ready Event
            this.runPageLogic();
        } catch (error) {
            console.error("Failed to load Hammam Data:", error);
        }
    },

    runPageLogic() {
        // 1. Featured Section (Homepage)
        const featuredContainer = document.getElementById('hammamFeaturedGrid');
        if (featuredContainer) this.renderFeatured(featuredContainer);

        // 2. Index Page
        const indexContainer = document.getElementById('hammamIndexGrid');
        if (indexContainer) this.renderIndex(indexContainer);

        // 3. Detail Page
        // We detect detail page via explicit variable or URL slug
        // Assuming current page sets: window.HAMMAM_SLUG = 'ottoman-...'
        if (window.HAMMAM_SLUG) {
            this.renderDetail(window.HAMMAM_SLUG);
        }
    },

    // --- TEMPLATES ---
    getCardHTML(item) {
        // Generate Badges HTML
        const badges = item.badges.map(b => `<span class="nv-chip" data-badge="${b}">${b}</span>`).join('');

        return `
            <article class="nv-card" data-id="${item.id}">
                <a class="nv-card-link" href="tr/hammam/${item.slug}.html" aria-label="İncele: ${item.title}"></a>

                <div class="nv-kicker">HAMMAM RITUAL</div>
                <h3 class="nv-title">${item.title}</h3>
                <p class="nv-subtitle">${item.subtitle}</p>

                <div class="nv-meta-row">
                    <span class="nv-chip">${item.duration_min} dk</span>
                    <span class="nv-chip gold">${item.price_eur}€</span>
                    ${badges}
                </div>

                <div class="nv-actions">
                    <a class="nv-btn nv-btn-ghost" href="tr/hammam/${item.slug}.html">İncele</a>
                    <button class="nv-btn nv-btn-primary" data-add-to-cart="1" data-sku="${item.id}">
                        Sepete Ekle
                    </button>
                </div>
            </article>
        `;
    },

    // --- RENDERERS ---

    renderFeatured(container) {
        // Logic: Get first 4 items (or filter by 'featured' if we had that field)
        // For now, take index 0, 1, 3, 5 based on user brief order preference
        // Brief: Ottoman, Peeling+Foam, Sea Salt, Honey
        const targets = [
            'ottoman-hammam-tradition',
            'peeling-foam-massage',
            'sea-salt-peeling',
            'honey-ritual'
        ];

        const filtered = this.data.filter(i => targets.includes(i.slug));
        // Sort to match target order
        filtered.sort((a, b) => targets.indexOf(a.slug) - targets.indexOf(b.slug));

        container.innerHTML = filtered.map(item => this.getCardHTML(item)).join('');
    },

    renderIndex(container) {
        // Render ALL items
        container.innerHTML = this.data.map(item => this.getCardHTML(item)).join('');
    },

    renderDetail(slug) {
        const item = this.data.find(i => i.slug === slug);
        if (!item) return console.error("Ritüel bulunamadı: " + slug);

        // Bind Data to DOM Elements by ID
        // Expected IDs: h-title, h-subtitle, h-price, h-duration, h-desc, h-includes

        const setTxt = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        setTxt('h-title', item.title);
        setTxt('h-subtitle', item.subtitle);
        setTxt('h-price', `${item.price_eur}€`);
        setTxt('h-duration', `${item.duration_min} dk`);
        setTxt('h-desc', item.desc_short);

        // Render Includes List
        const incList = document.getElementById('h-includes');
        if (incList) {
            incList.innerHTML = item.includes.map(i => `<li>${i}</li>`).join('');
        }

        // WhatsApp Button
        const waBtn = document.getElementById('btn-whatsapp');
        if (waBtn) {
            const msg = `Merhaba, *${item.title}* (${item.price_eur}€) hakkında bilgi almak istiyorum.`;
            waBtn.href = `https://wa.me/905348350169?text=${encodeURIComponent(msg)}`;
        }

        // Add to Cart Button (Detail Page)
        const cartBtn = document.getElementById('btn-add-cart-detail');
        if (cartBtn) {
            cartBtn.dataset.sku = item.id;
            cartBtn.dataset.addItem = "1"; // Just marker
        }

        // Update Page Title
        document.title = `${item.title} - Santis Club Hamam`;
    }
};

// Auto Init
document.addEventListener('DOMContentLoaded', () => {
    HAMMAM_RENDER.init();
});
