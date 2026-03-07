/**
 * 🌍 [SANTIS_QUANTUM_OS] FINAL ASSEMBLY: Bootloader
 * The Sovereign Engine Initializer - Centralizes all systems and optimizes Startup.
 */

window.SantisBootloader = (function () {
    console.log("⚡ [Santis Bootloader] Quantum Core Awakening...");

    const Config = {
        debug: true,
        features: {
            neuroTracker: true,
            kineticParallax: true,
            checkoutVault: true,
            ghostForge: true
        }
    };

    // 1. Sentinel Profiling (Graceful Degradation Check)
    function initSentinel() {
        if (!window.SantisSentinel) {
            window.SantisSentinel = {
                getTier: () => {
                    const cores = navigator.hardwareConcurrency || 4;
                    const memory = navigator.deviceMemory || 4;
                    if (cores <= 4 && memory <= 4) return 'LITE_ESSENTIAL';
                    if (cores <= 6) return 'BASIC';
                    return 'ULTRA';
                }
            };
        }
        const tier = window.SantisSentinel.getTier();
        if (Config.debug) console.log(`[Sentinel] Device Profile Locked: ${tier}`);
        return tier;
    }

    // 2. Load Core Modules
    function bootSequence() {
        const tier = initSentinel();

        // If very low end device, disable heaviest visual features
        if (tier === 'LITE_ESSENTIAL') {
            Config.features.ghostForge = false;
            Config.features.kineticParallax = false;
            console.warn("[Bootloader] Düşük donanım saptandı. WebGL Auralar kapatıldı.");
        }

        requestAnimationFrame(() => {
            // A. Ghost Forge Initialization
            if (Config.features.ghostForge) {
                // Sadece GPU gücü olanlarda auraları ateşle
                // Önceki adımlarda kurduğumuz intersection observer tabanlı ghost forge'u burada da tetikleyebiliriz.
                if (typeof window.initSovereignLayout === 'function') {
                    window.initSovereignLayout();
                }
            }

            // B. Kineti-Core & Sovereign Rail
            if (typeof window.initSovereignRails === 'function') {
                window.initSovereignRails();
            }

            // C. Neuro-Tracker Focus Mode
            if (Config.features.neuroTracker && typeof window.NeuroTracker === 'object') {
                // Neuro-tracker is auto-init in DOMContentLoaded mostly, ensuring it exists
                console.log("[Bootloader] Neuro-Tracker is online.");
            }

            // D. Sovereign Checkout Vault 
            if (Config.features.checkoutVault && window.CheckoutVault) {
                // window.CheckoutVault.init(); // Auto-inits based on its own logic, verify it's active
                console.log("[Bootloader] CheckoutVault Matrix Ready.");
            }
        });

        console.log("🌌 [Santis Bootloader] Bütüncül Sistem Devrede. Sovereign Sanctuary Aktif.");
    }

    // Export interface
    return {
        ignite: bootSequence,
        getConfig: () => Config
    };
})();

// DOM Ready Trigger
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SantisBootloader.ignite());
} else {
    window.SantisBootloader.ignite();
}
