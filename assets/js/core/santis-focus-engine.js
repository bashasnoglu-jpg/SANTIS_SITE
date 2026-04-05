export class SantisFocusEngine {
    constructor() {
        this.x = 0.5;
        this.y = 0.5;
        this.tx = 0.5;
        this.ty = 0.5;
    }

    init() {
        window.addEventListener("mousemove", (e) => {
            this.tx = e.clientX / window.innerWidth;
            this.ty = e.clientY / window.innerHeight;
        });
        
        // Touch support for mobile dynamics
        window.addEventListener("touchmove", (e) => {
            if(e.touches.length > 0) {
                this.tx = e.touches[0].clientX / window.innerWidth;
                this.ty = e.touches[0].clientY / window.innerHeight;
            }
        }, { passive: true });

        this.loop();
        this.setupKriyoHibernation();
        
        console.log("👁️ [SANTIS FOCUS] Focus Engine Aktif. Niyetler izleniyor...");
    }

    // 🟠 PROTOKOL KRİYO: Kriyojenik Uyku Kontrolcüsü
    setupKriyoHibernation() {
        // 1. Sekme Arka Plana Atıldığında (Zaman/Odak Farkındalığı)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.sendGPUCommand("PAUSE");
            } else {
                this.sendGPUCommand("RESUME");
            }
        });

        // 2. Liquid Gold/Canvas Ekranda Değilken (Uzamsal Farkındalık)
        // (Eğer canvas taginiz spesifik bir id'ye sahipse örn '#santis-liquid-canvas' yakalayın, yoksa body/main üstünden fallback yapıyoruz)
        const canvasEl = document.querySelector('canvas') || document.querySelector('#santis-liquid-canvas');
        if (canvasEl) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !document.hidden) {
                        this.sendGPUCommand("RESUME");
                    } else {
                        this.sendGPUCommand("PAUSE");
                    }
                });
            }, { threshold: 0.01 });
            observer.observe(canvasEl);
        }
    }

    sendGPUCommand(type) {
        if (window.__SANTIS_RUNTIME__ && window.__SANTIS_RUNTIME__.gpu) {
            window.__SANTIS_RUNTIME__.gpu.postMessage({ type });
        }
    }

    loop() {
        // smooth follow (çok önemli) — Altın Ayar: 0.08
        this.x += (this.tx - this.x) * 0.08;
        this.y += (this.ty - this.y) * 0.08;

        // GPU’ya gönder
        if (window.__SANTIS_RUNTIME__ && window.__SANTIS_RUNTIME__.gpu) {
            window.__SANTIS_RUNTIME__.gpu.postMessage({
                type: "FOCUS",
                x: this.x,
                y: this.y
            });
        }

        // AŞAMA 4 — SUBTLE DEPTH FALLBACK (DOM Haptic Feedback)
        document.querySelectorAll("[data-focusable]").forEach((el) => {
            const rect = el.getBoundingClientRect();
            
            // Eğer element ekranda değilse hesaplamayı atla (Performance)
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;

            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            const dx = cx / window.innerWidth - this.x;
            const dy = cy / window.innerHeight - this.y;

            const dist = Math.sqrt(dx * dx + dy * dy);

            // Odak Noktasından uzaklaştıkça scale düşer, yaklaştıkça artar. (max %5 büyüme)
            const scale = 1 + Math.max(0, 0.05 - (dist * 0.05));

            el.style.transform = `scale(${scale})`;
            el.style.transition = 'transform 0.1s ease-out';
        });

        requestAnimationFrame(() => this.loop());
    }
}
