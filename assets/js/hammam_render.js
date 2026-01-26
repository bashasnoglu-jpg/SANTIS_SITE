/**
 * HAMMAM RENDER ENGINE v1.2 (Cinematic 3D Tilt + ZigZag Editorial)
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
        // Homepage Feature
        const featuredContainer = document.getElementById('hammamFeaturedGrid');
        if (featuredContainer) this.renderFeatured(featuredContainer);

        // Index Page List
        const indexContainer = document.getElementById('hammamIndexGrid');
        if (indexContainer) this.renderIndex(indexContainer);

        // Detail Page
        if (window.HAMMAM_SLUG) {
            this.renderDetail(window.HAMMAM_SLUG);
        }

        // Init Interactions
        this.initTiltEffect();
    },

    // --- TEMPLATE 1: OBSIDIAN CARD (Home & Index fallback) ---
    getCardHTML(item, extraClass = '') {
        const placeholder = `https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop`;
        const videoUrl = "https://cdn.coverr.co/videos/coverr-steam-rising-from-a-hot-spring-5226/1080p.mp4";

        return `
            <article class="obsidian-card ${extraClass}" onclick="window.location.href='tr/hammam/${item.slug}.html'">
                <div class="obsidian-bg" style="background-image: url('${placeholder}');"></div>
                <video class="obsidian-video" src="${videoUrl}" muted loop playsinline></video>
                <div class="obsidian-chip">
                    <span class="nv-kicker" style="color:var(--gold);">HAMMAM RITUAL</span>
                    <h3 class="obsidian-title">${item.title}</h3>
                    <div class="obsidian-meta">
                        <span>${item.duration_min} DK • ${item.price_eur}€</span>
                        <span>İNCELE &rarr;</span>
                    </div>
                </div>
            </article>
        `;
    },

    // --- TEMPLATE 2: ZIGZAG EDITORIAL (Index Page) ---
    getZigZagHTML(item) {
        // High-Res Placeholder for wide layout
        const placeholder = `https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop`;

        return `
            <article class="zigzag-item">
                <div class="z-visual">
                    <img src="${placeholder}" class="z-img" alt="${item.title}">
                </div>
                <div class="z-content">
                    <span class="z-kicker">${item.duration_min} MIN • ${item.price_eur} EUR</span>
                    <h2 class="z-title">${item.title}</h2>
                    <p class="z-desc">${item.desc_short || 'Geleneksel arınma ve modern lüksün eşsiz birleşimi.'}</p>
                    <div class="nv-actions" style="display:flex; gap:20px; align-items:center;">
                        <a href="tr/hammam/${item.slug}.html" class="nv-btn-underline">RITUELI INCELE</a>
                        <button class="nv-btn-underline" style="border:none; background:none; cursor:pointer;" onclick="SHOP.addItem('${item.id}'); event.stopPropagation();">
                            SEPETE EKLE +
                        </button>
                    </div>
                </div>
            </article>
        `;
    },

    // --- RENDERERS ---
    renderFeatured(container) {
        // Helper to map broken grid slots
        const targetSlugs = [
            { slug: 'ottoman-hammam-tradition', class: 'item-1' },
            { slug: 'peeling-foam-massage', class: 'item-2' },
            { slug: 'sea-salt-peeling', class: 'item-3' },
            { slug: 'honey-ritual', class: 'item-4' }
        ];

        let html = '';
        targetSlugs.forEach(target => {
            const item = this.data.find(i => i.slug === target.slug);
            if (item) html += this.getCardHTML(item, target.class);
        });
        container.innerHTML = html;
        this.initTiltEffect();
    },

    renderIndex(container) {
        // Check if we should use Grid or ZigZag based on container class
        if (container.classList.contains('editorial-zigzag-list')) {
            container.innerHTML = this.data.map(item => this.getZigZagHTML(item)).join('');
        } else {
            container.innerHTML = this.data.map(item => this.getCardHTML(item)).join('');
        }
    },

    renderDetail(slug) {
        // ... (Existing Detail Logic) ...
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
    },

    // --- 3D TILT ---
    initTiltEffect() {
        setTimeout(() => {
            const cards = document.querySelectorAll('.obsidian-card');
            cards.forEach(card => {
                const video = card.querySelector('video');
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const rX = (0.5 - y / rect.height) * 20;
                    const rY = (x / rect.width - 0.5) * 20;
                    card.style.transform = `rotateX(${rX}deg) rotateY(${rY}deg)`;
                    if (video && video.paused) video.play();
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = `rotateX(0deg) rotateY(0deg)`;
                    if (video) {
                        video.pause();
                        video.currentTime = 0;
                    }
                });
            });
        }, 500);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    HAMMAM_RENDER.init();
});
