// santis-hypnagogic-protocol.js?v=V35_OMEGA
class HypnagogicProtocol {
  constructor() {
    this.timer = null;
    this.sleepDelay = 15000; // 15 saniye (Kuantum Uykusu)
    this.isSleeping = false;
    
    console.log("🌙 [Hypnagogic Protocol] Phase 67: Kuantum Uyku Döngüsü başlatıldı.");
    this.bind();
    this.resetTimer();
  }

  bind() {
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(e => {
        document.addEventListener(e, () => this.wakeUp(), { passive: true });
    });
  }

  resetTimer() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.fallAsleep(), this.sleepDelay);
  }

  fallAsleep() {
    if (this.isSleeping) return;
    this.isSleeping = true;
    
    console.log("🌌 [Hypnagogic] Sistem uykuya dalıyor. Pikseller dinleniyor...");
    requestAnimationFrame(() => {
        document.body.classList.add('santis-sleep-mode');
        document.documentElement.style.setProperty('--santis-ui-contrast', '0.4');
        document.documentElement.style.setProperty('--santis-motion-speed', '2.5s'); // Uykuya dalarken çok yavaş esne
    });
  }

  wakeUp() {
    if (this.isSleeping) {
      this.isSleeping = false;
      console.log("⚡ [Hypnagogic] Aktivite tespit edildi. Organizma uyandı.");
      
      requestAnimationFrame(() => {
          document.body.classList.remove('santis-sleep-mode');
          document.documentElement.style.setProperty('--santis-ui-contrast', '1');
          document.documentElement.style.setProperty('--santis-motion-speed', '0.4s'); // Eski hızına dön
      });
    }
    this.resetTimer();
  }
}

if (!window.__hypnagogicProtocol) window.__hypnagogicProtocol = new HypnagogicProtocol();
