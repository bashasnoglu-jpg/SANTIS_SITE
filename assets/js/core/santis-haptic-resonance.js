// santis-haptic-resonance.js?v=V35_OMEGA
class HapticResonance {
  constructor() {
    console.log("📳 [Haptic Resonance] Phase 66: Biyometrik dokunsal motor devrede.");
    this.bind();
  }

  bind() {
    document.addEventListener('click', (e) => {
      // Sadece etkileşimli elemanlarda titre
      const target = e.target.closest('button, a, .santis-card, input, [role="button"], .card, .btn');
      if (target && navigator.vibrate) {
        // Çıt diye lüks hissettiren ince titreşim (15ms)
        try {
          navigator.vibrate(15); 
        } catch (err) {
          // Sessiz hata yönetimi
        }
      }
    }, { passive: true });
  }
}

if (!window.__hapticResonance) window.__hapticResonance = new HapticResonance();
