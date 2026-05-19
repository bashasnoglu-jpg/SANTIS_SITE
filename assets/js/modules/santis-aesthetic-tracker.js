import { santisEventBus } from './santis-event-bus.js';

/**
 * Santis Aesthetic Analytics Engine
 * Misafirin görsel öğeler üzerindeki "Odaklanma Süresini" (Dwell Time) ölçer.
 * Zero-Jank performansı için IntersectionObserver kullanır ve veriyi merkezi Event Bus üzerinden iletir.
 */
export class SantisAestheticTracker {
  constructor() {
    // Merkezi İstihbarat Bağlantısı (Event Bus üzerinden)
    this.bus = santisEventBus;
    // Sinematik medya öğelerini hedef alıyoruz
    this.targets = document.querySelectorAll('.santis-cinematic-media');
    
    // Her görselin ekrana giriş zamanını tutacağımız harita
    this.focusTimers = new Map();
    
    this.init();
  }

  init() {
    console.log('👁️ Aesthetic Analytics (Sovereign Sync) başlatıldı.');
    this.setupObserver();
  }

  setupObserver() {
    // Ekranda en az %60'ı görünen görselleri yakalayacak ayarlar
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.6 
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Görselin kimliğini (ID veya Başlık) tespit ediyoruz
        const targetId = entry.target.getAttribute('data-media-id') || 
                         entry.target.closest('.santis-pkg-card')?.querySelector('.santis-pkg-title')?.innerText || 
                         entry.target.alt || 
                         'Bilinmeyen Görsel';

        if (entry.isIntersecting) {
          // Görsel ekrana girdiğinde kronometreyi başlat
          this.focusTimers.set(targetId, Date.now());
        } else {
          // Görsel ekrandan çıktığında süreyi hesapla
          const startTime = this.focusTimers.get(targetId);
          if (startTime) {
            const dwellTime = Date.now() - startTime;
            this.focusTimers.delete(targetId);

            // Sadece 3 saniyeden (3000ms) uzun süren "Derin Odaklanmaları" logla
            if (dwellTime > 3000) {
              this.emitAestheticIntent(targetId, dwellTime);
            }
          }
        }
      });
    }, options);

    this.targets.forEach(target => observer.observe(target));
  }

  emitAestheticIntent(targetId, dwellTimeInMs) {
    const focusData = {
      assetId: targetId,
      dwellTimeSeconds: (dwellTimeInMs / 1000).toFixed(1),
      timestamp: new Date().toISOString(),
      intentStrength: dwellTimeInMs > 7000 ? 'Deep_Focus' : 'Casual_Interest'
    };

    // Estetik niyet sinyalini Truth Layer'a merkezi hat üzerinden ilet
    this.bus.emit('public:aesthetic_intent', focusData);
    console.log(`📡 [Aesthetic Intel]: Misafir "${focusData.assetId}" görseline ${focusData.dwellTimeSeconds} sn odaklandı. (${focusData.intentStrength})`);
  }
}
