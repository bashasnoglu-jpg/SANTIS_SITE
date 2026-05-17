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

    // 2. Başlangıç temasını mühürle
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
   */
  setTheme(themeName, triggerReason = 'Otonom Zaman Algısı') {
    if (this.currentTheme === themeName && this.htmlRoot.hasAttribute('data-theme')) return;

    this.currentTheme = themeName;
    this.htmlRoot.setAttribute('data-theme', themeName);
    
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
   * Manuel Geçersiz Kılma (Manual Override)
   */
  toggleAtmosphere() {
    const newTheme = this.currentTheme === 'mediterranean-zen' ? 'adriatic-night' : 'mediterranean-zen';
    this.setTheme(newTheme, 'Manuel Geçersiz Kılma (Guest Override)');
  }
}
