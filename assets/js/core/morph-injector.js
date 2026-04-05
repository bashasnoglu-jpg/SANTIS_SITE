/**
 * SANTIS OS - AI DYNAMIC MORPH INJECTOR (Phase 21)
 * Fetches tailored recommendations from Concierge API and renders them 
 * dynamically for Zero-Jank View Transitions.
 */

class MorphInjector {
    constructor() {
        // Prevent on non-content pages
        const path = window.location.pathname;
        if (path === '/' || path.toLowerCase() === '/index.html' || path.includes('/admin')) return;

        // Initialize only during idle time to avoid blocking core rendering
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.bootstrap());
        } else {
            setTimeout(() => this.bootstrap(), 2000);
        }
    }

    async bootstrap() {
        console.log("🦅 [Morph Injector] Uyanıyor...");
        
        try {
            const response = await fetch('/api/v1/concierge/suggestions');
            if (!response.ok) throw new Error('Gateway unreachable');
            const data = await response.json();
            
            if (data.status === 'active' && data.recommendations && data.recommendations.length > 0) {
                this.injectAIRecommendation(data.recommendations[0]);
            }
        } catch (error) {
            console.warn("⚠️ [Morph Injector] Concierge verisi alınamadı.", error);
        }
    }

    injectAIRecommendation(rec) {
        // Find the best place to inject the card on a detail page
        const actionsContainer = document.querySelector('.cin-actions');
        if (!actionsContainer) return; // Only process on cinematic detail pages

        // Build the dynamic Morph Card
        const cardHTML = `
            <div class="text-center santis-concierge-morph-box" style="margin-top: 4rem; border-top: 1px solid rgba(212,175,55,0.2); padding-top: 3rem;">
                <span style="font-size: 0.75rem; letter-spacing: 0.2rem; color: #8b7a5e; text-transform: uppercase;">
                    Sizin İçin Önerilen
                </span>
                <div class="cursor-pointer santis-card" style="max-width: 400px; margin: 2rem auto; text-align: left;">
                    <a href="${rec.url}" class="card-link" style="text-decoration: none; color: inherit; display: block;">
                        <div style="overflow: hidden; border-radius: 4px;">
                            <img src="${rec.image}" alt="${rec.title}" class="w-full bento-image" style="height: 250px; object-fit: cover; transition: transform 0.6s ease;" />
                        </div>
                        <h3 class="bento-title" style="margin-top: 1rem; font-family: 'Playfair Display', serif; font-size: 1.5rem;">${rec.title}</h3>
                        <p style="color: #666; font-size: 0.9rem; line-height: 1.5;">${rec.description}</p>
                        <span class="text-[#d4af37]" style="display: inline-block; margin-top: 1rem; font-weight: bold;">${rec.price}</span>
                    </a>
                </div>
            </div>
        `;

        // Inject right after the actions block natively
        actionsContainer.insertAdjacentHTML('afterend', cardHTML);
        console.log(`💎 [Morph Injector] Karta Morph Büyüsü Eklendi: ${rec.title}`);
        
        // Phase 23: Predictive Rendering. Instantly prerender this highly probable destination.
        if (typeof SantisSpeculator !== 'undefined') {
            SantisSpeculator.prerender(rec.url);
        }
    }
}

// Auto-boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new MorphInjector());
} else {
    new MorphInjector();
}
