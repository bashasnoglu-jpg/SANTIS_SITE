/**
 * SANTIS BOUTIQUE ORCHESTRATOR (Sovereign Experience Store V6)
 * ==========================================================
 * Otonom Render Motoru. CategoryOrchestrator'dan gelen sinyalleri dinler
 * ve SantisData'dan çektiği (SSOT) JSON ürün matrisini ekrana yansıtır.
 */

class SantisBoutiqueOrchestrator {
    constructor() {
        this.gridContainer = document.getElementById('boutique-product-grid');
        this.currentCategory = 'ALL';
        this.currentRefinement = null;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        if (!this.gridContainer) return;
        
        console.log("🦅 [Boutique Orchestrator] Sovereign Render Engine başlatıldı.");
        this.initBusListeners();
        
        // Bootloader'dan hemen sonra, SantisData dolduğunda ilk render'ı fırlat
        setTimeout(() => {
            this.renderProducts();
        }, 300);
    }

    initBusListeners() {
        if (!window.SantisBus) {
            console.warn("[Boutique Orchestrator] SantisBus bulunamadı. Otonomi çevrimdışı.");
            return;
        }

        window.SantisBus.on('category.changed', (data) => {
            this.currentCategory = data.category;
            this.currentRefinement = null;
            this.renderProducts();
        });

        window.SantisBus.on('category.refined', (data) => {
            this.currentCategory = data.category;
            this.currentRefinement = data.refinement; // {groupId, optionId, label}
            this.renderProducts();
        });
    }

    renderProducts() {
        if (!this.gridContainer || !window.SantisData) return;

        // 1. Otonom Veri Çekimi
        const products = window.SantisData.getProductsForCategory(this.currentCategory, this.currentRefinement);

        // 2. Transisyon (Sıfır Sürtünme Kinetiği)
        this.gridContainer.style.opacity = '0';
        this.gridContainer.style.transform = 'translateY(15px)';

        setTimeout(() => {
            this.gridContainer.innerHTML = '';
            
            if (!products || products.length === 0) {
                this.gridContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 60px; color: #666; font-family: var(--font-primary);">Bu lüks ritüel kombinasyonu için eser bulunamadı.</div>`;
            } else {
                products.forEach((item, index) => {
                    const el = document.createElement('article');
                    el.className = 'santis-experience-card santis-drag santis-magnetic';
                    el.style.transitionDelay = `${(index % 10) * 0.05}s`;
                    
                    // PRODUCT vs EXPERIENCE: Satın al demiyoruz, Ritüeli Edin/Deneyimi Uzat diyoruz.
                    el.innerHTML = `
                        <picture class="card-visual-wrapper">
                            <img data-visual-slot="${item.visual_slot}" alt="${item.title}" loading="lazy" decoding="async">
                        </picture>
                        <div class="card-meta">
                            <span class="luxury-tier">${item.tags[0] || item.subcategory}</span>
                            <h3>${item.title}</h3>
                            <p class="card-headline" style="font-size:0.8rem; color:#888; margin-top:5px; margin-bottom:15px; font-style:italic;">${item.headline}</p>
                            <div class="card-action-bar" style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="crypto-price" style="color:#c6a96b; font-family: var(--font-primary);">€${item.price}</span>
                                <button class="santis-btn-ghost" style="font-size:0.75rem;">Ritüeli Edin</button>
                            </div>
                        </div>
                    `;
                    this.gridContainer.appendChild(el);
                });
            }

            // 3. Sıvı Kinetik Gösterim
            requestAnimationFrame(() => {
                this.gridContainer.style.transition = 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)';
                this.gridContainer.style.opacity = '1';
                this.gridContainer.style.transform = 'translateY(0)';
                
                // Hydrate Visual Slots
                if (window.SantisVisualEngine) {
                    window.SantisVisualEngine.hydrateDOM(this.gridContainer);
                }
            });
        }, 200);
    }
}

// Global olarak başlat
window.SantisBoutiqueOrchestratorInst = new SantisBoutiqueOrchestrator();
