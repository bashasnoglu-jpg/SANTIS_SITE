/**
 * SANTIS SOVEREIGN OS - Kuantum Görünürlük Gözlemcisi
 * "Quiet Luxury" Fade-In Etkileşimleri İçin
 */
class SantisScrollEngine {
    constructor() {
        // Observer ayarları: Elementin %10'u ekrana girdiğinde tetiklenir
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1 
        };
  
        // Callback fonksiyonu
        this.observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Element ekrana girdiğinde lüks animasyon sınıfını ekle
                    entry.target.classList.add('santis-reveal-active');
                    
                    // Performans için: Ekrana giren elementi bir daha izlemeyi bırak
                    observer.unobserve(entry.target);
                }
            });
        }, options);
    }
  
    /**
     * DOM'daki tüm lüks kartları izlemeye başlar
     */
    initReveal() {
        // Sadece 'santis-reveal-item' sınıfı olanları bul
        const elementsToReveal = document.querySelectorAll('.santis-reveal-item');
        
        elementsToReveal.forEach(el => {
            this.observer.observe(el);
        });
        
        console.log(`🦅 [Santis Scroll Engine] ${elementsToReveal.length} varlık için SOUL FLASH aktif edildi.`);
    }
}
  
// Global olarak başlat
document.addEventListener('DOMContentLoaded', () => {
    window.SantisScrollEngine = new SantisScrollEngine();
});
