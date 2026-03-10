class HamamEngine {

    constructor() {
        this.cards = document.querySelectorAll(".bento-card");
        this.matrixContainer = document.getElementById('santis-data-matrix-grid');
    }

    async init() {
        // Safe check for GSAP scrolling cards
        if (this.cards.length > 0) {
            console.log("[HamamEngine] V10 Sovereign Engine Booted. Bento Cards found:", this.cards.length);
            this.initScroll();
        }

        // Execute Phase 4 Data Matrix Load
        if (this.matrixContainer) {
            await this.loadDataMatrix();
        }
    }

    initScroll() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn("[HamamEngine] GSAP or ScrollTrigger missing.");
            return;
        }

        gsap.utils.toArray(this.cards).forEach((card, i) => {
            gsap.to(card, {
                yPercent: 10 + (i * 2), // Staggered smooth parallax
                ease: "none",
                scrollTrigger: {
                    trigger: card,
                    scrub: true,
                    start: "top bottom",
                    end: "bottom top"
                }
            });
        });
    }

    async loadDataMatrix() {
        try {
            const response = await fetch('/assets/data/services.json');
            if (!response.ok) throw new Error("HTTP Status " + response.status);

            const data = await response.json();

            // Extract hammam specific rituals safely
            const hammamServices = data.filter(s => s.categoryId === 'ritual-hammam' || s.category === 'hammam' || s.id.includes('hamam'));

            if (hammamServices.length === 0) {
                console.warn("[HamamEngine] No hammam services found in JSON.");
                return;
            }

            this.renderServices(hammamServices);

        } catch (error) {
            console.error("[HamamEngine] Service data load failed:", error);
            this.matrixContainer.innerHTML = `<p style="color:red; font-family:'Inter',sans-serif;">Hizmet verisi yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>`;
        }
    }

    renderServices(services) {
        let html = '';
        services.forEach(s => {
            // Safe fallback for multi-language object variations
            const trContent = s.content && s.content.tr ? s.content.tr : { title: s.name, shortDesc: s.description || "" };
            const price = s.price && s.price.amount ? s.price.amount : (s.price_eur || 0);

            // Phase 69 Magnetic Button integrated inside Matrix Component
            html += `
            <div class="matrix-service-card" style="padding: 24px; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: rgba(5,5,5,0.8); display: flex; flex-direction: column; gap: 12px; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.4s ease;">
                <h3 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; color: #fff; margin:0; letter-spacing: -0.5px;">${trContent.title}</h3>
                <p style="font-family: 'Inter', sans-serif; font-size: 0.95rem; color: rgba(255,255,255,0.6); margin:0; line-height: 1.5; font-weight: 300;">${trContent.shortDesc}</p>
                <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; margin-top: 20px;">
                    <span style="color: #fff; font-family: 'Inter', sans-serif; font-weight: 400; font-size: 1.1rem;">${price} €</span>
                    <button class="magnetic-btn" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px 20px; border-radius: 99px; font-size: 0.75rem; letter-spacing: 1px; cursor: pointer;">DETAYLAR</button>
                </div>
            </div>`;
        });

        this.matrixContainer.innerHTML = html;

        // Re-initialize Magnetic UI bounds for freshly rendered buttons 
        if (window.SantisMagnetic) {
            window.SantisMagnetic.items = document.querySelectorAll('.magnetic-btn');
            window.SantisMagnetic.init();
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new HamamEngine().init();
});
