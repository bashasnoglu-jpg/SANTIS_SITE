/**
 * SANTIS PRODUCT ENGINE v1.0 (TIER 3)
 * Features: Boutique Grid, Gift Hint (WhatsApp), Animations
 */

document.addEventListener('DOMContentLoaded', () => {
    // Race-Condition Check
    if (typeof window.SANTIS_PRODUCTS === 'undefined') {
        setTimeout(() => SANTIS_PRODUCT_ENGINE.init(), 300);
        return;
    }
    SANTIS_PRODUCT_ENGINE.init();
});

const SANTIS_PRODUCT_ENGINE = {
    config: {
        whatsapp: "905348350169",
        gridId: "products-grid"
    },

    init() {
        console.log("🛍️ Santis Product Engine v1.0 Active");
        this.renderAll();
        this.setupFilters();
    },

    // --- Core Render Logic ---
    renderAll(filter = 'all') {
        const grid = document.getElementById(this.config.gridId);
        if (!grid) return;

        const allData = window.SANTIS_PRODUCTS || [];
        const items = filter === 'all'
            ? allData
            : allData.filter(p => p.category === filter);

        if (items.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666;">Bu kategoride ürün bulunamadı.</div>';
            return;
        }

        grid.innerHTML = items.map((product, index) => {
            const price = product.price ? `${product.price}€` : "Danışınız";
            // Tier 3 Card Template
            return `
            <div class="santis-card-product curtain-reveal" style="animation-delay: ${index * 0.1}s; position:relative;">
                <div class="santis-product-img-box">
                    <img src="${product.img}" alt="${product.title}" class="santis-product-img" loading="lazy">
                    
                    <!-- Quick View Overlay (Hover) -->
                    <div class="product-overlay" style="
                        position:absolute; inset:0; background:rgba(0,0,0,0.6); 
                        display:flex; align-items:center; justify-content:center;
                        opacity:0; transition:opacity 0.3s ease;
                    ">
                       <button class="santis-btn santis-btn-sm santis-btn-outline" onclick="SANTIS_PRODUCT_ENGINE.giftHint('${product.id}')" style="background:#000; border-color:#fff;">
                          🎁 BUNU BANA AL
                       </button>
                    </div>
                </div>
                
                <style>
                    .santis-product-img-box:hover .product-overlay { opacity: 1; }
                </style>

                <h3 class="santis-title" style="font-size:18px; margin-bottom:5px; color:#fff;">${product.title}</h3>
                <span style="font-size:12px; color:var(--gold); text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:5px;">${product.brand}</span>
                <span class="santis-kicker">${price}</span>
            </div>
            `;
        }).join('');
    },

    // --- Interaction ---
    setupFilters() {
        const btns = document.querySelectorAll('[data-filter]');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderAll(btn.dataset.filter);
            });
        });
    },

    giftHint(id) {
        // Find product
        const product = (window.SANTIS_PRODUCTS || []).find(p => p.id === id);
        if (!product) return;

        // WhatsApp Logic
        const text = `Merhaba! Santis Club'da bu harika ürünü gördüm ve çok beğendim: "${product.title}". 🎁\nBelki aklında bir hediye fikri vardır? 😉\n\nDetaylar: ${window.location.href}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
};

// Global Helper for inline onclick
window.SANTIS_PRODUCT_ENGINE = SANTIS_PRODUCT_ENGINE;
