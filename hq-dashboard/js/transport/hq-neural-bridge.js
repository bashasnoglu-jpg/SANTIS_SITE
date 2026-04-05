import { hqStore } from '../core/hq-store.js';
import { fetchHQSnapshot } from '../services/hq-api.js';

export class SovereignNeuralBridge {
    constructor(wssEndpoint) {
        this.wssUrl = wssEndpoint;
        this.socket = null;
        this.pollingTimer = null;
        this.bindCrossTabTelepathy();
    }

    bindCrossTabTelepathy() {
        // [ALFA PROTOKOLÜ] Kamikaze Dalışı için LocalStorage dinleyicisi
        window.addEventListener('storage', (e) => {
            if (e.key === 'santis_new_booking') {
                try {
                    const data = JSON.parse(e.newValue);
                    console.log(`[ALFA STRIKE] Nöral Ağ Üzerinden Saha Etkileşimi Algılandı: TR-01 Düğüm, Oda ${data.room}`);
                    hqStore.setState({ 
                        latestAlfaStrike: data,
                        aiInsight: { text: `HEDEF KİLİTLENDİ: TR-01 Düğümünde Otonom Ciro Mühürlendi (+${data.price}€).`, latency: 4, staffing: "Operasyonel" }
                    });
                } catch(err) {}
            }
        });
    }

    async igniteEngine() {
        console.log('[HQ OS] 🦅 Derin Uydu Taraması Başlatılıyor... (REST Bootstrap)');
        await this.fetchInitialState(); 
        this.establishSecureLink();     
    }

    async fetchInitialState() {
        try {
            const data = await fetchHQSnapshot();
            hqStore.setState(data);
            console.log('[HQ OS] 🌍 Başlangıç verisi haritaya mühürlendi.');
        } catch (error) {
            console.error('[HQ OS] ❌ REST Bootstrap Hatası!', error);
        }
    }

    establishSecureLink() {
        if (window.__HQ_USE_MOCK__) {
            console.log('[HQ OS] 🛑 MOCK Modu Aktif. WSS Simülasyonu Devrede.');
            this.simulateWss();
            return;
        }

        try {
            this.socket = new WebSocket(this.wssUrl);
        } catch (e) {
            this.handleDisconnect();
            return;
        }

        this.socket.onopen = () => {
            console.log('[HQ OS] 🟢 Nöral Köprü Kilitlendi. Pulse Devrede.');
            this.updatePulse('bg-emerald-500');
            
            if (this.pollingTimer) {
                clearInterval(this.pollingTimer);
                this.pollingTimer = null;
                console.log('[HQ OS] 🛑 REST Polling Kapatıldı (Bant Genişliği Korunuyor).');
            }
        };

        this.socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                this.handleWssMessage(msg);
            } catch(e) {}
        };

        this.socket.onclose = () => {
            this.handleDisconnect();
        };
    }
    
    handleWssMessage(msg) {
        switch(msg.type) {
            case 'NEW_BOOKING':
                const feed = [msg.data, ...(hqStore.state.feed || [])].slice(0, 50);
                const newRev = (hqStore.state.performance?.today_revenue || 0) + (msg.data.price_charged || 0);
                hqStore.setState({ 
                    feed, 
                    performance: { ...hqStore.state.performance, today_revenue: newRev }
                });
                break;
            case 'YIELD_UPDATE':
                hqStore.setState({ yieldStatus: msg.data });
                break;
        }
    }

    handleDisconnect() {
        console.warn('[HQ OS] 🔴 Sinyal Kaybı! Otonom Taktiksel Polling (Fallback) devreye alınıyor...');
        this.updatePulse('bg-amber-500');
        
        if (!this.pollingTimer) {
            this.pollingTimer = setInterval(() => this.fetchInitialState(), 10000);
        }
        setTimeout(() => this.establishSecureLink(), 5000);
    }

    updatePulse(colorClass) {
        const p1 = document.getElementById('wss-pulse-outer');
        const p2 = document.getElementById('wss-pulse-inner');
        if(p1 && p2) {
            p1.className = `animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorClass}`;
            p2.className = `relative inline-flex rounded-full h-3 w-3 ${colorClass}`;
        }
    }

    simulateWss() {
        this.updatePulse('bg-emerald-500');
        setInterval(() => {
            const prices = [110, 245, 120, 850];
            const hotels = ['Antalya Core', 'Budva Satellite'];
            const servs = ['AI Up-sell Booking', 'Web Direct Checkout', 'Mobile Push Conversion'];
            
            this.handleWssMessage({
                type: 'NEW_BOOKING',
                data: {
                    id: Math.random().toString(),
                    booked_at: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit' }),
                    hotel_name: hotels[Math.floor(Math.random() * hotels.length)],
                    room_number: `Online`,
                    service_name: servs[Math.floor(Math.random() * servs.length)],
                    status: 'CONFIRMED',
                    price_charged: prices[Math.floor(Math.random() * prices.length)]
                }
            });
        }, 8000);
    }
}
