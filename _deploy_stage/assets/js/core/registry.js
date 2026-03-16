/**
 * 🧠 SANTIS OS: THE REGISTRY (Phase 25)
 * Component: Client-Side User Intelligence (The "Engram")
 * Responsibility: Identity, History, Preferences, Soul Tracking
 * Privacy: LocalStorage First (GDPR Friendly). Syncs to Cloud only on explicit connect.
 */

const Registry = (function () {
    const STORAGE_KEY = 'santis_registry_v1';

    // Default Engram Structure
    const defaultEngram = {
        identity: {
            uuid: null,       // V4 UUID
            role: 'guest',    // guest, member, vip
            name: 'Misafir',
            fingerprint: null // Simple browser fingerprint
        },
        context: {
            first_seen: Date.now(),
            last_seen: Date.now(),
            visit_count: 0,
            platform: 'web'
        },
        preferences: {
            theme: 'dark',
            sound_enabled: true,
            language: 'tr'
        },
        journey: {
            history: [],      // Last 50 pages
            services_viewed: {}, // { 'hamam-gold': 2 }
            last_bento: null
        },
        soul: {
            // The "Emotional State" of the user
            mood_vector: { calm: 0.5, energy: 0.5, luxury: 0.5 },
            dominant_element: 'water' // water, fire, earth, air
        }
    };

    let _engram = null;

    // --- INTERNAL HELPERS ---

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                _engram = JSON.parse(raw);
                // Merge with default to ensure new fields exists (Schema Migration lite)
                _engram = {
                    ...defaultEngram, ..._engram,
                    context: { ...defaultEngram.context, ..._engram.context },
                    soul: { ...defaultEngram.soul, ..._engram.soul }
                };
            }
        } catch (e) {
            console.warn("🧠 [Registry] Load failed, resetting.", e);
        }

        if (!_engram || !_engram.identity.uuid) {
            initNewGuest();
        }

        // Update Session Stats
        _engram.context.last_seen = Date.now();
        _engram.context.visit_count++;
        save();

        // Auto-Track Page View
        track('page_view');

        console.log(`🧠 [Registry] Wake Up. Identity: ${_engram.identity.uuid} (${_engram.identity.role})`);
    }

    function initNewGuest() {
        _engram = JSON.parse(JSON.stringify(defaultEngram)); // Deep copy
        _engram.identity.uuid = generateUUID();
        save();
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(_engram));
            // Broadcast change to other tabs/components?
        } catch (e) {
            console.error("🧠 [Registry] Save failed (Quota?)", e);
        }
    }

    // --- PUBLIC API ---

    function get() {
        return _engram;
    }

    function track(event, data = {}) {
        if (!_engram) return;

        // 1. History Tracking (Page Views)
        if (event === 'page_view') {
            _engram.journey.history.unshift({
                path: window.location.pathname,
                ts: Date.now(),
                title: document.title
            });
            if (_engram.journey.history.length > 50) _engram.journey.history.pop();
        }

        // 2. Service Interest (View Product)
        if (event === 'view_service') {
            const id = data.id;
            if (id) {
                _engram.journey.services_viewed[id] = (_engram.journey.services_viewed[id] || 0) + 1;
            }
        }

        // 3. Save
        save();

        // 4. Notify Brain (if connected)
        if (window.SantisBrain && window.SantisBrain.isConnected) {
            window.SantisBrain.broadcast('REGISTRY_UPDATE', {
                uuid: _engram.identity.uuid,
                event: event,
                data: data
            });
        }
    }

    function setPreference(key, value) {
        if (_engram && _engram.preferences) {
            _engram.preferences[key] = value;
            save();
        }
    }

    // "Soul" Update (e.g., from Atmosphere interaction)
    function updateSoul(dimension) {
        // Simple logic: if user hovers 'fire' content, boost fire score
        // This will be expanded in Phase 40.
        _engram.soul.dominant_element = dimension;
        save();
    }

    function reset() {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }

    // Auto-Init
    load();

    return {
        get,
        track,
        setPreference,
        updateSoul,
        reset,
        get uuid() { return _engram.identity.uuid; }
    };

})();

// Global Export
window.Registry = Registry;
