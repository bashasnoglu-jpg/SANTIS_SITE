/**
 * SANTIS SOVEREIGN OS - Ritual Worlds Loader
 * Passive Data Layer Manager for Emotional Rituals
 * v1.0.0 (Phase 2.2 Foundation)
 */
class RitualWorldsLoader {
    constructor() {
        this.config = {
            dataPath: '/assets/data/ritual-worlds.json',
            retryCount: 2,
            retryDelay: 1500
        };
        
        this.state = {
            data: null,
            worlds: [],
            isLoaded: false,
            error: null
        };

        // Singleton instance hook
        window.SantisRitualWorlds = this;
    }

    /**
     * INITIALIZE — Asynchronous data fetch & validation
     */
    async init() {
        if (this.state.isLoaded) return;

        console.log("🦅 [RitualWorlds] Sovereign Emotional Layer initializing...");
        
        try {
            const response = await this._fetchWithRetry(this.config.dataPath);
            this._validate(response);
            
            this.state.data = response;
            this.state.worlds = response.ritualWorlds;
            this.state.isLoaded = true;

            // GLOBAL EVENT — Diğer modüllerin (Bridge, UI) bu veriyi dinleyebilmesi için
            document.dispatchEvent(new CustomEvent('santis:rituals:ready', {
                detail: { 
                    worlds: this.state.worlds,
                    version: response.schemaVersion 
                }
            }));

            console.log(`✅ [RitualWorlds] Emotional Layer Sealed. Version: ${response.schemaVersion}`);
        } catch (err) {
            this.state.error = err.message;
            console.error("❌ [RitualWorlds] Load Anomaly Detected:", err);
            
            document.dispatchEvent(new CustomEvent('santis:rituals:error', {
                detail: { message: err.message }
            }));
        }
    }

    /**
     * INTERNAL — Resilience Engine
     */
    async _fetchWithRetry(url, retries = this.config.retryCount) {
        try {
            const response = await fetch(`${url}?v=${Date.now()}`); // Anti-cache pulse
            if (!response.ok) throw new Error(`HTTP_STATUS_${response.status}`);
            return await response.json();
        } catch (err) {
            if (retries > 0) {
                console.warn(`⚠️ [RitualWorlds] Retry sequence active. Attempts left: ${retries}`);
                await new Promise(r => setTimeout(r, this.config.retryDelay));
                return this._fetchWithRetry(url, retries - 1);
            }
            throw err;
        }
    }

    /**
     * INTERNAL — Schema Hardening
     */
    _validate(data) {
        const required = ['schemaVersion', 'ritualWorlds', 'status'];
        for (const field of required) {
            if (!(field in data)) {
                throw new Error(`SCHEMA_ERROR: Missing required field [${field}]`);
            }
        }
    }

    // --- PUBLIC API ---

    /**
     * GET WORLD BY ID — Ritual World nesnesini getirir
     */
    getWorld(id) {
        if (!this.state.isLoaded) return null;
        return this.state.worlds.find(w => w.id === id) || null;
    }

    /**
     * GET WORLD BY CATEGORY — Mevcut services.json kategorisine göre Ritüel Dünyasını bulur
     */
    getRitualByServiceCategory(categoryId) {
        if (!this.state.isLoaded) return null;
        return this.state.worlds.find(w => w.sourceCategoryIds.includes(categoryId)) || null;
    }

    /**
     * REFRESH — Runtime'da veriyi yeniden yükler (Live Evolution)
     */
    async refresh() {
        this.state.isLoaded = false;
        await this.init();
    }
}

// Global Singleton Initialization
// Not: Henüz bootloader'a bağlanmadığı için manuel veya DOMContentLoaded ile tetiklenebilir.
document.addEventListener('DOMContentLoaded', () => {
    const loader = new RitualWorldsLoader();
    // Phase 2.1 gereği pasif kalması için init() burada otomatik çağrılmıyor.
    // Gelecek fazlarda santis-bootloader.js üzerinden tetiklenecektir.
});
