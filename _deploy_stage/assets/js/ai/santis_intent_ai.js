/**
 * SANTIS OMNI-OS - INTENT AI (v4.1 Mega)
 * Hyper-accurate scoring reading time, depth, mobile patterns, and exit intent.
 */

const SantisIntent = {
    score: 0,
    startTime: Date.now(),
    scrolled50: false,
    timerTriggered: false,
    lastScrollY: 0,
    exitTriggered: false,

    init() {
        if (!window.SantisOffer) {
            console.warn("[Omni-OS Intent] SantisOffer engine missing.");
            return;
        }

        // 1. SCROLL TRACKING (Desktop & Mobile)
        window.addEventListener("scroll", () => {
            const currentScroll = window.scrollY;
            const documentHeight = document.body.scrollHeight;
            const windowHeight = window.innerHeight;

            // Percentage scrolled
            const scrolled = (currentScroll / (documentHeight - windowHeight)) * 100;

            if (scrolled > 50 && !this.scrolled50) {
                this.score += 20;
                this.scrolled50 = true;
                console.log(`[Omni-OS Intent] Scroll > 50%. Score: ${this.score}`);
            }

            // Mobile Exit Intent (Rapid scroll up)
            // If they scroll up more than 150px suddenly
            if (this.lastScrollY - currentScroll > 150) {
                if (this.score >= 40) { // Only if they actually engaged first
                    this.triggerExit("Mobile rapid scroll up");
                }
            }
            this.lastScrollY = currentScroll;

        }, { passive: true });

        // 2. TIME ON PAGE
        setTimeout(() => {
            if (!this.timerTriggered) {
                this.score += 20;
                this.timerTriggered = true;
                console.log(`[Omni-OS Intent] Time > 40s. Score: ${this.score}`);
            }
        }, 40000); // 40 Seconds rule

        // 3. DESKTOP EXIT INTENT
        document.addEventListener("mouseleave", (e) => {
            // Mouse moves above the viewport (towards tabs/close button)
            if (e.clientY < 50) {
                this.triggerExit("Desktop mouse leave");
            }
        });

        // 4. MOBILE / BROWSER TAB SWITCH EXIT INTENT
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'hidden') {
                this.triggerExit("Tab switched / hidden");
            }
        });
    },

    triggerExit(reason) {
        if (this.exitTriggered) return;

        this.score += 25;
        this.exitTriggered = true;

        console.log(`[Omni-OS Intent] Exit Triggered via: [${reason}]. Final Score: ${this.score}`);

        if (window.SantisSession && window.SantisSession.isVIP) {
            this.score += 15; // VIP Bonus
            console.log(`[Omni-OS Intent] VIP Bonus added. Score: ${this.score}`);
        }

        // Pass to the brain
        SantisOffer.evaluate(this.score);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // 1-second delay to ensure sub-modules are ready
    setTimeout(() => SantisIntent.init(), 1000);
});
