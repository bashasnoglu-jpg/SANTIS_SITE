// santis-adaptive-ui.js?v=V34_OMEGA
class AdaptiveMorphEngine {
  constructor() {
    this.state = 'sovereign'; // sovereign, zen
    this.stressLevel = 0;
    this.root = document.documentElement;
    console.log("🧠 [Adaptive UI] Phase 63: Nöro-Arayüz Motoru Uyandı. Niyet vektörleri dinleniyor...");
    this.bindSensors();
  }

  bindSensors() {
    // Orchestrator'dan (worker'dan) gelen stresi dinle
    window.addEventListener('santis:stress-spike', (e) => {
      this.stressLevel = Math.min(this.stressLevel + (e.detail?.value || 25), 100);
      this.evaluateState();
    });

    // Soğuma Döngüsü (Zamanla kullanıcı sakinleşir, UI eski haline döner)
    setInterval(() => {
      if (this.stressLevel > 0) {
        this.stressLevel = Math.max(this.stressLevel - 10, 0);
        this.evaluateState();
      }
    }, 4000);
  }

  evaluateState() {
    if (this.stressLevel > 70 && this.state !== 'zen') {
      this.morphTo('zen');
    } else if (this.stressLevel < 30 && this.state !== 'sovereign') {
      this.morphTo('sovereign');
    }
  }

  morphTo(targetState) {
    this.state = targetState;
    if (targetState === 'zen') {
      console.log("🧘 [Adaptive UI] Kognitif yük limitlerde. Arayüz 'ZEN' moduna esniyor...");
      // Arayüzü yumuşat, yavaşlat ve gözü yormayan hale getir
      this.root.style.setProperty('--santis-motion-speed', '1.8s'); 
      this.root.style.setProperty('--santis-ui-contrast', '0.85');
      this.root.style.setProperty('--santis-layout-gap', '3rem'); // Elementler arası nefes boşluğu
      document.body.classList.add('santis-layout-zen');
    } else {
      console.log("⚖️ [Adaptive UI] Ritim stabil. Sovereign ihtişamına geri dönüldü.");
      this.root.style.setProperty('--santis-motion-speed', '0.4s');
      this.root.style.setProperty('--santis-ui-contrast', '1');
      this.root.style.setProperty('--santis-layout-gap', '1.5rem');
      document.body.classList.remove('santis-layout-zen');
    }
  }
}

if (!window.__adaptiveMorphEngine) window.__adaptiveMorphEngine = new AdaptiveMorphEngine();
