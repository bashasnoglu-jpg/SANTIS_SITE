/**
 * Santis OS V28 - Cognitive UI Engine
 * Yazar: Antigravity Sovereign
 * Kapsam: 4-7-8 Parasempatik Animasyon, Cyber-Scramble Text
 */

const NeuroUI = {
    init() {
        this.btn = document.getElementById('init-btn');
        if(this.btn) {
            this.applyBreathingEffect();
            this.btn.addEventListener('click', () => {
                this.triggerHandshake();
            });
        }
        
        this.initHoverScramble();
    },

    applyBreathingEffect() {
        let cycleId = null;
        const cycle = () => {
            // 4 saniye nefes al (Büyüme)
            this.animateElement(1.15, 4000, () => {
                // 7 saniye tut (Sabit, glow artırma)
                this.btn.style.boxShadow = '0 0 30px rgba(198, 169, 107, 0.4)';
                
                setTimeout(() => {
                    // 8 saniye ver (Küçülme ve karar)
                    this.btn.style.boxShadow = 'none';
                    this.animateElement(1.0, 8000, cycle);
                }, 7000);
            });
        };
        cycle();
    },

    animateElement(scale, duration, callback) {
        if(!this.btn) return;
        this.btn.style.transform = `scale(${scale})`;
        this.btn.style.transition = `transform ${duration}ms ease-in-out`;
        setTimeout(callback, duration);
    },

    triggerHandshake() {
        // Butonu animasyonla yok et
        this.btn.innerHTML = 'VERIFYING...';
        this.btn.style.letterSpacing = '10px';
        this.btn.style.opacity = '0.5';
        
        setTimeout(() => {
            this.btn.style.display = 'none';
            // Audio API başlat sinyali ver
            if(window.VocalScanner) {
                window.VocalScanner.requestAccess();
            }
        }, 1500);
    },

    // Siber güvenlik/Kognitif Scramble efekti
    initHoverScramble() {
        const targets = document.querySelectorAll('.scramble-target');
        
        targets.forEach(el => {
            let hoverTimer;
            const originalText = el.innerText;
            const targetText = el.getAttribute('data-hover-text');
            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
            
            el.addEventListener('mouseenter', () => {
                // 3 saniye sonra tetikle
                hoverTimer = setTimeout(() => {
                    let iteration = 0;
                    let interval = setInterval(() => {
                        el.innerText = targetText
                            .split("")
                            .map((letter, index) => {
                                if(index < iteration) {
                                    return targetText[index];
                                }
                                return letters[Math.floor(Math.random() * letters.length)];
                            })
                            .join("");
                        
                        if(iteration >= targetText.length){ 
                            clearInterval(interval);
                        }
                        iteration += 1 / 2; // Hızı ayarlar
                    }, 40);
                }, 3000); // 3 saniye hover beklemesi
            });

            el.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimer);
                // Menüden çıkınca orijinal metne yavaşça karartarak dön
                el.style.opacity = '0';
                setTimeout(() => {
                    el.innerText = originalText;
                    el.style.opacity = '1';
                }, 300);
            });
            el.style.transition = 'opacity 0.3s ease';
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    NeuroUI.init();
});
