import { sovereignStore } from '/core/state/sovereignStore.js';

export class SovereignSurgePricing extends HTMLElement {
    constructor() {
        super();
        this.unsubscribe = null;
        // Başlangıç fiyatı (HTML attribute'undan veya state'ten alınabilir)
        this.basePrice = parseFloat(this.getAttribute('base-price')) || 100;
    }

    connectedCallback() {
        this.renderSkeleton();
        this.priceContainer = this.querySelector('#price-container');
        this.currentPriceEl = this.querySelector('#current-price');
        this.surgeIndicator = this.querySelector('#surge-indicator');
        this.haloWrapper = this.querySelector('#halo-wrapper');

        // Midas sinyalini dinle
        this.unsubscribe = sovereignStore.subscribe('activeSurge', (surgeData) => {
            this.updatePricing(surgeData);
        });
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
    }

    updatePricing(surge) {
        if (surge.isEngaged && surge.multiplier > 1) {
            const newPrice = (this.basePrice * surge.multiplier).toFixed(0);

            // 1. Nefes Alan Altın Hale Animasyonu (Tailwind sınıfları ile)
            this.haloWrapper.classList.add('shadow-[0_0_25px_rgba(212,175,55,0.6)]', 'border-[#d4af37]');
            this.haloWrapper.classList.remove('border-gray-700');

            // 2. Fiyat Güncellemesi ve Eski Fiyatın Çizilmesi
            this.currentPriceEl.innerHTML = `
                <span class="text-gray-500 line-through text-sm mr-2 transition-all duration-500">€${this.basePrice}</span>
                <span class="text-[#d4af37] font-bold text-3xl transition-all duration-700 animate-pulse">€${newPrice}</span>
            `;

            // 3. Sessiz Lüks Metni
            this.surgeIndicator.innerHTML = `
                <span class="text-[#d4af37] text-xs uppercase tracking-widest flex items-center justify-center gap-1 mt-2">
                    <svg class="w-3 h-3 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                    ${surge.message}
                </span>
            `;
            this.surgeIndicator.classList.remove('opacity-0', '-translate-y-2');
            this.surgeIndicator.classList.add('opacity-100', 'translate-y-0');
        }
    }

    renderSkeleton() {
        this.innerHTML = `
            <div id="halo-wrapper" class="relative bg-gray-900 border border-gray-700 p-6 rounded-lg transition-all duration-1000 ease-in-out w-72 text-center overflow-hidden mx-auto mt-8">
                <div class="sovereign-meta-text text-gray-400 mb-2 font-light">Deneyim Bedeli</div>
                <div id="price-container" class="min-h-[40px] flex items-center justify-center">
                    <span id="current-price" class="text-white font-light text-2xl transition-all duration-500">€${this.basePrice}</span>
                </div>
                <div id="surge-indicator" class="opacity-0 -translate-y-2 transition-all duration-700 ease-out h-6"></div>
            </div>
        `;
    }
}

customElements.define('sovereign-surge-pricing', SovereignSurgePricing);
