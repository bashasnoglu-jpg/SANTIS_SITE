/**
 * SANTIS SOVEREIGN OS - ADMIN RADAR CONTROLLER (V10)
 * Görev: Cross-Tab CQRS Senkronizasyonu & Reaktif DOM Engine
 */

class RadarEngine {
    constructor() {
        this.baseRevenue = 2450;
        this.baseUpsells = 42;
        this.chart = null;
        this.initDOM();
        this.initChart();
        this.bindEvents();
        this.renderState(true);
    }

    initDOM() {
        // Siber-Lüks Süzülme Animasyonları
        setTimeout(() => document.getElementById('ui-header').classList.remove('opacity-0', 'translate-y-4'), 100);
        setTimeout(() => document.getElementById('ui-vitals').classList.remove('opacity-0', 'translate-y-4'), 200);
        setTimeout(() => document.getElementById('ui-core').classList.remove('opacity-0', 'translate-y-4'), 300);
    }

    initChart() {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)'); 
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

        Chart.defaults.color = 'rgba(148, 163, 184, 0.95)';
        Chart.defaults.font.family = "'Inter', sans-serif";

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', 'Şimdi'],
                datasets: [{
                    label: 'Ciro (€)',
                    data: [1200, 1450, 1700, 1950, 2100, 2300, this.baseRevenue],
                    borderColor: '#10b981', backgroundColor: gradient,
                    borderWidth: 2, tension: 0.4, fill: true,
                    pointBackgroundColor: '#050505', pointBorderColor: '#10b981', pointBorderWidth: 2, pointRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }
        });
    }

    bindEvents() {
        // CQRS Cross-Tab Telemetri (spa-booking.html'den gelen mühürleri yakalar)
        window.addEventListener('storage', (e) => {
            if (e.key === 'santis_upsell_logs') {
                console.log('[RADAR V10] Saha Sinyali Alındı. DOM Senkronize ediliyor...');
                this.renderState(false);
            }
        });

        // Hızlı Reset Hilesi (Sunumlar İçin)
        document.getElementById('reset-trigger').addEventListener('dblclick', () => {
            localStorage.removeItem('santis_upsell_logs');
            localStorage.removeItem('santis_pending_booking');
            location.reload();
        });
    }

    renderState(isInitialLoad) {
        const defaultMock = [
            { time: '14:30', room: 'King Suite 402', ritual: 'Deep Tissue Massage', upsell: 'Kilitlendi (+45€)', status: 'accepted', price: 45 },
            { time: '15:00', room: 'Deluxe 118', ritual: 'Bali Geleneksel Ritüeli', upsell: 'Standart', status: 'standard', price: 0 }
        ];

        const logs = JSON.parse(localStorage.getItem('santis_upsell_logs')) || defaultMock;
        const feedContainer = document.getElementById('live-feed-list');
        feedContainer.innerHTML = '';
        
        let extraRevenue = 0;

        logs.forEach((item) => {
            if(item.price) extraRevenue += item.price;
            
            const card = document.createElement('div');
            // Yalnızca yeni düşen veri için Zümrüt Parlaması Effect
            const glowClass = (item.isNew && !isInitialLoad) ? 'border-santisEmerald bg-santisEmerald/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/5 bg-white/5 hover:border-santisEmerald/30';
            card.className = `p-3 rounded-xl border transition-all duration-700 ${glowClass}`;
            
            const badge = item.status === 'standard' 
                ? `<span class="text-[10px] text-gray-500 uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded">Sadece Ritüel</span>`
                : `<span class="text-[10px] text-santisEmerald uppercase tracking-widest font-bold flex items-center gap-1"><span class="w-1.5 h-1.5 bg-santisEmerald rounded-full ${item.isNew && !isInitialLoad ? 'animate-ping' : ''}"></span>${item.upsell}</span>`;

            card.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <span class="text-xs text-cyber-muted font-mono">${item.time}</span>
                    ${badge}
                </div>
                <div class="flex justify-between items-end">
                    <div>
                        <div class="text-sm font-medium text-white">${item.room || 'Lüks Düğüm'}</div>
                        <div class="text-[11px] text-cyber-muted font-serif italic">${item.ritual}</div>
                    </div>
                </div>
            `;
            feedContainer.appendChild(card);
            if (item.isNew) item.isNew = false; 
        });

        localStorage.setItem('santis_upsell_logs', JSON.stringify(logs));

        // Vitals UI Senkronizasyonu
        const totalRev = this.baseRevenue + extraRevenue;
        const revEl = document.getElementById('vital-revenue');
        
        if (revEl.innerText !== totalRev.toLocaleString('en-US')) {
            revEl.innerText = totalRev.toLocaleString('en-US');
            
            if(!isInitialLoad) {
                // CQRS Command Effect: Altın Parlama & Cihaz Titreşimi
                revEl.classList.add('text-santisGold', 'scale-110');
                if (navigator.vibrate) navigator.vibrate([20, 30, 20]); 
                setTimeout(() => revEl.classList.remove('text-santisGold', 'scale-110'), 600);
            }
            
            // Chart.js Uç Nokta Sıçraması
            this.chart.data.datasets[0].data[6] = totalRev;
            this.chart.update('active');
            
            // Oran ve Kapasite Artışı
            document.getElementById('vital-conversion').innerText = Math.min(100, this.baseUpsells + Math.floor(extraRevenue / 45));
            const newCap = Math.min(100, 85 + Math.floor(extraRevenue / 90));
            document.getElementById('vital-capacity').innerText = newCap;
            document.getElementById('capacity-bar').style.width = `${newCap}%`;
        }
    }
}

// OS Bootloader
document.addEventListener('DOMContentLoaded', () => {
    window.RadarEngine = new RadarEngine();
    console.log('[RADAR V10] CQRS Motoru Çevrimiçi. Otonom Dinleme Devrede.');
});
