/**
 * =======================================================
 * SANTIS DISTRIBUTED COGNITIVE RUNTIME - V42.4
 * Modül: Event Backpressure & Quarantine Layer
 * "Bütün sesler duyulmaya değer değildir. Kovanı koru."
 * =======================================================
 */

export const PRIORITY = {
    CRITICAL: 0, // Koro Uyarıları, Donanım Yangını, Rollback (ASLA DÜŞÜRÜLMEZ)
    HIGH: 1,     // Navigasyon Niyeti, Atomic Sync Kararları (Sadece Karantinada Düşer)
    NORMAL: 2,   // DOM Mutasyonları, State Değişimleri
    LOW: 3       // Scroll vektörleri, Hover, Telemetri (Basınç artarsa ANINDA EZİLİR)
};

class SovereignEventRegulator {
    constructor() {
        this.echoChamber = new Map();    // Sonsuz döngü (Feedback Loop) kalkanı
        this.burstCounters = new Map();  // Anlık fırtına (Event Storm) takibi
        this.quarantineJail = new Map(); // Cezalı (Susturulmuş) event tipleri
        
        // Karantina ve Yankı belleğini otonom olarak temizle (Zero-Garbage Memory Sweep)
        setInterval(() => this._decayMemory(), 2000);
    }

    /**
     * @param {string} eventType - Olayın imzası
     * @param {object} payload - Olay verisi
     * @param {number} priority - PRIORITY enum değeri
     * @param {number} currentPressure - Sistem donanım basıncı (0, 1, 2)
     * @returns {boolean} - true: Olayı geçir / false: Olayı acımasızca YOK ET
     */
    evaluate(eventType, payload, priority, currentPressure) {
        const now = performance.now();

        // 🛡️ 1. VIP GEÇİŞİ (Hayati Olaylar Her Zaman Geçer)
        if (priority === PRIORITY.CRITICAL) return true;

        // 🛡️ 2. KARANTİNA KONTROLÜ (Spam Yapan Sinir Ucu Cezalı mı?)
        if (this.quarantineJail.has(eventType)) {
            if (now < this.quarantineJail.get(eventType)) return false; // Hala hapiste, ez!
            this.quarantineJail.delete(eventType); // Süresi doldu, affet.
        }

        // 🛡️ 3. ECHO CANCELLATION (Sonsuz Döngü Kırıcı)
        // Eğer bu olay (aynı kimlik ve kaynak ile) az önce işlendiyse, Yankı (Echo) yapıyordur.
        const eventFingerprint = `${eventType}:${payload?.id || 'sys'}:${payload?._source || 'local'}`;
        const lastSeen = this.echoChamber.get(eventFingerprint);
        
        if (lastSeen && (now - lastSeen < 50)) {
            return false; // 50ms içinde aynı parmak izi geldi. Rezonans engellendi!
        }
        this.echoChamber.set(eventFingerprint, now);

        // 🛡️ 4. THE BACKPRESSURE (Acımasız Yük Atma - Load Shedding)
        // Eğer cihaz yanıyorsa (Pressure 2), Önceliği CRITICAL olmayan HER ŞEYİ çöpe at!
        if (currentPressure >= 2 && priority > PRIORITY.HIGH) {
            return false;
        }
        
        // Sistem ısınıyorsa (Pressure 1), NORMAL ve LOW öncelikli gürültüleri seyrelterek (Drop Rate) motoru soğut!
        if (currentPressure === 1 && priority >= PRIORITY.NORMAL) {
            if (Math.random() > 0.3) return false; // %70 Kıyım oranı
        }

        // 🛡️ 5. BURST RATE LIMITER (Spam / Event Storm Koruması)
        // Bir sensör saniyede sınırından fazla sinyal atıyorsa (örn: scroll), onu sustur.
        let tracker = this.burstCounters.get(eventType) || { count: 0, lastTick: now };
        
        if (now - tracker.lastTick > 1000) { // 1 saniyelik pencereler
            tracker.count = 0;
            tracker.lastTick = now;
        }

        tracker.count++;
        this.burstCounters.set(eventType, tracker);

        // Bir saniyede 120'den fazla düşük öncelikli olay gelirse bu bir Fırtınadır!
        if (tracker.count > 120 && priority !== PRIORITY.CRITICAL) {
            console.error(`☣️ [SDCR Quarantine] EVENT STORM TESPİT EDİLDİ: '${eventType}'. 3 saniye susturuldu.`);
            this.quarantineJail.set(eventType, now + 3000);
            return false; // Olay reddedildi
        }

        // Tüm kalkanları aştı. Sinir ağına (Bus) girmesine izin ver.
        return true; 
    }

    _decayMemory() {
        const now = performance.now();
        for (let [hash, time] of this.echoChamber.entries()) {
            // 1 saniyeden eski imzaları RAM'den sil (Memory Leak Önlemi)
            if (now - time > 1000) this.echoChamber.delete(hash);
        }
    }
}

export const QuarantineBarrier = new SovereignEventRegulator();
