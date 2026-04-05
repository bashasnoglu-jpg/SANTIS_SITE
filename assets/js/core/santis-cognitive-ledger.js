/**
 * =======================================================
 * SANTIS DISTRIBUTED COGNITIVE RUNTIME - V42.2
 * Modül: OMEGA Event Sourcing Ledger (Rollback Netcode)
 * "State is an illusion. Only the Ledger is absolute truth."
 * =======================================================
 */
export class SantisCognitiveLedger {
    constructor(arbitrator) {
        this.arbitrator = arbitrator;
        this.history = []; // Append-only mutlak gerçeklik kütüğü
        this.logicalClock = 0; // Lamport Timestamp (Dağıtık zaman damgası)
    }

    // Kule'den veya Lokalden gelen olayları yutar
    ingest(networkEvent) {
        // Olaylara zaman damgası vur (Eğer Kule vurmadıysa)
        const event = {
            ...networkEvent,
            vectorTime: networkEvent.vectorTime || ++this.logicalClock
        };

        // 1. Kütüğe Yaz
        this.history.push(event);
        
        // 2. Zaman Çizgisi Düzeltmesi (Rollback Tetikleyicisi)
        // Geçmişten gelen (lagged) paketleri Kuantum dizilimine sok!
        this.history.sort((a, b) => a.vectorTime - b.vectorTime);
        
        // 3. Zero-Garbage Drop Policy: Sadece son 150 olayı hatırla
        if (this.history.length > 150) this.history.shift();

        // 🚨 ZAMANI GERİ SAR VE GERÇEKLİĞİ YENİDEN HESAPLA 🚨
        this._recomputeReality();
    }

    _recomputeReality() {
        // Sistemi "Tabula Rasa" (Sıfır) noktasına çek
        let simulatedPressure = 0;
        let simulatedVelocity = 0;

        // Geçmişi ışık hızında (render etmeden) tekrar yaşa
        for (const evt of this.history) {
            if (evt.type === 'INTENT_SPIKE' || evt.type === 'PRESSURE_REPORT') {
                // KÖTÜMSER HAKEMLİK (Pessimistic Consensus)
                // Herhangi bir sekmeden/cihazdan yüksek yük geldiyse, kovanı boğ!
                const incomingPressure = evt.load > 0.85 ? 2 : (evt.load > 0.5 ? 1 : 0);
                simulatedPressure = Math.max(simulatedPressure, incomingPressure);
            }
            if (evt.type === 'SCROLL_VECTOR') {
                // Kinetik sönümlenmeyi ağdaki diğer hareketlere göre sentezle
                simulatedVelocity = (simulatedVelocity * 0.85) + (evt.velocity * 0.15);
            }
        }

        // 4. YENİ GERÇEKLİĞİ DONANIMA MÜHÜRLE
        if (this.arbitrator.budget.peerPressure !== simulatedPressure) {
            console.warn(`⏳ [SDCR Time-Travel] Zaman çizgisi düzeltildi! Yeni Koro Basıncı: Lvl ${simulatedPressure}`);
            this.arbitrator.budget.setPeerPressure(simulatedPressure);
            
            // Eğer geçmişten gelen gecikmiş bir paket bizi Throttle sınırına soktuysa:
            // Frame'i yırtma tehlikesine karşı acil durum protokolünü devreye sok!
            if (simulatedPressure >= 2 && this.arbitrator.isFlushing) {
                console.error(`💥 [SDCR] ROLLBACK KESİNTİSİ: Devam eden animasyon iptal edildi!`);
                // (Gelecek entegrasyon: ViewTransition.skipTransition() tetiklenecek)
            }
        }

        // Kinetik Süreklilik Koruması (CSS Compositor'a momentumu aktar)
        if (Math.abs(simulatedVelocity) > 0.05) {
            document.documentElement.style.setProperty('--l9-velocity', simulatedVelocity.toFixed(3));
        }
    }
}
