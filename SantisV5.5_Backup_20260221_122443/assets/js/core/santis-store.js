/**
 * SANTIS OS - VANILLA JS STATE MANAGER (BLOK F2)
 * Central immutable store for the Headless Reactivity engine.
 */

(function initSantisStore() {
    if (window.SantisStore) return;

    console.log("🏪 [SANTIS STORE] Initializing Central State Manager...");

    const state = new Map();
    const listeners = new Map(); // Key -> Array of callbacks

    window.SantisStore = {
        /**
         * Get current state for a specific key
         */
        get: function (key) {
            // Return structured clone to prevent accidental mutation by UI components
            const val = state.get(key);
            return val ? JSON.parse(JSON.stringify(val)) : null;
        },

        /**
         * Get entire global state tree
         */
        getStateTree: function () {
            return Object.fromEntries(state);
        },

        /**
         * Update state and notify subscribers
         */
        set: function (key, data) {
            // 1. Immutable Update
            state.set(key, data);

            // 2. Notify Subscribers
            const subs = listeners.get(key);
            if (subs && subs.length > 0) {
                console.debug(`🏪 [SANTIS STORE] Emitting update for '${key}' to ${subs.length} components.`);
                // Clone data for subscribers to ensure isolated reactivity
                const safeData = JSON.parse(JSON.stringify(data));
                subs.forEach(cb => {
                    try { cb(safeData); } catch (e) { console.error("Subscriber Error:", e); }
                });
            }

            // 3. Fire Global Event for components relying on EventListener instead of explicit sub
            window.dispatchEvent(new CustomEvent('santis:store-updated', { detail: { key, data } }));
        },

        /**
         * Register a callback when a specific key updates
         */
        subscribe: function (key, callback) {
            if (!listeners.has(key)) {
                listeners.set(key, []);
            }
            listeners.get(key).push(callback);

            // Immediately execute with current state if exists (Hydration logic)
            if (state.has(key)) {
                callback(this.get(key));
            }

            // Return unsubscribe function
            return () => {
                const arr = listeners.get(key);
                if (arr) {
                    const idx = arr.indexOf(callback);
                    if (idx > -1) arr.splice(idx, 1);
                }
            };
        }
    };

    // Auto-Wire to the Fetch Bridge Events
    window.addEventListener('santis:content-updated', (e) => {
        const { key, data } = e.detail;
        console.debug(`🏪 [SANTIS STORE] Intercepted network update from Bridge -> Key: ${key}`);
        window.SantisStore.set(key, data);
    });

})();
