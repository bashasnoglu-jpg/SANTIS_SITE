/**
 * 🌌 SANTIS SPATIAL ENGINE
 * Paket kartlarına Z-ekseninde mekansal derinlik ve kaydırma animasyonu kazandırır.
 * Felsefe: Quiet Luxury Motion (Massive but Smooth)
 */

export class SantisSpatialEngine {
    constructor(containerSelector = '.pkg-grid', cardSelector = '.santis-pkg-card') {
      this.container = document.querySelector(containerSelector);
      // Global gsap objesini kullanıyoruz
      this.gsap = window.gsap;
      this.ScrollTrigger = window.ScrollTrigger;
      
      if (this.gsap) {
        this.gsap.registerPlugin(this.ScrollTrigger);
        this.cards = this.gsap.utils.toArray(cardSelector);
        this.init();
      }
    }
  
    init() {
      if (!this.container || this.cards.length === 0) {
        console.warn('🛡️ [Santis Spatial] Kapsayıcı veya kartlar bulunamadı. Santis-pkg-card sınıfını kontrol edin.');
        return;
      }
  
      console.log('🌌 [Santis Spatial] Physical Engine Ignited.');
  
      // 1. Kapsayıcıya 3D perspektif ekleyelim
      this.gsap.set(this.container, { perspective: 1200 });
  
      // 2. Her bir kart için ScrollTrigger animasyonu
      this.cards.forEach((card) => {
        this.gsap.fromTo(card, 
          {
            z: -300,             // Derinden geliş
            rotationX: 12,       // Hafif arkaya yatık
            opacity: 0,          // Sisli başlangıç
            transformOrigin: "center top"
          },
          {
            z: 0,                // Kullanıcıya ulaşma
            rotationX: 0,        // Dik açı
            opacity: 1,          // Netleşme
            ease: "none",        
            scrollTrigger: {
              trigger: card,
              start: "top 95%",  
              end: "top 35%",    // Daha yukarıda bitirerek akışkanlığı artırıyoruz
              scrub: 1.5         // 1.5 sn yumuşatma (Daha lüks hissettirir)
            }
          }
        );
      });
    }
  }
