/**
 * SovereignObserver: Otoriter Performans ve Görsel Tetikleyici
 * Sayfadaki ağır görselleri ve animasyonları sadece viewport'a girdiklerinde yükler.
 */

export const SovereignObserver = (() => {
    // Gözcünün hassasiyet ayarları
    const options = {
        root: null,
        rootMargin: '50px', // Ekrana girmeden 50px önce yüklemeye başla (pürüzsüzlük için)
        threshold: 0.1      // Elementin %10'u göründüğünde tetikle
    };

    const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;

                // 1. HAFİFLETME (Lazy Load): Gecikmeli Resim Yükleme
                if (el.hasAttribute('data-lazy-src')) {
                    el.src = el.getAttribute('data-lazy-src');
                    el.removeAttribute('data-lazy-src');
                    
                    // Yüklendiğinde CSS ile yumuşak bir geçiş (fade-in) yapabilmek için
                    el.onload = () => el.classList.add('opacity-100'); 
                }

                // 1.1 HAFİFLETME (Background Image Load)
                if (el.hasAttribute('data-lazy-bg')) {
                    // Preload the image in memory then apply to avoid layout flashes
                    const bgUrl = el.getAttribute('data-lazy-bg');
                    const tempImg = new Image();
                    tempImg.src = bgUrl;
                    tempImg.onload = () => {
                        el.style.backgroundImage = `url('${bgUrl}')`;
                        el.removeAttribute('data-lazy-bg');
                        el.classList.add('opacity-100');
                    };
                }

                // 2. MOTOR TETİKLEME: Ghost Forge veya Ağır Animasyonlar
                if (el.hasAttribute('data-forge-trigger')) {
                    // Animasyon sınıfını ekle veya spesifik bir JS motorunu ateşle
                    el.classList.add('forge-activated');
                    // Opsiyonel: sovereignStore.update('isForgeVisible', true);
                }

                // Görev tamamlandı, bu elementi izlemeyi bırak (Main-thread'i rahatlat)
                observerInstance.unobserve(el);
            }
        });
    }, options);

    // 1. Sürekli İzleyici (Animasyonlar için - UNOBSERVE yapmaz!)
    const continuousObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.target.hasAttribute('data-forge-trigger')) {
                if (entry.isIntersecting) {
                    // Ekrana girdi: Motoru Başlat
                    console.log("🔥 [Ghost Forge] Viewport'a girdi. Motor ateşleniyor!");
                    document.dispatchEvent(new CustomEvent('sovereign:forge:resume'));
                } else {
                    // Ekrandan çıktı: Motoru Durdur (Batarya Tasarrufu)
                    console.log("❄️ [Ghost Forge] Ekrandan çıktı. Döngü duraklatıldı.");
                    document.dispatchEvent(new CustomEvent('sovereign:forge:pause'));
                }
            }
        });
    }, { threshold: 0.05 }); // %5'i görünse bile tetikle

    return {
        // Tekil elementi izle
        observe: (element) => {
            if (element) observer.observe(element);
        },
        // Sınıf veya attribute bazlı toplu izleme başlat
        init: () => {
            document.querySelectorAll('[data-lazy-src], [data-lazy-bg], [data-forge-trigger]').forEach(el => {
                
                // Resimler için tek seferlik gözlem ve hazırlık
                if(el.hasAttribute('data-lazy-src') || el.hasAttribute('data-lazy-bg')) {
                    el.classList.add('opacity-0', 'transition-opacity', 'duration-700');
                    observer.observe(el);
                }
                
                // Ağır WebGL animasyonları için sürekli gözlem
                if(el.hasAttribute('data-forge-trigger')) {
                    continuousObserver.observe(el);
                }
            });
            console.log("👁️ [SovereignObserver] Performans gözcüleri yerleştirildi.");
        }
    };
})();
