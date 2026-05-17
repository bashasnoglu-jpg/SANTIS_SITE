/* ========================================================================
 * 🦅 SANTIS ADMIN OS | THE SOVEREIGN HIVE (P2P Mesh & CRDT Core)
 * L10 Singularity: Faz VI - Hükümet Binası Operasyonu
 * ========================================================================
 * Doktrin: Sıfır-Sunucu Yükü, Mutlak Otonomi, Kesin Karar (Conflict-Free)
 * Mimari: Yjs (CRDT), WebRTC (DataChannels), WebTransport (UDP)
 * ======================================================================== */

// CDN üzerinden ESM Modülleri çekiyoruz. (İhtiyaç halinde local bundle yapılabilir)
import * as Y from 'https://esm.sh/yjs@13.6.1';
import { WebrtcProvider } from 'https://esm.sh/y-webrtc@13.0.2';

export class SovereignHive {
    constructor(roomName = 'santis-hq-command') {
        // 1. CRDT Çekirdeği (Conflict-free Replicated Data Type)
        // Yönetici çatışmalarını (Race Conditions) matematiksel birleştirir.
        this.ydoc = new Y.Doc();
        
        // 2. Dağıtık Durum Haritaları (Shared Types)
        // Herhangi bir admin 'reservations' değiştirdiğinde, tüm kovan (mesh) güncellenir.
        this.reservationsMap = this.ydoc.getMap('reservations');
        this.radarArray = this.ydoc.getArray('quantum-radar');
        
        // 3. WebRTC P2P Mesh Ağ Bağlantısı
        // Yönetici bilgisayarları (tarayıcılar) Node sunucusuna gerek kalmadan
        // birbirlerine UDP data kanalları üzerinden bağlanır.
        this.provider = new WebrtcProvider(roomName, this.ydoc, {
            signaling: [
                'wss://signaling.yjs.dev', // Fallback kamu sinyal sunucusu 
                // İleride kendi ws://hq.santis.com/signal uç noktamız eklenecek
            ]
        });

        // 4. WebTransport Uç Noktası (HTTP/3 UDP Bypass)
        this.wtTransport = null;
        this.wtDatagramWriter = null;
        this.initWebTransport('https://hq.santis.com/wt-telemetry');
        
        console.log(`🐝 [HIVE MESH] Otonom P2P kovan ağına bağlanıldı. Room: ${roomName}`);
        
        this.provider.on('synced', synced => {
            console.log(`🌐 [HIVE MESH] CRDT Eşzamanlanma Durumu: ${synced ? 'Tamamlandı' : 'Sürüyor...'}`);
        });

        this._bindObservers();
    }

    /**
     * WebTransport (UDP Hızında HTTP/3) Başlatılması. WebSocket baş-sıra bekleme sorununu çözer.
     */
    async initWebTransport(url) {
        if (typeof WebTransport === 'undefined') {
            console.warn("⚠️ [WebTransport] Tarayıcı desteklemiyor. Fallback (Beacon/P2P) devrede.");
            return;
        }

        try {
            this.wtTransport = new WebTransport(url);
            await this.wtTransport.ready;
            
            // Unreliable Datagram Kanalı Açılışı (Kayıp paketler umurunda olmaz, güncel hız önemlidir)
            this.wtDatagramWriter = this.wtTransport.datagrams.writable.getWriter();
            console.log("⚡ [WT QUASAR] WebTransport Telemetri Datagram Geçidi Açıldı (0ms Latency).");
        } catch (error) {
            console.warn("⚠️ [WT QUASAR] WebTransport sunucusu ulaşılamaz. Fallback devrede.", error);
        }
    }

    /**
     * Matrix Engine gibi UI bileşenlerine haber salacak Gözlemciler
     */
    _bindObservers() {
        // Rezervasyonlardan biri mutasyona uğradığında:
        this.reservationsMap.observe(event => {
            console.log("🧬 [CRDT] Mutasyon tespit edildi:", event.changes.keys);
            // Event.changes.keys üzerinden değişen rezervasyon ID'lerini Matrix'e iletebiliriz
            if (window.SovereignMatrixInstance) {
                event.changes.keys.forEach((change, key) => {
                     const asset = this.reservationsMap.get(key);
                     if (change.action === 'add' || change.action === 'update') {
                         window.SovereignMatrixInstance.injectGenesisCard(asset);
                     } else if (change.action === 'delete') {
                         window.SovereignMatrixInstance.purgeCard(key);
                     }
                });
            }
        });
    }

    /**
     * Rezervasyonu C++ hızında P2P mesh'te günceller (Çatışmasız)
     */
    updateReservation(assetId, metadata) {
        // `set` metodu, farklı adminler tarafından eşzamanlı çağrıldığında
        // Vector Clock teknolojisiyle sorunsuz birleşir.
        this.reservationsMap.set(assetId, metadata);
    }

    /**
     * Telemetri Verisini Yüksek Frekanslı WebTransport ile (veya P2P ile) Gönderir
     */
    async sendTelemetryPulse(data) {
        // Öncelik 1: HTTP/3 Datagram (WebTransport)
        if (this.wtDatagramWriter) {
            try {
                const encoder = new TextEncoder();
                const payload = encoder.encode(JSON.stringify(data));
                await this.wtDatagramWriter.write(payload);
                return;
            } catch (e) {
                console.warn("WT Hatası, Fallback...");
            }
        }

        // Öncelik 2: P2P Radar (Eğer sadece diğer adminlerin görmesi isteniyorsa HIVE kullanılır)
        this.radarArray.push([data]); 
        
        // Gereksiz uzamaması için kuyruğu kırk:
        if (this.radarArray.length > 50) this.radarArray.delete(0, 10);
    }
}

// Global olarak matrix engine veya sayfa kullanabilsin diye
window.SovereignHive = SovereignHive;
