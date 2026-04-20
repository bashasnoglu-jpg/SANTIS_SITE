/**
 * Sovereign Sequence - Dynamic Prompts Loader (SSOT)
 */

export class PromptsLoader {
    constructor(configPath = '/config/packs.json') {
        this.configPath = configPath;
        this.config = null;
    }

    async init() {
        try {
            const response = await fetch(this.configPath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.config = await response.json();
            console.log('💎 Sovereign Config Loaded:', this.config.version);
            return this.config;
        } catch (e) {
            console.warn('⚠️ Pack Config Load Failed. Retrying with relative path...', e);
            try {
                const relativeResponse = await fetch('./config/packs.json');
                if (!relativeResponse.ok) throw new Error(`Fallback failed: ${relativeResponse.status}`);
                this.config = await relativeResponse.json();
                console.log('💎 Sovereign Config Loaded (RelativeFallback):', this.config.version);
                return this.config;
            } catch (fallbackErr) {
                console.error('❌ CRITICAL: Failed to load packs.json. Initiating Fallback Mode.', fallbackErr);
                // Fallback Mechanism avoiding system crash
                this.config = {
                    PACK_ORDER: ["signature"],
                    ALIASES: {}
                };
                return this.config;
            }
        }
    }

    resolvePack(packId) {
        if (!this.config) return null;

        // Alias Logic Check
        if (this.config.ALIASES && this.config.ALIASES[packId]) {
            return {
                id: packId,
                target: this.config.ALIASES[packId].target,
                label: this.config.ALIASES[packId].label,
                isAlias: true
            };
        }

        return {
            id: packId,
            target: packId,
            label: packId,
            isAlias: false
        };
    }

    getOrderedPacks() {
        if (!this.config) return [];
        return this.config.PACK_ORDER.map(id => this.resolvePack(id));
    }
}

// Auto-bind to window if in browser environment
if (typeof window !== 'undefined') {
    window.SovereignPromptsLoader = PromptsLoader;
}
