/**
 * ==========================================
 * 🧠 SANTIS EMOTION LAYER (CAR v1)
 * Cognitive Affective Runtime
 * ==========================================
 * Bu modül kullanıcının fiziksel farenin/kaydırmasının
 * ardındaki "Duygu Durumunu" (Emotion) probabilistik 
 * olarak otonom hesaplar ve UI Reaksiyonunu belirler.
 */

// 1. DUYGUSAL HAFIZA VE İŞLEME MERKEZİ
window.EmotionCortex = {
    state: {
      impatience: 0,
      frustration: 0,
      curiosity: 0
    },
  
    update(observation) {
      const decay = 0.92; // Temporal Smoothing: Zamanla sakinleşme
  
      for (let k in this.state) {
        this.state[k] *= decay;
      }
  
      // Inference Injection
      if (observation.type === "jitter") {
        this.state.impatience += 0.15;
        this.state.frustration += 0.05;
      }
      if (observation.type === "erratic_scroll") {
        this.state.impatience += 0.2;
        this.state.frustration += 0.1;
      }
      if (observation.type === "idle_tap") {
        this.state.curiosity += 0.1;
        this.state.frustration += 0.05;
      }
  
      this.normalize();
    },
  
    normalize() {
      const sum = Object.values(this.state).reduce((a,b)=>a+b,0) || 1;
      for (let k in this.state) {
        this.state[k] = this.state[k] / sum;
      }
    }
};
  
// 2. DUYGU → UX TRANSLATION LOB'u (Karar Mekanizması)
window.EmotionPolicy = {
    decide() {
      const e = window.EmotionCortex.state;
  
      // Sabırsızlık Dominant (Kullanıcı beklemek istemiyor)
      if (e.impatience > 0.5) {
        return {
          animation: "NONE",
          navigation: "HARD",
          prefetch: "MINIMAL",
          tone: "direct"
        };
      }
  
      // Sinir/Karmaşa Dominant (Kullanıcı aradığını bulamadı)
      if (e.frustration > 0.5) {
        return {
          animation: "REDUCED",
          uiDensity: "LOW",
          contrast: "HIGH", // Okunabilirliği artır
          tone: "calm"
        };
      }
  
      // Merak Dominant (Keşfetme modunda)
      if (e.curiosity > 0.5) {
        return {
          animation: "ENHANCED", // Şov yap
          prefetch: "AGGRESSIVE", // Yolu önden hazırla
          tone: "exploratory"
        };
      }
  
      return {
        animation: "STANDARD",
        tone: "neutral"
      };
    }
};

// 3. EMOTION STABILITY GATE (Aşırı Tepki Koruması)
window.EmotionStabilityGate = {
    apply(state) {
      const intensity = state.impatience + state.frustration + state.curiosity;
      // Sistem panik yapmak yerine kendini dizginler (Dampening)
      if (intensity > 0.7) {
        return { dampening: 0.6, uiFreezeProtection: true };
      }
      return { dampening: 1.0, uiFreezeProtection: false };
    }
};
  
// 4. SENSÖR AĞI FÜZYONU (Davranışları Okuyan Gözler)
window.EmotionSensors = {
    start() {
      let lastMove = Date.now();
  
      // Jitter (Titreme) Sensörü
      document.addEventListener("mousemove", (e) => {
        if (this.detectJitter(e)) {
            window.EmotionCortex.update({ type: "jitter" });
        }
      }, { passive: true });
  
      // Agresif Kaydırma Sensörü
      document.addEventListener("scroll", () => {
        const now = Date.now();
        const delta = now - lastMove;
        
        // 150ms'den hızlı art arda kaydırmalar = Sabırsızlık
        if (delta < 150) {
            window.EmotionCortex.update({ type: "erratic_scroll" });
        }
        lastMove = now;
      }, { passive: true });
  
      // Idle Tapping (Boşluğa Tıklama)
      document.addEventListener("click", (e) => {
        if (e.target === document.body || e.target.tagName === 'MAIN') {
            window.EmotionCortex.update({ type: "idle_tap" });
        }
      }, { passive: true });

      // Otonom UX Şekillendirici (Feedback Loop)
      setInterval(() => {
        const stability = window.EmotionStabilityGate.apply(window.EmotionCortex.state);
        if (!stability.uiFreezeProtection) {
            const policy = window.EmotionPolicy.decide();
            this.enforcePolicy(policy);
        }
      }, 5000);
    },
  
    detectJitter(e) {
      // Mikro hareket varyansı: Mouse çok kısa mesafelerde sürekli yön değiştiriyorsa
      // Not: Production ortamı için matematiksel sapma eklenebilir.
      return Math.random() > 0.95; 
    },

    enforcePolicy(policy) {
        // UI Katmanına Kararı İletir (Örn: Lüks Animasyonları Kapat/Aç)
        const html = document.documentElement;
        if (policy.animation === "NONE" || policy.animation === "REDUCED") {
            html.classList.add('santis-emotion-calm'); // CSS ile transition duration 0'a çekilir
        } else {
            html.classList.remove('santis-emotion-calm');
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.EmotionSensors.start());
} else {
    window.EmotionSensors.start();
}
