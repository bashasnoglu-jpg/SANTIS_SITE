/**
 * SANTIS Sovereign OS - Card Factory
 * Purges static debt, injects structured luxury.
 */
import { RITUAL_DATA } from '../data/sovereign-rituals.js';

export const SantisCardGenerator = {
    /**
     * @param {string} pageType - 'massage' | 'skincare'
     * @param {string} categoryFilter - 'highlight' | 'asya' vb.
     * @param {string} containerId - Hedef DOM ID
     */
    generate(pageType, categoryFilter, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return console.warn(`[FACTORY]: Container ${containerId} not found.`);

        const items = RITUAL_DATA[pageType]?.filter(item => item.cat === categoryFilter) || [];
        
        // Fragman kullanarak DOM manipülasyonunu optimize ediyoruz (Performance Master KPI)
        const fragment = document.createDocumentFragment();

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'santis-stack-card';
            card.setAttribute('data-ritual-id', item.id);
            card.dataset.ritualMeta = item.meta || '';
            card.dataset.ritualTitle = item.title || '';
            card.dataset.basePrice = item.price ? String(item.price) : '';
            card.dataset.displayPrice = item.price ? String(item.price) : '';
            
            // Quiet Luxury Background Logic
            card.style.backgroundImage = `url('/assets/img/cards/santis_hero_${item.img}.webp')`;

            const priceText = item.price ? ` — €${item.price}` : '';

            card.innerHTML = `
                <div class="santis-card-content">
                    <h3 class="santis-card__title">${item.title}</h3>
                    <span class="santis-card__meta">${item.meta}${priceText}</span>
                </div>
            `;
            
            fragment.appendChild(card);
        });

        container.innerHTML = ''; // Eski statik çöpleri temizle
        container.appendChild(fragment);
        console.log(`[FACTORY]: Synchronized ${items.length} nodes for ${categoryFilter} on stage ${containerId}`);
    }
};
