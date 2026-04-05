/**
 * Santis Neural Link v1.0 (Sinir Ağı Çekirdeği)
 * Görevi: Frontend ile Sunucu arasındaki tüm asenkron trafiği tekilleştiren (Singleton) ve exponential backoff ile kendi kendini onaran WS tüneli.
 */

class SantisNeuralLink {
    constructor() {
        this.listeners = new Set();
        this.connect();
    }

    connect() {
        console.log("🧠 [NeuralLink] Ağ yönetimi Santis Stream'e (Amiral Gemisine) devredildi.");
        
        // Asenkron başlatmayı bekle
        const waitForStream = () => {
            const stream = window.santisStream || window.SovereignWS;
            if (stream) {
                stream.subscribe("message", (data) => this.handleMessage(data));
            } else {
                setTimeout(waitForStream, 100);
            }
        };
        waitForStream();
    }

    send(payload) {
        const stream = window.santisStream || window.SovereignWS;
        if (stream) {
            stream.send(payload);
        } else {
            console.warn("⚠️ [NeuralLink] Amiral Gemisi çevrimdışı, mesaj drop edildi:", payload);
        }
    }

    on(fn) {
        this.listeners.add(fn);
    }

    off(fn) {
        this.listeners.delete(fn);
    }

    handleMessage(data) {
        this.listeners.forEach(fn => fn(data));

        if (window.SantisOracle && window.SantisOracle.cache) {
            switch (data.type) {
                case 'invalidate':
                    for (const segment of ['critical', 'warm', 'cold']) {
                        if (window.SantisOracle.cache[segment].has(data.route)) {
                            window.SantisOracle.cache[segment].delete(data.route);
                            console.log(`🧹 [NeuralLink] Zero-Stale Update (Cache Purged): ${data.route}`);
                        }
                    }
                    if ('caches' in window) {
                        try {
                            caches.keys().then(keys => {
                                const swCache = keys.find(k => k.includes('santis-dynamic'));
                                if (swCache) caches.open(swCache).then(cache => cache.delete(data.route));
                            });
                        } catch (e) {}
                    }
                    break;
                case 'invalidate_all':
                    window.SantisOracle.cache.critical.clear();
                    window.SantisOracle.cache.warm.clear();
                    window.SantisOracle.cache.cold.clear();
                    console.log(`🔥 [NeuralLink] Full Cache Purge: L1 (RAM) Sıfırlandı.`);
                    break;
                case 'prefetch_hint':
                    if (data.route && typeof window.SantisOracle.prefetch === 'function') {
                        console.log(`📡 [NeuralLink] Server Hint Alındı. Pre-Cognitive Load: ${data.route}`);
                        window.SantisOracle.prefetch(data.route, 'cold');
                    }
                    break;
            }
        }
    }
}

// Global Bootloader Kaydı
import { register } from '../core/santis-kernel.js';
export let NeuralLink;
register('neural', async () => {
    NeuralLink = new SantisNeuralLink();
    window.SANTIS.NeuralLink = NeuralLink;
}, ['governor']);
