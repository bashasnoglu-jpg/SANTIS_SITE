import { sovereignStore } from '../../core/state/sovereignStore.js';

export class SovereignRevenuePulse extends HTMLElement {
    constructor() {
        super();
        this.unsubscribe = null;
    }

    connectedCallback() {
        this.renderSkeleton();
        this.pulseElement = this.querySelector('#revenue-pulse-amount');
        this.trendElement = this.querySelector('#revenue-trend-indicator');

        // Store'daki 'revenueMetrics' state'ini dinle
        this.unsubscribe = sovereignStore.subscribe('revenueMetrics', (data) => {
            this.updateUI(data);
        });
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
    }

    updateUI(data) {
        if (!data) return;

        // Rakamı güncelle ve animasyon tetikle
        this.pulseElement.innerText = `€${data.totalRevenue.toLocaleString()}`;
        this.pulseElement.classList.remove('text-[#d4af37]');
        this.pulseElement.classList.add('text-green-400');
        
        setTimeout(() => {
            this.pulseElement.classList.remove('text-green-400');
            this.pulseElement.classList.add('text-[#d4af37]');
        }, 500);

        // Trend göstergesi
        if (data.trend === 'up') {
            this.trendElement.innerHTML = `▲ +${data.delta}%`;
            this.trendElement.className = "text-green-400 text-xs ml-2";
        } else if (data.trend === 'down') {
            this.trendElement.innerHTML = `▼ -${data.delta}%`;
            this.trendElement.className = "text-red-400 text-xs ml-2";
        } else {
            this.trendElement.innerHTML = `--`;
            this.trendElement.className = "text-gray-500 text-xs ml-2";
        }
    }

    renderSkeleton() {
        this.innerHTML = `
            <div class="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur font-mono flex justify-between items-center shadow-xl">
                <div>
                    <h3 class="text-xs uppercase tracking-[0.22em] text-white/50 mb-1">Live Revenue Pulse</h3>
                    <div class="flex items-baseline">
                        <span id="revenue-pulse-amount" class="text-2xl text-[#d4af37] font-bold transition-colors duration-300">
                            €0
                        </span>
                        <span id="revenue-trend-indicator" class="text-gray-500 text-xs ml-2">--</span>
                    </div>
                </div>
                <div class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
            </div>
        `;
    }
}

customElements.define('sovereign-revenue-pulse', SovereignRevenuePulse);
