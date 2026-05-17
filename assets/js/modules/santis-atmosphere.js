import { santisEventBus } from './santis-event-bus.js';

/**
 * Santis Dynamic Atmosphere Engine
 * Token-Only mimariye sadık kalarak sitenin evrensel lüks temasını anlık olarak değiştirir.
 * Antigravity AI (Temporal Context) ve Manuel Seçim modlarını destekler.
 */
export class SantisAtmosphereEngine {
  constructor() {
    this.htmlRoot = document.documentElement;
    this.currentTheme = 'adriatic-night'; // Varsayılan tema
    // Merkezi İstihbarat Bağlantısı (Event Bus üzerinden)
    this.bus = santisEventBus;
    
    this.init();
  }

  init() {
    console.log('🌌 Dinamik Atmosfer Motoru (Sovereign Sync) başlatıldı.');
    
    // 1. Otonom Mod (Günün saatine göre otomatik ayar)
    this.runAutonomousTemporalCheck();

    // 2. Merkezi Dinleme (Boardroom Müdahalesi)
    this.bus.on('admin:force_atmosphere', (data) => {
      console.log('⚡ [Atmosphere Sync]: Boardroom müdahalesi algılandı.', data);
      const targetTheme = typeof data === 'string' ? data : data.theme;
      if (targetTheme) {
        this.setTheme(targetTheme, 'Boardroom Force (Divine Intervention)');
      }
    });

    // 3. Başlangıç temasını mühürle
    this.setTheme(this.currentTheme, 'Sistem Başlatma (Hydration)');
  }

  /**
   * Antigravity AI Temporal Context: Günün saatine göre atmosferi otonom değiştirir.
   */
  runAutonomousTemporalCheck() {
    const hour = new Date().getHours();
    
    // 07:00 - 18:00 arası Mediterranean Zen (Gündüz), aksi takdirde Adriatic Night (Gece)
    let suggestedTheme = (hour >= 7 && hour < 18) ? 'mediterranean-zen' : 'adriatic-night';
    
    console.log(`🧠 [Antigravity AI]: Temporal Context analiz edildi. Önerilen Atmosfer: ${suggestedTheme}`);
    this.currentTheme = suggestedTheme;
  }

  /**
   * HTML kök dizinine data-theme niteliğini atayarak CSS token'larını değiştirir.
   * Ayrıca sayfadaki medya öğelerini (video/img) yeni atmosfere senkronize eder.
   */
  setTheme(themeName, triggerReason = 'Otonom Zaman Algısı') {
    if (this.currentTheme === themeName && this.htmlRoot.hasAttribute('data-theme')) return;

    this.currentTheme = themeName;
    this.htmlRoot.setAttribute('data-theme', themeName);
    
    // Medya Senkronizasyonu (Video & Images)
    this.syncVisualMedia(themeName);
    
    console.log(`✨ Atmosfer Değiştirildi: ${themeName} (${triggerReason})`);

    // Değişimi Truth Layer'a fısılda (Environmental Intel)
    this.bus.emit('public:atmosphere_sync', {
      theme: themeName,
      reason: triggerReason,
      timestamp: new Date().toISOString()
    });
    
    window.dispatchEvent(new CustomEvent('santis:atmosphere-change', { detail: { theme: themeName, reason: triggerReason } }));
  }

  /**
   * Sayfadaki 'data-atmosphere-src' özniteliğine sahip öğeleri yeni temaya göre günceller.
   * Örnek: <video data-atmosphere-src-zen="zen.mp4" data-atmosphere-src-adriatic="night.mp4">
   */
  syncVisualMedia(themeName) {
    const themeKey = themeName.split('-').pop(); // 'mediterranean-zen' -> 'zen'
    const elements = document.querySelectorAll(`[data-atmosphere-src-${themeKey}]`);
    
    elements.forEach(el => {
      const newSrc = el.getAttribute(`data-atmosphere-src-${themeKey}`);
      if (!newSrc) return;

      if (el.tagName === 'VIDEO' || el.tagName === 'IMG') {
        // Yumuşak geçiş için opacity animasyonu (Opsiyonel, CSS ile de yapılabilir)
        el.style.opacity = '0';
        
        setTimeout(() => {
          el.src = newSrc;
          if (el.tagName === 'VIDEO') el.load();
          el.style.opacity = '1';
        }, 400); // CSS transition süresiyle uyumlu
      }
    });
  }

  /**
   * Manuel Geçersiz Kılma (Manual Override)
   */
  toggleAtmosphere() {
    const newTheme = this.currentTheme === 'mediterranean-zen' ? 'adriatic-night' : 'mediterranean-zen';
    this.setTheme(newTheme, 'Manuel Geçersiz Kılma (Guest Override)');
  }
}

// Global başlatma (Sovereign Autonomy)
window.SantisAtmosphere = new SantisAtmosphereEngine();
