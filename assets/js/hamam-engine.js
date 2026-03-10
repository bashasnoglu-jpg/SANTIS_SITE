/**
 * SANTIS V10 SOVEREIGN HYBRID RENDERER
 * Engine: Hamam & Rituals
 * Architecture: Object Pool + DOM Recycling + Viewport Virtualization
 */

export async function init(signal) {
    if (signal?.aborted) return;
    console.log("[Sovereign Engine] 🩸 Hybrid Renderer Booting...");
    new HamamHybridRenderer().init();
}

class HamamHybridRenderer {

    constructor() {
        // Essential DOM Connections
        this.cards = document.querySelectorAll(".bento-card");
        this.matrixContainer = document.getElementById('santis-data-matrix-grid');
        this.railContainer = document.querySelector('#sovereign-mask-rail .rail-container');

        // Hybrid Renderer Core 
        this.pool = [];
        this.POOL_SIZE = 18; // Apple Standard
        this.visibleCount = 12; // Viewport limit
        this.data = [];

        // State Engine (Future Global State Prep)
        this.cart = {
            hamam: null,
            mask: null
        };

        this.masks = [
            { id: 'm1', title: 'Sothys Altın Maske', desc: 'Yaşlanma karşıtı 24K onarım.', price: 30, img: '/assets/img/cards/santis_card_skincare_lux.webp' },
            { id: 'm2', title: 'Havyar Göz Çevresi', desc: 'Havyar özlü yoğun göz çevresi bakımı.', price: 25, img: '/assets/img/cards/santis_card_skincare_detail_v2.webp' },
            { id: 'm3', title: 'Volkanik Kil Maskesi', desc: 'Derin gözenek temizliği ve sebum dengesi.', price: 20, img: '/assets/img/cards/santis_card_skincare_clay_v2.webp' },
            { id: 'm4', title: 'Aloe Vera Yoğun Nem', desc: 'Güneş sonrası acil nem ve yatıştırma.', price: 20, img: '/assets/img/cards/santis_card_skincare_v1.webp' },
            { id: 'm5', title: 'C Vitamini Parlaklık', desc: 'Solgun ciltler için aydınlatıcı C vitamini bombası.', price: 25, img: '/assets/img/cards/santis_card_recovery_lotion_v2.webp' },
            { id: 'm6', title: 'Oksijen Terapisi', desc: 'Hücre yenilenmesini hızlandıran oksijen kürü.', price: 35, img: '/assets/img/cards/santis_card_skin_advanced.webp' }
        ];

        this.initCartUI();
    }

    async init() {
        // Step 1: Pre-warm the Object Pool (createElement spam suppression)
        if (this.matrixContainer) this.initObjectPool();

        // Step 2: Parallax initialization
        if (this.cards.length > 0) this.initScroll();

        // Step 3: Data Load & Virtualization Trigger
        if (this.matrixContainer) {
            await this.loadDataMatrix();
            this.renderMasks();
        }
    }

    // ==========================================
    // HYBRID RENDERER: OBJECT POOL
    // ==========================================
    initObjectPool() {
        for (let i = 0; i < this.POOL_SIZE; i++) {
            const card = document.createElement("div");
            card.className = "matrix-service-card hamam-item";
            card.style.cssText = `position: relative; border-radius: 20px; overflow: hidden; aspect-ratio: 3/4; display: none; flex-direction: column; justify-content: flex-end; transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; border: 2px solid transparent;`;

            card.innerHTML = `
                <img class="sv-cover" src="" alt="Santis Service" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; filter: brightness(0.7) contrast(1.1);" loading="lazy" decoding="async">
                <div class="card-gradient" style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(5,5,5,0.95) 100%); z-index: 1;"></div>
                
                <div style="position: relative; z-index: 2; padding: 32px 24px; display: flex; flex-direction: column; gap: 8px;">
                    <h3 class="sv-title" style="font-family: 'Playfair Display', serif; font-size: 1.6rem; color: #fff; margin:0; letter-spacing: -0.5px; line-height: 1.1;"></h3>
                    <p class="sv-desc" style="font-family: 'Inter', sans-serif; font-size: 0.95rem; color: rgba(255,255,255,0.7); margin:0; line-height: 1.5; font-weight: 300;"></p>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
                        <span class="sv-price" style="color: #d4af37; font-family: 'Inter', sans-serif; font-weight: 500; font-size: 1.2rem;"></span>
                        <button class="magnetic-btn select-btn" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: #fff; padding: 10px 24px; border-radius: 99px; font-size: 0.8rem; letter-spacing: 1px; cursor: pointer; transition: all 0.3s ease; pointer-events: none;">SEÇ</button>
                    </div>
                </div>
            `;

            this.pool.push(card);
            this.matrixContainer.appendChild(card);
        }
        console.log(`[Sovereign Renderer] Object Pool Warmed: ${this.POOL_SIZE} DOM elements ready.`);
    }

    // ==========================================
    // HYBRID RENDERER: DOM RECYCLING
    // ==========================================
    updateCard(cardDOM, dataItem) {
        const trContent = dataItem.content?.tr || { title: dataItem.name, shortDesc: dataItem.description || "" };
        const price = dataItem.price?.amount || dataItem.price_eur || 0;
        const imagePath = dataItem.image || (dataItem.media?.hero ? `/assets/img/cards/${dataItem.media.hero}` : '/assets/img/cards/santis_card_hammam_lux.webp');
        const dataPayload = JSON.stringify({ id: dataItem.id, title: trContent.title, price: price });

        // Update values without recreating DOM
        cardDOM.querySelector('.sv-cover').src = imagePath;
        cardDOM.querySelector('.sv-cover').alt = trContent.title;
        cardDOM.querySelector('.sv-title').textContent = trContent.title;
        cardDOM.querySelector('.sv-desc').textContent = trContent.shortDesc;
        cardDOM.querySelector('.sv-price').textContent = `${price} €`;
        cardDOM.setAttribute('data-item', dataPayload);

        // Show element (if hidden)
        cardDOM.style.display = 'flex';

        // Reset dynamic UI state for recycled card
        const isSelected = this.cart.hamam && this.cart.hamam.id === dataItem.id;
        cardDOM.style.borderColor = isSelected ? '#d4af37' : 'transparent';
        const btn = cardDOM.querySelector('.select-btn');
        if (isSelected) {
            btn.style.background = '#d4af37';
            btn.style.color = '#000';
            btn.innerText = 'SEÇİLDİ';
        } else {
            btn.style.background = 'rgba(255,255,255,0.1)';
            btn.style.color = '#fff';
            btn.innerText = 'SEÇ';
        }
    }

    // ==========================================
    // HYBRID RENDERER: VIEWPORT VIRTUALIZATION
    // ==========================================
    renderViewport(startIndex = 0) {
        const end = Math.min(startIndex + this.visibleCount, this.data.length);
        const activeSlice = this.data.slice(startIndex, end);

        // Update required cards
        activeSlice.forEach((item, i) => {
            if (this.pool[i]) this.updateCard(this.pool[i], item);
        });

        // Hide unused cards in the pool
        for (let i = activeSlice.length; i < this.POOL_SIZE; i++) {
            if (this.pool[i]) this.pool[i].style.display = 'none';
        }

        // Re-attach listeners to the recycled active nodes
        this.attachSelectListeners('.hamam-item', 'hamam');
        if (window.SantisMagnetic) {
            window.SantisMagnetic.items = document.querySelectorAll('.magnetic-btn');
            window.SantisMagnetic.init();
        }
    }

    async loadDataMatrix() {
        try {
            const response = await fetch('/assets/data/services.json');
            if (!response.ok) throw new Error("HTTP Status " + response.status);

            const fullData = await response.json();
            this.data = fullData.filter(s => s.categoryId === 'ritual-hammam' || s.category === 'hammam' || s.id.includes('hamam'));

            if (this.data.length === 0) return;

            // Initial Render of first block
            this.renderViewport(0);

            // Phase 8: IntersectionObserver (Scroll Pipeline Trigger)
            const obsOptions = { root: null, rootMargin: "200px", threshold: 0 };
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Example: infinite scroll / lazy-load trigger
                        console.log("[Sovereign Renderer] Matrix in viewport. Checking constraints.");
                        // For a dataset > 18, we would increment startIndex here and re-renderViewport().
                        // Current dataset is 9 items, fitting perfectly into the initial slice.
                    }
                });
            }, obsOptions);

            observer.observe(this.matrixContainer);

        } catch (error) {
            console.error("[Sovereign Core] Data Matrix Load Failed:", error);
        }
    }

    // ==========================================
    // LEGACY METHODS & UI LOGIC
    // ==========================================
    initScroll() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        gsap.utils.toArray(this.cards).forEach((card, i) => {
            gsap.to(card, {
                yPercent: 10 + (i * 2),
                ease: "none",
                scrollTrigger: { trigger: card, scrub: true, start: "top bottom", end: "bottom top" }
            });
        });
    }

    renderMasks() {
        if (!this.railContainer) return;
        let html = '';
        this.masks.forEach(m => {
            const dataPayload = JSON.stringify({ id: m.id, title: m.title, price: m.price });
            html += `
            <div class="mask-item" data-item='${dataPayload}' style="min-width: 280px; width: 280px; border-radius: 16px; overflow: hidden; background: #111; position: relative; scroll-snap-align: start; cursor: pointer; border: 1px solid rgba(255,255,255,0.05); transition: border-color 0.3s ease;">
                <img src="${m.img}" alt="${m.title}" style="width: 100%; height: 180px; object-fit: cover; opacity: 0.8;">
                <div style="padding: 20px;">
                    <h4 style="font-family: 'Playfair Display', serif; color: #fff; margin:0 0 8px 0; font-size: 1.2rem;">${m.title}</h4>
                    <p style="color: rgba(255,255,255,0.6); font-family: 'Inter', sans-serif; font-size: 0.85rem; margin:0 0 16px 0;">${m.desc}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #d4af37; font-size: 1.1rem; font-family: 'Inter', sans-serif;">+${m.price} €</span>
                        <div class="select-indicator" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;"></div>
                    </div>
                </div>
            </div>`;
        });
        this.railContainer.innerHTML = html;
        this.attachSelectListeners('.mask-item', 'mask');
    }

    attachSelectListeners(selector, type) {
        // Remove old listeners to prevent stacking on recycled DOM nodes
        const oldItems = document.querySelectorAll(selector);
        oldItems.forEach(el => {
            const newEl = el.cloneNode(true);
            if (el.parentNode) el.parentNode.replaceChild(newEl, el);
        });

        // Attach fresh listeners
        const items = document.querySelectorAll(selector);
        items.forEach(el => {
            el.addEventListener('click', () => {
                const data = JSON.parse(el.getAttribute('data-item'));
                // Toggle logic
                if (this.cart[type] && this.cart[type].id === data.id) {
                    this.cart[type] = null; // deselect
                } else {
                    this.cart[type] = data; // select
                }
                this.updateUISelection(selector, type);

                // SantisBus Global Event Dispatch (Phase 8/9 Integration Prep)
                if (window.SantisBus) {
                    window.SantisBus.dispatchEvent(new CustomEvent("combo:selected", { detail: this.cart }));
                }
            });
        });
    }

    updateUISelection(selector, type) {
        const items = document.querySelectorAll(selector);
        items.forEach(el => {
            // Null check handling for recycled DOM nodes that might be hidden or missing item strings
            const dataStr = el.getAttribute('data-item');
            if (!dataStr) return;

            const data = JSON.parse(dataStr);
            const isSelected = this.cart[type] && this.cart[type].id === data.id;

            if (type === 'hamam') {
                el.style.borderColor = isSelected ? '#d4af37' : 'transparent';
                const btn = el.querySelector('.select-btn');
                if (isSelected) {
                    btn.style.background = '#d4af37';
                    btn.style.color = '#000';
                    btn.innerText = 'SEÇİLDİ';
                } else {
                    btn.style.background = 'rgba(255,255,255,0.1)';
                    btn.style.color = '#fff';
                    btn.innerText = 'SEÇ';
                }
            } else if (type === 'mask') {
                el.style.borderColor = isSelected ? '#d4af37' : 'rgba(255,255,255,0.05)';
                const indicator = el.querySelector('.select-indicator');
                if (isSelected) {
                    indicator.style.background = '#d4af37';
                    indicator.style.borderColor = '#d4af37';
                    indicator.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                } else {
                    indicator.style.background = 'transparent';
                    indicator.innerHTML = '';
                    indicator.style.borderColor = 'rgba(255,255,255,0.3)';
                }
            }
        });

        this.updateCartOverlay();
    }

    initCartUI() {
        this.cartOverlay = document.createElement('div');
        this.cartOverlay.style.cssText = `
            position: fixed; bottom: 0; left: 0; width: 100%; background: rgba(5,5,5,0.98); 
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); 
            border-top: 1px solid rgba(212,175,55,0.2); padding: 20px 0; z-index: 9999;
            transform: translateY(100%); transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex; justify-content: center; align-items: center; box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
        `;

        this.cartOverlay.innerHTML = `
            <div style="max-width: 1400px; width: 100%; padding: 0 4vw; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="color: rgba(255,255,255,0.6); font-family: 'Inter', sans-serif; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">Sovereign Paketiniz</span>
                    <h4 id="cart-summary-text" style="color: #fff; font-family: 'Playfair Display', serif; font-size: 1.4rem; margin: 0; font-weight: 400;">Seçim Bekleniyor...</h4>
                </div>
                <div style="display: flex; align-items: center; gap: 24px;">
                    <div style="text-align: right;">
                        <span style="color: rgba(255,255,255,0.5); font-size: 0.8rem; display: block; margin-bottom: 2px;">Toplam Tutar</span>
                        <span id="cart-total-price" style="color: #d4af37; font-size: 1.8rem; font-family: 'Inter', sans-serif; font-weight: 300;">0 €</span>
                    </div>
                    <button style="background: #fff; color: #000; border: none; padding: 14px 32px; font-family: 'Inter', sans-serif; font-weight: 500; font-size: 0.9rem; letter-spacing: 1px; border-radius: 99px; cursor: pointer; transition: opacity 0.3s ease;">REZERVASYON YAP</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.cartOverlay);
    }

    updateCartOverlay() {
        if (!this.cart.hamam && !this.cart.mask) {
            this.cartOverlay.style.transform = 'translateY(100%)';
            return;
        }

        this.cartOverlay.style.transform = 'translateY(0)';

        let total = 0;
        let summaryParts = [];

        if (this.cart.hamam) {
            total += this.cart.hamam.price;
            summaryParts.push(this.cart.hamam.title);
        }
        if (this.cart.mask) {
            total += this.cart.mask.price;
            summaryParts.push(`+ ${this.cart.mask.title}`);
        }

        document.getElementById('cart-summary-text').innerText = summaryParts.join(' ');
        document.getElementById('cart-total-price').innerText = `${total} €`;
    }
}

// Global Export Hook for SantisBootloader Omni-Routing
window.HamamHybridRenderer = HamamHybridRenderer;

// Fallback execution if the bootloader hasn't wrapped it up
// Note: Handled autonomously via Sovereign OS dispatch map.
