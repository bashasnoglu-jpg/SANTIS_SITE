/**
 * Phase 81: Event-Driven Luxury SaaS Kernel
 * Santis OS Core: The Event Bus (İmparatorluğun Sinir Sistemi)
 */

const SantisEventBus = {
    events: {},

    /**
     * Abone Ol (Subscribe)
     * @param {string} eventName 
     * @param {function} fn 
     */
    subscribe: function (eventName, fn) {
        this.events[eventName] = this.events[eventName] || [];
        this.events[eventName].push(fn);
    },

    /**
     * Abonelikten Çık (Unsubscribe)
     * @param {string} eventName 
     * @param {function} fn 
     */
    unsubscribe: function (eventName, fn) {
        if (this.events[eventName]) {
            for (let i = 0; i < this.events[eventName].length; i++) {
                if (this.events[eventName][i] === fn) {
                    this.events[eventName].splice(i, 1);
                    break;
                }
            }
        }
    },

    /**
     * Olayı Yayınla (Publish)
     * @param {string} eventName - Örn: 'intent:change', 'telemetry:hesitation'
     * @param {object} data - Payload
     */
    publish: function (eventName, data) {
        console.log(`⚡ [EVENT BUS] Firing: ${eventName}`);

        // 1. Internal JS Listeners'a Dağıt
        if (this.events[eventName]) {
            this.events[eventName].forEach(function (fn) {
                try {
                    fn(data);
                } catch (e) {
                    console.error(`[EVENT BUS] Error in listener for ${eventName}:`, e);
                }
            });
        }

        // 2. Global DOM Event olarak fırlat (Native Window Listener kullananlar için)
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));

        // 3. Telemetry veya backend senkronizasyonu gerektiren olaylar (İlerleyen fazlarda WebSocket/Redis Stream eklenecek)
        if (eventName.startsWith('telemetry:') || eventName.startsWith('checkout:')) {
            this.syncWithBackend(eventName, data);
        }
    },

    /**
     * Arka planla senkronize et (Redis Pub/Sub Proxy'sine ilet)
     */
    syncWithBackend: function (eventName, data) {
        // İlerleyen fazlarda:
        // fetch('/api/v1/stream/events', { ... })
        // console.log(`🌐 [EVENT BUS -> BACKEND] Event sent to Sovereign Stream: ${eventName}`);
    }
};

window.SantisEventBus = SantisEventBus;
