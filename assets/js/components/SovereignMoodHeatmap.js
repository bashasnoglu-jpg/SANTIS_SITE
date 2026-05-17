import { sovereignStore } from '../../core/state/sovereignStore.js';

export class SovereignMoodHeatmap extends HTMLElement {
    constructor() {
        super();
        this.unsubscribe = null;
        // Sistemde izlediğimiz temel duygular
        this.moods = [
            { id: 'deep_relaxation', label: 'DEEP RELAX', color: 'from-nv-accent' },
            { id: 'recovery',        label: 'RECOVERY',   color: 'from-nv-gold'   },
            { id: 'detox',           label: 'DETOX',      color: 'from-emerald-500' },
            { id: 'beauty',          label: 'BEAUTY',     color: 'from-purple-400' },
            { id: 'couple_connection', label: 'COUPLE',   color: 'from-pink-500'  }
        ];
    }

    connectedCallback() {
        this.renderSkeleton();
        
        // Veriyi dinle ve reaktif olarak haritayı güncelle
        this.unsubscribe = sovereignStore.subscribe('moodMetrics', (data) => {
            this.updateHeatmap(data);
        });

        // İlk render için boş veriyi bas
        this.updateHeatmap(sovereignStore.getState().moodMetrics);
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
    }

    updateHeatmap(data) {
        if (!data) return;

        // 1. En yüksek talebi bul (Normalize etmek için)
        const values = Object.values(data);
        const maxVal = Math.max(...values, 1); // 0'a bölmeyi engellemek için min 1

        // 2. Her bir sütunu otonom olarak güncelle (Zero-Copy DOM Patch)
        this.moods.forEach(mood => {
            const count = data[mood.id] || 0;
            const intensity = count / maxVal; // 0.0 ile 1.0 arası oran
            
            const bar = this.querySelector(`#bar-${mood.id}`);
            const counter = this.querySelector(`#count-${mood.id}`);

            if (bar && counter) {
                counter.innerText = count;
                // Matematiksel estetik: Minimum %5 boy, yoğunluğa göre %100'e kadar uzar
                bar.style.height = `${Math.max(intensity * 100, 5)}%`;
                // Parlaklık da yoğunluğa göre artar
                bar.style.opacity = Math.max(intensity, 0.2).toFixed(2);
            }
        });
    }

    renderSkeleton() {
        // Dinamik CSS Grid ile kolonları oluşturuyoruz
        let barsHtml = this.moods.map(mood => `
            <div class="flex flex-col items-center justify-end h-32 relative group">
                <span id="count-${mood.id}" class="text-xs font-mono text-white/70 mb-2 transition-all duration-300">0</span>
                <div class="w-8 bg-gradient-to-t ${mood.color} to-transparent rounded-t-sm transition-all duration-700 ease-out" 
                     id="bar-${mood.id}" 
                     style="height: 5%; opacity: 0.2;">
                </div>
                <span class="text-xs uppercase tracking-widest mt-2 text-center absolute -bottom-6 w-16 -ml-4 opacity-50 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${mood.label}
                </span>
            </div>
        `).join('');

        this.innerHTML = `
            <div class="rounded-2xl border border-white/10 bg-black/20 p-6 pb-12 backdrop-blur shadow-xl w-full">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xs uppercase tracking-widest text-nv-accent font-mono">Live Mood MatriX</h3>
                    <div class="w-2 h-2 rounded-full bg-nv-accent animate-pulse"></div>
                </div>
                <div class="flex justify-between items-end gap-2 w-full px-4 mt-8">
                    ${barsHtml}
                </div>
            </div>
        `;
    }
}

customElements.define('sovereign-mood-heatmap', SovereignMoodHeatmap);
