// assets/js/war-room-radar.js - Sovereign Command Center

class SovereignWarRoom {
    constructor() {
        // FastAPI WebSocket Rotasına Bağlan
        this.wsUrl = 'ws://localhost:8000/api/v1/admin/ws/sovereign-pulse';
        this.totalRevenue = 0;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.initRadar();
    }

    initRadar() {
        if (window.SantisLog) window.SantisLog.info("👁️ [War Room] Radar Booting. Connecting to Sovereign Pulse...");
        this.socket = new WebSocket(this.wsUrl);

        this.socket.onopen = () => {
            if (window.SantisLog) window.SantisLog.info("🟢 [War Room] Connection Locked. Listening for live intelligence.");
            this.retryCount = 0; // Bağlanınca sayacı sıfırla
            // Ekrana lüks bir "Connected" glow efekti
            const led = document.getElementById('war-room-led');
            if (led) {
                led.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]";
            }
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.processIntelligence(data);
            } catch (err) {
                if (window.SantisLog) window.SantisLog.error("📡 [War Room] Neural Link Parse Error: " + (err.message || err));
            }
        };

        this.socket.onclose = () => {
            const led = document.getElementById('war-room-led');
            if (led) {
                led.className = "w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_#ef4444]";
            }
            if (this.retryCount < this.maxRetries) {
                let timeout = Math.pow(2, this.retryCount) * 3000;
                if (window.SantisLog) window.SantisLog.warn(`[War Room] Bağlantı koptu. Gizlice yeniden deneniyor... (Deneme: ${this.retryCount + 1})`);
                setTimeout(() => this.initRadar(), timeout);
                this.retryCount++;
            } else {
                if (window.SantisLog) window.SantisLog.error("🚨 [War Room] Radar Çevrimdışı. Maksimum deneme sayısına ulaşıldı. Lütfen backend'i kontrol edin.");
            }
        };
    }

    processIntelligence(data) {
        // 1. KANCA: Anlık Ziyaretçi Nabzı (Telemetri) - Backend V8 'data', 'current_score' formatı atıyor
        if (data.type === 'TELEMETRY_BEACON') {
            this.renderPulse(data);
        }
        // 2. KANCA: Dinamik Paket Üretimi (Satış İnfazı) - Backend V8 'data.offer' formatı atıyor
        else if (data.type === 'BLACK_ROOM_EXECUTION') {
            this.renderExecution(data);
        }
    }

    renderPulse(payload) {
        const feed = document.getElementById('live-pulse-feed');
        if (!feed) return;

        const item = document.createElement('li');

        // Ghost Score > 95 (Surge Mode - Kırmızı Ateş)
        // Ghost Score > 70 (Rescue Mode - Altın İkaz)
        let isSurge = 'border-gray-800 bg-gray-900/30';
        let badge = '';

        if (payload.current_score >= 95) {
            isSurge = 'border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)] critical-glow';
            badge = '<span class="px-1.5 py-0.5 rounded bg-red-500 text-white text-[8px] uppercase tracking-widest animate-pulse ml-2">Surge Fire</span>';
            // Ekrana büyük Alert patlatması
            this.triggerMassiveAlert("SURGE FIRE", payload.session_id);
        } else if (payload.current_score >= 70) {
            isSurge = 'border-[#D4AF37]/50 bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.3)] gold-glow';
            badge = '<span class="px-1.5 py-0.5 rounded bg-[#D4AF37] text-black font-bold text-[8px] uppercase tracking-widest animate-pulse ml-2">Sovereign Rescue</span>';
            // Ekrana büyük Alert patlatması
            this.triggerMassiveAlert("SOVEREIGN RESCUE", payload.session_id);
        }

        item.className = `p-2 rounded border border-l-2 mb-2 transition-all duration-300 flex items-center justify-between pulse-entry ${isSurge}`;
        item.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-gray-400 font-bold">${payload.session_id.split('_').pop() || payload.session_id}</span>
                ${badge}
            </div>
            <div class="text-right">
                <span class="text-santis-gold font-bold text-sm block">Score: ${payload.current_score}</span>
                <span class="text-blue-400 text-[8px] uppercase tracking-wider block">${payload.persona ? payload.persona.split(' ')[0] : 'GUEST'}</span>
            </div>
        `;

        feed.prepend(item);

        // Ekranda 15'ten fazla kayıt birikmesin (Performans)
        if (feed.children.length > 15) feed.removeChild(feed.lastChild);
    }

    renderExecution(data) {
        const feed = document.getElementById('execution-feed');
        const ticker = document.getElementById('revenue-ticker');

        if (!feed || !ticker) return;

        // Yeni üretilen Sanal Paketi ekrana bas (Backend .offer kullanıyor)
        const item = document.createElement('li');
        item.className = 'p-3 rounded border border-santis-gold bg-santis-gold/5 mb-2 relative overflow-hidden group';
        item.innerHTML = `
            <div class="absolute inset-0 bg-santis-gold/10 animate-pulse pointer-events-none"></div>
            <div class="relative z-10">
                <div class="flex items-center justify-between mb-1">
                    <strong class="text-emerald-500 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> TARGET LOCKED
                    </strong>
                    <span class="text-gray-400 text-[10px]">${data.session_id.split('_').pop()}</span>
                </div>
                <div class="text-[10px] text-gray-300 mb-1 flex justify-between">
                    <span>SKU: <span class="text-santis-gold font-bold tracking-widest">${data.offer.sku || data.offer.virtual_sku}</span></span>
                    <span class="text-white font-bold text-sm">€${data.offer.price || data.offer.dynamic_price}</span>
                </div>
                <div class="text-[8px] text-gray-500 mt-1 uppercase flex justify-between">
                    <span>Score Trigger: ${data.score}</span>
                    <span class="text-emerald-500/80">${data.timestamp}</span>
                </div>
            </div>
        `;
        feed.prepend(item);

        // Canlı Ciroyu (Ticker) Güncelle - Backend .offer.price veya .offer.dynamic_price kullanıyor
        let price = parseInt(data.offer.price || data.offer.dynamic_price || 0);
        this.totalRevenue += price;
        ticker.innerText = `€${this.totalRevenue.toLocaleString()}`;

        // Ticker'a lüks bir CSS büyüme efekti (Scale/Glow) ekle
        ticker.style.transform = "scale(1.1)";
        ticker.style.color = "#fff";
        ticker.style.textShadow = "0 0 15px #D4AF37";
        setTimeout(() => {
            ticker.style.transform = "scale(1)";
            ticker.style.color = "#D4AF37";
            ticker.style.textShadow = "none";
        }, 300);

        // 10'dan fazla kayıt tutma
        if (feed.children.length > 10) feed.removeChild(feed.lastChild);
    }

    triggerMassiveAlert(type, sessionId) {
        // Zaten aynı sessionId için bildirim verdiysek tekrarlama (anti-spam)
        if (!this.alertHistory) this.alertHistory = new Set();
        if (this.alertHistory.has(sessionId + type)) return;
        this.alertHistory.add(sessionId + type);

        // UI üzerine devasa Flash animasyonu
        let overlay = document.getElementById('sovereign-flash-alert');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sovereign-flash-alert';
            overlay.className = 'fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center opacity-0 transition-opacity duration-300';
            document.body.appendChild(overlay);
        }

        const isSurge = type.includes('SURGE');
        const colorClass = isSurge ? 'text-red-500 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]' : 'text-[#D4AF37] border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.5)]';
        const bgGrad = isSurge ? 'bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.2)_0%,transparent_70%)]' : 'bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.2)_0%,transparent_70%)]';

        overlay.innerHTML = `
            <div class="absolute inset-0 ${bgGrad}"></div>
            <div class="relative bg-black/80 border-2 ${colorClass} px-10 py-6 rounded-2xl text-center transform scale-90 transition-transform duration-300 backdrop-blur-md" id="alert-box">
                <div class="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">Target Locked</div>
                <h1 class="text-5xl font-bold heading-font uppercase tracking-widest ${isSurge ? 'text-red-500' : 'text-[#D4AF37]'}" style="text-shadow: 0 0 20px currentColor;">${type}</h1>
                <div class="mt-4 font-mono text-sm text-gray-300">Session: ${sessionId.split('_').pop() || sessionId}</div>
                <div class="mt-2 text-[10px] text-emerald-400 uppercase tracking-widest animate-pulse">Aurelia Agent Deployed</div>
            </div>
        `;

        overlay.style.opacity = '1';
        setTimeout(() => {
            const box = document.getElementById('alert-box');
            if (box) box.style.transform = 'scale(1.05)';
        }, 50);

        setTimeout(() => {
            overlay.style.opacity = '0';
        }, 3000);
    }
}

// Savaş Odasını Başlat
document.addEventListener('DOMContentLoaded', () => {
    window.SovereignRadar = new SovereignWarRoom();
});
