// 🌍 [SANTIS OS - PHASE 95: THE CINEMATIC SCROLL ENGINE]
// Zırhlar: Hardware Accelerated Scroll, Kinetic Parallax, Sovereign Reveal

class SovereignScrollEngine {
    constructor() {
        this.lenis = null;
        // Sayfa kaydırıldıkça karanlıktan zarifçe çıkacak elementlerin otonom radarı
        this.revealElements = document.querySelectorAll('.santis-reveal, .ritual-card, .nv-testimonials > div > div, #sovereign-rituals h2, #massage-therapies h2, #skincare-therapies h2');

        this.initLenis();
        this.initReveal();
        this.initParallax();

        console.log("⚡ [SCROLL ENGINE] Lenis Cinematic Scroll & Reveal Aktif. (120 FPS Kilitlendi)");
    }

    initLenis() {
        // Apple/Gucci seviyesi pürüzsüz kaydırma parametreleri
        this.lenis = new Lenis({
            duration: 1.5,        // Kaydırma süresi (Ne kadar yüksek, o kadar ağırbaşlı ve lüks)
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Kinetik yavaşlama sürtünmesi
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1.0,
            smoothTouch: false,   // Dokunmatik cihazlarda native kaydırma daha organiktir (Safari kilitlenmesini önler)
            touchMultiplier: 2,
            infinite: false,
        });

        // Kuantum Animasyon Döngüsü (Hardware Clock)
        const raf = (time) => {
            this.lenis.raf(time);
            requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);

        // Kanca: Modal (God Mode / Checkout) açıldığında arkadaki kaydırmayı kilitlemek için
        window.SantisLenisLock = () => this.lenis.stop();
        window.SantisLenisUnlock = () => this.lenis.start();
    }

    // Ekran kaydırıldıkça çalışan Parallax efekti (Hero görselleri için)
    initParallax() {
        const parallaxLayers = document.querySelectorAll('.santis-parallax');

        this.lenis.on('scroll', (e) => {
            parallaxLayers.forEach(layer => {
                // Sadece element ekrandayken hesapla (Kritik CPU tasarrufu)
                const rect = layer.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    const speed = layer.dataset.speed || 0.15;
                    const yPos = e.scroll * speed;
                    // Sadece GPU ivmeli transform kullanılır (0 Layout Thrashing)
                    layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
                }
            });
        });
    }

    // Scroll oldukça elementlerin karanlıktan yukarı süzülmesi (Sovereign Reveal)
    initReveal() {
        if (this.revealElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    observer.unobserve(entry.target); // Performans için sadece bir kere tetikle ve RAM'den at
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -80px 0px' // Ekrana girdikten 80px sonra tetikle (Biraz bekleterek lüks hissi verir)
        });

        // Tüm hedeflere başlangıç zırhını (Gizlilik ve Küçülme) giydir
        this.revealElements.forEach(el => {
            el.classList.add('santis-reveal-pending');
            observer.observe(el);
        });
    }
}

// OS Çekirdeği hazır olduğunda motoru ateşle
document.addEventListener('DOMContentLoaded', () => {
    // "Hareketi Azalt" erişilebilirlik ayarı açık değilse çalıştır
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.SantisScroll = new SovereignScrollEngine();
    }
});
