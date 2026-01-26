/**
 * HAMMAM RENDER ENGINE v1.1 (Editorial Edition)
 * Renders Obsidian Cards for High-Fashion Layout
 */

const HAMMAM_RENDER = {
    data: [],

    async init() {
        try {
            const response = await fetch('assets/js/hammam_tr.json');
            this.data = await response.json();
            this.runPageLogic();
        } catch (error) {
            console.error("Failed to load Hammam Data:", error);
        }
    },

    runPageLogic() {
        const featuredContainer = document.getElementById('hammamFeaturedGrid');
        if (featuredContainer) this.renderFeatured(featuredContainer);

        const indexContainer = document.getElementById('hammamIndexGrid');
        if (indexContainer) this.renderIndex(indexContainer);

        if (window.HAMMAM_SLUG) {
            this.renderDetail(window.HAMMAM_SLUG);
        }
    },

    // --- OBSIDIAN CARD TEMPLATE ---
    getCardHTML(item, extraClass = '') {
        // Fallback image (random abstract for demo)
        const bgImage = `assets/img/hammam/${item.slug}.jpg`;
        // Note: Ideally check if image exists, or use a consistent placeholder
        const placeholder = `https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop`;

        return `
            <article class="obsidian-card ${extraClass}" onclick="window.location.href='tr/hammam/${item.slug}.html'">
                <div class="obsidian-bg" style="background-image: url('${placeholder}');"></div>
                
                <div class="obsidian-chip">
                    <span class="nv-kicker" style="color:var(--gold);">HAMMAM RITUAL</span>
                    <h3 class="obsidian-title">${item.title}</h3>
                    
                    <div class="obsidian-meta">
                        <span>${item.duration_min} DK • ${item.price_eur}€</span>
                        <span>İNCELE &rarr;</span>
                    </div>
                </div>

                <!-- Hidden Actions for Cart Logic (if needed globally) -->
                 <button class="nv-btn nv-btn-primary" data-add-to-cart="1" data-sku="${item.id}" 
                         style="position:absolute; top:20px; right:20px; width:40px; height:40px; padding:0; border-radius:50%; opacity:0; pointer-events:none;">
                    +
                </button>
            </article>
        `;
    },

    renderFeatured(container) {
        // Broken Grid Mapping
        // Item 1: Ottoman (Hero) -> .item-1
        // Item 2: Peeling -> .item-2
        // Item 3: Sea Salt -> .item-3
        // Item 4: Honey -> .item-4

        const targetSlugs = [
            { slug: 'ottoman-hammam-tradition', class: 'item-1' },
            { slug: 'peeling-foam-massage', class: 'item-2' },
            { slug: 'sea-salt-peeling', class: 'item-3' },
            { slug: 'honey-ritual', class: 'item-4' }
        ];

        let html = '';
        targetSlugs.forEach(target => {
            const item = this.data.find(i => i.slug === target.slug);
            if (item) {
                html += this.getCardHTML(item, target.class);
            }
        });

        container.innerHTML = html;
    },

    renderIndex(container) {
        // Standard Grid for Index Page
        container.innerHTML = this.data.map(item => this.getCardHTML(item)).join('');
    },

    renderDetail(slug) {
        // Same logic as v1.0, just data binding
        const item = this.data.find(i => i.slug === slug);
        if (!item) return;

        const setTxt = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        setTxt('h-title', item.title);
        setTxt('h-subtitle', item.subtitle);
        setTxt('h-price', `${item.price_eur}€`);
        setTxt('h-duration', `${item.duration_min} dk`);
        setTxt('h-desc', item.desc_short);

        const incList = document.getElementById('h-includes');
        if (incList) {
            incList.innerHTML = item.includes.map(i => `<li>${i}</li>`).join('');
        }

        document.title = `${item.title} | Santis Editorial`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    HAMMAM_RENDER.init();
});
