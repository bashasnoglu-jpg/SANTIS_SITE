/**
 * HAMMAM RENDER ENGINE v1.2 (Cinematic 3D Tilt Edition)
 * Adds Video Hover and Mouse-Tracking 3D Tilt.
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

        // INIT 3D TILT
        this.initTiltEffect();
    },

    // --- OBSIDIAN CARD TEMPLATE (With Video) ---
    getCardHTML(item, extraClass = '') {
        const bgImage = `assets/img/hammam/${item.slug}.jpg`;
        const placeholder = `https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop`;

        // Placeholder Video (Steam rising)
        const videoUrl = "https://cdn.coverr.co/videos/coverr-steam-rising-from-a-hot-spring-5226/1080p.mp4";

        return `
            <article class="obsidian-card ${extraClass}" onclick="window.location.href='tr/hammam/${item.slug}.html'">
                
                <!-- Background Image -->
                <div class="obsidian-bg" style="background-image: url('${placeholder}');"></div>
                
                <!-- Silent Loop Video -->
                <video class="obsidian-video" src="${videoUrl}" muted loop playsinline></video>

                <!-- Floating Chip -->
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

    // --- RENDERERS ---
    renderFeatured(container) {
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
        this.initTiltEffect(); // Re-init listeners
    },

    renderIndex(container) {
        container.innerHTML = this.data.map(item => this.getCardHTML(item)).join('');
        this.initTiltEffect();
    },

    renderDetail(slug) {
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
    },

    // --- 3D TILT LOGIC (Vanilla JS) ---
    initTiltEffect() {
        // Wait slightly for DOM
        setTimeout(() => {
            const cards = document.querySelectorAll('.obsidian-card');

            cards.forEach(card => {
                const video = card.querySelector('video');

                // Mouse Move
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    // Rotate Calculation (-15deg to 15deg)
                    const xPct = x / rect.width;
                    const yPct = y / rect.height;
                    const rX = (0.5 - yPct) * 20;
                    const rY = (xPct - 0.5) * 20;

                    card.style.transform = `rotateX(${rX}deg) rotateY(${rY}deg)`;

                    // Video Play on Hover
                    if (video && video.paused) video.play();
                });

                // Mouse Leave (Reset)
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
