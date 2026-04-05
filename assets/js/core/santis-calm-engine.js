// assets/js/core/santis-calm-engine.js
// SDCR V61.0 - CALM CORE ENGINE (Animation Governor, Battery Eco & Progressive Disclosure)

/**
 * Sovereign OS - Calm Core Engine
 * Manages the UI/UX stress levels, role-based visibility, and battery-friendly eco modes.
 * Implements "Calm Core, Violent Edge" philosophy.
 */

export const VIEW_LEVELS = {
    L0: "Essential",     // Receptionist / Front Desk (Minimum Cognitive Load)
    L1: "Operational",   // Manager 
    L2: "Strategic",     // Director
    L3: "God Mode"       // Founder / Sovereign
};

export class SantisCalmEngine {
    constructor() {
        if (window.__SOVEREIGN_CALM_ENGINE__) {
            console.warn("🛡️ [CALM CORE] Singleton ihlali engellendi. Motor zaten aktif.");
            return window.__SOVEREIGN_CALM_ENGINE__;
        }

        this.state = {
            mode: "calm", // calm | alert | critical
            level: VIEW_LEVELS.L3, // Default to God Mode until Auth injects otherwise
            ecoMode: false,
            batteryLevel: 1.0
        };

        this.initialized = false;
        window.__SOVEREIGN_CALM_ENGINE__ = this;
    }

    /**
     * Motoru pasif modda (.ui-calm vs sınıf ekleyerek) başlatır.
     * Core DAG bağımsız olarak drop-in çalışabilir.
     */
    init(targetLevel = VIEW_LEVELS.L3) {
        if (this.initialized) return;

        console.log("🧘 [CALM CORE] Engine Booting... Enforcing Sovereign Quiet Luxury Protocol.");
        
        this.setAccessLevel(targetLevel);
        this.setMode("calm"); // Default to quiet luxury
        this.initBatteryObserver();

        this.initialized = true;
        
        // Broadcast that the system is now governed
        document.dispatchEvent(new CustomEvent('santis:calm:ready', { detail: this.state }));
        
        return this;
    }

    /**
     * Sets global animation and stress mode via Body Classes. 
     * Controlled by CSS in style-v2.css (.ui-calm, .ui-alert, .ui-critical)
     */
    setMode(newMode) {
        if (!['calm', 'alert', 'critical'].includes(newMode)) {
            console.error(`[CALM CORE] Geçersiz durum: ${newMode}`);
            return;
        }

        this.state.mode = newMode;
        
        // Temizlik
        document.body.classList.remove('ui-calm', 'ui-alert', 'ui-critical');
        // Yeni Zırh
        document.body.classList.add(`ui-${newMode}`);

        console.log(`🌀 [CALM CORE] HUD State Transition -> ${newMode.toUpperCase()}`);
    }

    /**
     * RBAC Bilişsel Karartma (Progressive Disclosure)
     * Alt seviyelerde telemetri, cyber-warfare kalkanı gibi verileri gizler.
     */
    setAccessLevel(newLevel) {
        this.state.level = newLevel;
        
        // CSS Hook için body'e seviye yazılır. Örn: role-l0, role-l3
        const levelKey = Object.keys(VIEW_LEVELS).find(k => VIEW_LEVELS[k] === newLevel) || 'L0';
        
        document.body.className = document.body.className.replace(/\brole-l\d+\b/g, '');
        document.body.classList.add(`role-${levelKey.toLowerCase()}`);
        
        if (newLevel === VIEW_LEVELS.L0) {
            // "Receptionist" modlaysa
            document.body.classList.add('role-receptionist');
            console.log("🤫 [CALM CORE] Bilişsel Karartma Aktif: Receptionist Mode");
        } else {
            document.body.classList.remove('role-receptionist');
        }
    }

    /**
     * Batarya API kullanarak otonom donanımsal yavaşlatma
     */
    async initBatteryObserver() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                this._handleBatteryData(battery);
                
                battery.addEventListener('levelchange', () => this._handleBatteryData(battery));
                battery.addEventListener('chargingchange', () => this._handleBatteryData(battery));
            } catch (e) {
                console.warn("🔋 [CALM CORE] Batarya Optik Sinire bağlanamadı, donanım izin vermiyor.");
            }
        }
    }

    _handleBatteryData(battery) {
        this.state.batteryLevel = battery.level;
        
        // Batarya %30 altındaysa ve şarjda değilse Eco modu zorla
        if (battery.level <= 0.30 && !battery.charging) {
            if (!this.state.ecoMode) {
                this.state.ecoMode = true;
                this.setMode("calm"); // Zorunlu sakinleştirme
                
                // Trigger global pause on all known optic-throtle instances if possible
                if (window.OpticThrottle) {
                    console.log("🔋 [CALM CORE] Kritik Batarya: Eco Mod Devrede. Görseller Uyutuluyor.");
                    // In a full integration, you would trigger window.OpticThrottle to freeze all.
                }
            }
        } else {
            if (this.state.ecoMode && battery.charging) {
                this.state.ecoMode = false;
                console.log("🔋 [CALM CORE] Güç Akışı Stabil: Eco Mod Devreden Çıktı.");
            }
        }
    }
}

// Global Singleton Export
export const CalmCore = new SantisCalmEngine();
