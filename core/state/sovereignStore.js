/**
 * SovereignStore: Otoriter Reaktif Durum Yöneticisi
 * Sıfır bağımlılık (Zero-dependency), Vanilla JS ES6 Proxy tabanlı Single Source of Truth.
 */

class Store {
    constructor(initialState) {
        // Hangi state anahtarını (key), hangi fonksiyonların dinlediğini tutan kayıt defteri.
        this.listeners = new Map();

        // ES6 Proxy: State objemizin etrafına görünmez bir kalkan (interceptor) örüyoruz.
        this.state = new Proxy(initialState, {
            set: (target, key, value) => {
                // 1. Optimizasyon: Eğer yeni gelen değer, eski değerle aynıysa hiçbir şey yapma (Gereksiz render'ı önle).
                if (target[key] === value) return true;

                // 2. Güncelleme: Otoriter olarak yeni değeri state'e yaz.
                target[key] = value;

                // 3. Reaksiyon (Tetikleme): Bu spesifik 'key' değerini dinleyen bileşenler varsa, onlara yeni veriyi gönder.
                if (this.listeners.has(key)) {
                    this.listeners.get(key).forEach(callback => callback(value, target));
                }

                // 4. Global Dinleyiciler: Sistemin tamamını dinleyen loglayıcılar için (Opsiyonel).
                if (this.listeners.has('*')) {
                    this.listeners.get('*').forEach(callback => callback(key, value, target));
                }

                return true; // İşlemin başarılı olduğunu Proxy'e bildirir.
            }
        });
    }

    /**
     * Bileşenlerin state'e abone olmasını (dinlemesini) sağlayan metod.
     * @param {string} key - Dinlenecek state anahtarı (örn: 'telemetryData')
     * @param {function} callback - Veri değiştiğinde çalıştırılacak fonksiyon
     * @returns {function} - Bileşen ekrandan kalktığında aboneliği iptal edecek temizlik fonksiyonu (Unsubscribe)
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        
        this.listeners.get(key).add(callback);

        // Kapsülleme (Closure) ile Unsubscribe mantığı
        return () => {
            this.listeners.get(key).delete(callback);
        };
    }

    /**
     * Dışarıdan kontrollü veri güncelleme kapısı.
     */
    update(key, value) {
        this.state[key] = value;
    }

    /**
     * Güncel State'i anlık okumak için
     */
    getState(key) {
        return key ? this.state[key] : { ...this.state };
    }
}

// ---------------------------------------------------------
// BAŞLANGIÇ DURUMU (INITIAL STATE) - Sistemin Varsayılan Fabrika Ayarları
// ---------------------------------------------------------
const initialState = {
    // [connection] idle | connecting | live | degraded | reconnecting | failed
    connectionStatus: "idle", 
    // [telemetry] son parse edilmiş Zod verisi
    telemetryData: null,
    // [ui] God Mode panel state
    godModeActive: false,
    focusedEntity: { id: null, name: "Awaiting Signal...", score: 0 },
    routeMappings: [],
    // [commands] son gönderilen / ack
    lastCommandStatus: null,
    
    // [Sovereign State Machine] Command Life Cycle
    commandLifecycle: {
        status: 'idle', // 'idle' | 'submitting' | 'ack_success' | 'nack_error' | 'queued_offline'
        lastTraceId: null,
        error: null
    },

    // [SSE Read Line] Canlı Projection Yansıması
    liveIntentSnapshot: {
        connectionStatus: 'connecting', // 'connecting' | 'live' | 'disconnected'
        data: null, // Kanonik Projection verisi
        lastUpdatedAt: null
    },

    // [Fallback Radar] Canlı Performans Çöküş Uyarıları
    liveFallbackIncidents: {
      snapshot: null,
      connectionStatus: "disconnected", // connecting | live | disconnected
      error: null,
      tenantId: null,
      lastTraceId: null,
      lastUpdatedAt: null,
    },

    // [Revenue Pulse] Finansal Kalp Atışı
    revenueMetrics: {
        totalRevenue: 0,
        trend: 'neutral',
        delta: 0
    },

    // [Mood Heat Map] Duygu Isı Haritası
    moodMetrics: {
        deep_relaxation: 0,
        recovery: 0,
        detox: 0,
        beauty: 0,
        couple_connection: 0
    },

    // [Faz 7: Midas Surge] Fiyat Manipülasyon State'i
    activeSurge: {
        isEngaged: false,
        multiplier: 1.0,
        message: ""
    }
};

// Singleton olarak dışa aktarıyoruz. Sistemin her yerinde aynı beyin kullanılacak.
export const sovereignStore = new Store(initialState);
