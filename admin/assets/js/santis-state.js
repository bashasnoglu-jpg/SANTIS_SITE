/**
 * SANTIS STATE ENGINE (The Cortex)
 * Master Shell için Global, Reaktif "Single Source of Truth"
 */

// 1. Internal Store
const _store = {
    revenue: 0,
    activeNodes: 0,
    systemPulse: 'STABLE', // SURGE, CRITICAL
    userStatus: 'Senkronize Ediliyor...',
    modulesLoaded: []
};

// 2. Observer Kayıt Defteri
const _listeners = new Map(); // Key: propertyName, Value: Set of callbacks

// 3. Reactive Proxy (Cortex)
export const SantisState = new Proxy(_store, {
    set(target, property, value) {
        if (target[property] === value) return true; // Değişiklik yoksa render'ı blokla (Zero-Jank)
        
        target[property] = value;
        console.log(`🧠 [State Engine] Mutation: ${property} ->`, value);

        // İlgili property'yi dinleyen fonksiyonları tetikle
        if (_listeners.has(property)) {
            _listeners.get(property).forEach(callback => {
                // Main thread'i bloklamamak için mikro-görev (microtask) kuyruğuna at
                queueMicrotask(() => callback(value)); 
            });
        }
        return true;
    }
});

// 4. Subscription API
export const StateObserver = {
    subscribe(property, callback, signal = null) {
        if (!_listeners.has(property)) {
            _listeners.set(property, new Set());
        }
        
        const callbacks = _listeners.get(property);
        callbacks.add(callback);

        // AbortController entegrasyonu (Elite Lifecycle Koruması)
        if (signal) {
            signal.addEventListener('abort', () => {
                callbacks.delete(callback);
                // console.log(`🛡️ [State Engine] Observer GC: Cleared listener for ${property}`);
            });
        }

        // İlk değeri hemen gönder (Hydration)
        callback(SantisState[property]);
        
        // Manuel temizlik fonksiyonu döndür (Eğer signal kullanılmıyorsa)
        return () => callbacks.delete(callback);
    }
};
