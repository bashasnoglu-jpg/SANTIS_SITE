// santis-eco-zen.js?v=V35_OMEGA
class EcoZenMotor {
  constructor() {
    this.init();
  }

  async init() {
    console.log("🔋 [Eco-Zen Motor] Phase 65: Batarya telemetrisi okunuyor...");
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        this.evaluate(battery);
        
        battery.addEventListener('levelchange', () => this.evaluate(battery));
        battery.addEventListener('chargingchange', () => this.evaluate(battery));
      } catch (e) {
        console.warn("🔋 [Eco-Zen] API erişimi reddedildi.");
      }
    } else {
      console.log("🍃 [Eco-Zen] Batarya API desteklenmiyor. Fallback modunda...");
    }
  }

  evaluate(battery) {
    if (!battery.charging && battery.level <= 0.20) {
      console.log(`🍃 [Eco-Zen] Düşük enerji tespit edildi (%${Math.round(battery.level*100)}). Minimalist hayatta kalma moduna geçiliyor...`);
      document.body.classList.add('santis-eco-mode');
      document.documentElement.style.setProperty('--santis-motion-speed', '0s'); // Kapat animasyonları
    } else {
      document.body.classList.remove('santis-eco-mode');
      document.documentElement.style.setProperty('--santis-motion-speed', '0.4s');
    }
  }
}

if (!window.__ecoZenMotor) window.__ecoZenMotor = new EcoZenMotor();
