/* =========================================================
   SANTIS GHOST LOGIC - VIP GUEST RESCUE PROTOCOL 🚁
   Hedef: guest-zen portalındaki terk etme (bounce) oranını sıfırlamak
========================================================= */

class SovereignGhostTrigger {
    constructor() {
        this.isGhostAwake = false;
        this.rescueThreshold = 60; // Bu sayfada kurtarma için gereken minimum puan
        this.initSensors();
    }

    initSensors() {
        console.log("👻 [Ghost Logic] Sovereign Sensors Online. Waiting for exit intent...");

        // 1. DESKTOP KAPAN KORUMASI (Mouse yukarı kaçarsa)
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY < 5 && !this.isGhostAwake) {
                this.awakenGhost('desktop_exit_intent');
            }
        });

        // 2. MOBİL SIZMA KORUMASI (Kullanıcı WhatsApp'a geçerse veya ekranı kilitlerse)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && !this.isGhostAwake) {
                this.awakenGhost('mobile_tab_switch');
            }
        });

        // 3. ATALET (INACTIVITY) KORUMASI (Misafir 45 saniye ekrana boş bakarsa)
        let inactivityTimer;
        const resetInactivity = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                if (!this.isGhostAwake) this.awakenGhost('idle_timeout');
            }, 45000); // 45 Saniye Hareketsizlik
        };

        ['mousemove', 'touchstart', 'scroll', 'keydown'].forEach(evt =>
            document.addEventListener(evt, resetInactivity, { passive: true })
        );
        resetInactivity();
    }

    awakenGhost(triggerSource) {
        this.isGhostAwake = true;

        // Mevcut Ghost Score'u al
        const currentScore = parseInt(sessionStorage.getItem('santis_ghost_score') || '0', 10);
        console.warn(`🚁 [Ghost Logic] Tehdit Algılandı (${triggerSource}). Ghost Score: ${currentScore}`);

        // Eğer misafir değerliyse (Score yeterliyse) Sovereign Revenue Brain'i tetikle
        if (currentScore >= this.rescueThreshold) {
            console.log("💎 [Ghost Logic] VIP Misafir Tespit Edildi! Aurelia'ya bağlanılıyor...");

            // UI'ı karart ve lüks bir "Bekleyin" hissi yarat
            document.body.style.transition = "filter 0.8s ease";
            document.body.style.filter = "brightness(0.4)";

            // Santis Event Bus üzerinden Revenue Brain'e acil durum sinyali gönder
            if (window.SantisBus) {
                window.SantisBus.emit('santis:rescue_trigger', {
                    score: currentScore,
                    persona: 'sovereign-guest',
                    source: 'guest-zen-portal'
                });
            } else {
                // Eğer EventBus yoksa doğrudan Global Metodu çağır
                if (typeof triggerGhost === 'function') triggerGhost();
            }
        } else {
            console.log("🛑 [Ghost Logic] Misafir skoru yetersiz, serbest bırakıldı.");
        }
    }
}

// Sistemi DOM hazır olduğunda ateşle
document.addEventListener('DOMContentLoaded', () => {
    window.santisGhostTrigger = new SovereignGhostTrigger();
});
