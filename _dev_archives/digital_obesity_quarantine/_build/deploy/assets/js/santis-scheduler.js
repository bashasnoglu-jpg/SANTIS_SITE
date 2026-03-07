/**
 * SANTIS CIRCADIAN SCHEDULER (Time Lord)
 * Automatically syncs the Soul Engine atmosphere with the time of day.
 * 
 * Schedule:
 * 06:00 - 10:00 -> DAWN (Cappadocia Sun)
 * 10:00 - 18:00 -> MIST (Hammam Steam / Zen)
 * 18:00 - 23:00 -> RAIN (Bosphorus Evening)
 * 23:00 - 06:00 -> DEEP (Undercurrent / Midnight)
 */

class SantisScheduler {
    constructor() {
        this.autoPilot = true; // Default to Auto
        this.checkInterval = null;
        this.init();
    }

    init() {
        console.log("🕰️ [Time Lord] Connected to Circadian Rhythm.");
        this.checkTime();

        // Check every minute
        this.checkInterval = setInterval(() => this.checkTime(), 60000);

        // Listen for Admin Override (if implemented later)
        window.addEventListener('santis-manual-override', () => {
            this.autoPilot = false;
            console.log("🕰️ [Time Lord] Manual Override Engaged.");
        });
    }

    checkTime() {
        if (!this.autoPilot) return;

        const hour = new Date().getHours();
        let targetMood = 'zen'; // Default

        if (hour >= 6 && hour < 10) {
            targetMood = 'dawn';
        } else if (hour >= 10 && hour < 18) {
            targetMood = 'mist'; // Or 'zen'
        } else if (hour >= 18 && hour < 23) {
            targetMood = 'rain';
        } else {
            // 23:00 - 06:00
            targetMood = 'deep';
        }

        // Apply if different from current (use dataset.userMood set by Atmosphere.sync)
        if (window.SantisSoul) {
            const currentMood = document.body.dataset.userMood;

            if (currentMood !== targetMood) {
                // Prevent Spam: Only log on change
                if (window.lastLoggedMood !== targetMood) {
                    console.log(`🕰️ [Time Lord] Shifting Atmosphere: ${targetMood.toUpperCase()} (Hour: ${hour})`);
                    window.lastLoggedMood = targetMood;
                }
                // Use Atmos directly if Soul is missing logic, but Soul is safer usually
                if (window.Atmosphere && window.Atmosphere.sync) {
                    window.Atmosphere.sync(targetMood);
                } else if (window.SantisSoul.setMood) {
                    window.SantisSoul.setMood(targetMood);
                }
            }
        }
    }

    // Admin API
    toggleAutoPilot(bool) {
        this.autoPilot = bool;
        if (bool) this.checkTime(); // Re-sync immediately
        console.log(`🕰️ [Time Lord] Auto-Pilot: ${bool ? 'ON' : 'OFF'}`);
    }
}

// Auto-Start
document.addEventListener('DOMContentLoaded', () => {
    // Delay slightly to ensure SoulEngine is ready
    setTimeout(() => {
        window.SantisScheduler = new SantisScheduler();
    }, 500);
});
