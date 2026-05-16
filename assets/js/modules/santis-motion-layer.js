import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Santis Motion Layer (Phase VH-2)
 * Site genelindeki görsel ve videolara sinematik "Liquid Weight" geçişleri ekler.
 * GSAP ve ScrollTrigger motorlarını kullanarak 120 FPS pürüzsüzlüğünde hareket sağlar.
 */
export class SantisMotionLayer {
  constructor() {
    // Animasyon uygulanacak tüm sinematik medya ve metin öğelerini seçiyoruz
    this.mediaElements = document.querySelectorAll('.santis-cinematic-media');
    this.textElements = document.querySelectorAll('.santis-cinematic-text');
    
    this.init();
  }

  init() {
    console.log('🎬 Phase VH-2: Sinematik Hareket Katmanı başlatıldı.');
    this.setupMediaReveals();
    this.setupTextMomentum();
    this.setupParallaxRitual();
  }

  // Görsel ve videolar için maskeli (clip-path) süzülme animasyonu
  setupMediaReveals() {
    this.mediaElements.forEach((media) => {
      // Başlangıç durumu: Medya tamamen maskelenmiş (görünmez) ve hafifçe aşağıda
      gsap.set(media, { 
        clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)',
        scale: 1.1,
        y: 40 
      });

      // Scroll ile tetiklenen akışkan açılış (Liquid Weight)
      gsap.to(media, {
        clipPath: 'polygon(0 0%, 100% 0%, 100% 100%, 0 100%)',
        scale: 1,
        y: 0,
        duration: 2.2, // Daha ağır ve vakur bir akış için süre uzatıldı
        ease: 'expo.out',
        scrollTrigger: {
          trigger: media,
          start: 'top 92%',
          toggleActions: 'play none none reverse'
        }
      });
    });
  }

  // Metin blokları için ağırlıklı momentum efekti
  setupTextMomentum() {
    this.textElements.forEach((textBlock, index) => {
      gsap.fromTo(textBlock, 
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.8,
          delay: index * 0.1, // Art arda süzülme (stagger) etkisi
          ease: 'power3.out',
          scrollTrigger: {
            trigger: textBlock,
            start: 'top 90%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  }

  // Lüks Arkaplan Parallax Ritüeli
  setupParallaxRitual() {
    gsap.to('.santis-parallax-bg', {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true
      }
    });
  }
}
