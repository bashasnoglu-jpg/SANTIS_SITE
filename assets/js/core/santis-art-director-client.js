/**
 * ═══════════════════════════════════════════════════════════
 * SANTIS OS - ART DIRECTOR CLIENT (Phase 42 B)
 * ═══════════════════════════════════════════════════════════
 * Kognitif birimden (Friction Engine) gelen stres sinyallerini
 * dinler ve DOM üzerindeki görselleri "Sakinleşme" (Recovery) 
 * tarzı düşük kontrastlı görsellerle View Transitions API 
 * kullanarak 0ms içinde cross-fade animasyonla değiştirir.
 */

class SantisArtDirectorClient {
    constructor() {
        this.isActive = false;
        
        // Listen to the Central Nervous System (Friction Engine)
        window.addEventListener('SantisStressLevelHigh', (e) => this.handleHighStress(e));
        
        console.log("🦋 [Art Director Client] Uyanık. Stress Trigger'ları dinleniyor...");
    }

    async handleHighStress(e) {
        if (this.isActive) return;
        this.isActive = true;

        console.warn(`👁️ [Art Director] Stres Tespit Edildi (Skor: ${Math.round(e.detail.score)}). 'Recovery' tarzı görseller uygulanıyor...`);

        // Check if browser supports View Transitions natively for 0ms crossfade
        if (!document.startViewTransition) {
            this.applyRecoveryVisuals();
        } else {
            try {
                const transition = document.startViewTransition(() => this.applyRecoveryVisuals());
                const handleAbort = e => {
                    if (e && e.name === 'AbortError') {
                        // Silent catch for expected aborted transitions
                    } else {
                        console.error('[Art Director] View Transition error:', e);
                    }
                };
                transition.ready.catch(handleAbort);
                transition.finished.catch(handleAbort);
                if (transition.updateCallbackDone) transition.updateCallbackDone.catch(handleAbort);
            } catch (e) {
                console.warn('[Art Director] View Transition aborted/skipped.');
                this.applyRecoveryVisuals();
            }
        }
    }

    applyRecoveryVisuals() {
        // Hedef 1: Hero Visuals
        const heroImages = document.querySelectorAll('img.hero-visual, .bento-card-media');
        
        heroImages.forEach(img => {
            // Görseli daha sakinleştirici bir fallback görseli veya stile çekiyoruz
            // Normalde bu API'dan Media Manifest'inden 'style: recovery' ile alınır.
            // Örnek Hardcoded Fallbacks for Execution:
            
            const currentSrc = img.src || "";
            if (currentSrc.includes('santis_hero_main')) {
                // Daha soft, Zen bir hero görseli
                img.src = '/assets/img/cards/Santis-spa-rest-graded-clean.webp'; 
                img.srcset = '';
                img.alt = 'Sakinleştirici Sıcak Taş Dokusu - Recovery Modu';
            } else if (img.classList.contains('bento-card-media')) {
                // Bento kartları üzerindeki doygunluğu al ve Sepia/Warm filter uygula (Sovereign CSS Trick)
                img.style.filter = 'saturate(0.4) contrast(0.9) brightness(0.85) sepia(0.2)';
                img.style.transition = 'filter 2s ease-in-out';
            }
        });

        // Bedensel (Somatic) Rahatlama: Arka planı koyulaştır ve pürüzsüzleştir
        document.body.style.transition = "background-color 3s ease, color 3s ease";
        document.body.style.backgroundColor = "#020202"; // Vanta Black'e çekiliyor
        document.body.style.color = "#a0a0a0"; // Kontrastı düşürülmüş metin
        
        console.log("👁️ [Art Director] Pikseller sıvılaştırıldı ve 'Living Interface' sakinleştirildi.");
    }
}

// Bootloader'a gerek kalmadan oto-yüklenmesi için
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SantisArtDirectorClient());
} else {
    new SantisArtDirectorClient();
}
