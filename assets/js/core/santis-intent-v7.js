/**
 * ==========================================
 * 🧠 SANTIS INTENT PREDICTION LAYER (PCBR v1)
 * Pre-Cognitive Behavioral Runtime
 * ==========================================
 * Kullanıcının fiziksel farenin ardındaki "Niyetini"
 * 800ms önceden vektörel olarak kestirip sistemi hazırlar.
 * EmotionCortex'ten gelen duygu durumuna göre risk filtreler.
 */

// 1. TRAJECTORY ENGINE (Hız ve Yön Vektörü)
window.IntentForecaster = {
    history: [],
  
    observe(event) {
      this.history.push({
        x: event.clientX,
        y: event.clientY,
        t: performance.now()
      });
  
      if (this.history.length > 5) this.history.shift();
    },
  
    predict() {
      if (this.history.length < 3) return null;
  
      const v = this.history;
      // Düzlemsel ivme ve zaman hesaplama
      const dx = v[v.length-1].x - v[0].x;
      const dy = v[v.length-1].y - v[0].y;
      const dt = Math.max(1, v[v.length-1].t - v[0].t);
  
      return {  
        vx: dx / dt, // px per ms (Horizontal)
        vy: dy / dt  // px per ms (Vertical)
      };
    }
};

// 2. COLLISION FIELD (Kesişim Simülatörü)
window.IntentField = {
    evaluate(targets) {
      const velocity = window.IntentForecaster.predict();
      if (!velocity) return [];
  
      const predictions = [];
  
      for (const t of targets) {
        const rect = t.getBoundingClientRect();
  
        // Kullanıcının 800ms sonra (kendi ivmesiyle) nerede olacağını farz ediyoruz
        const currentX = window.IntentForecaster.history[window.IntentForecaster.history.length-1].x;
        const currentY = window.IntentForecaster.history[window.IntentForecaster.history.length-1].y;

        const futureX = currentX + (velocity.vx * 800);
        const futureY = currentY + (velocity.vy * 800);
  
        const hit =
          futureX >= rect.left &&
          futureX <= rect.right &&
          futureY >= rect.top &&
          futureY <= rect.bottom;
  
        if (hit) {
          predictions.push({
            element: t,
            probability: this.confidence(velocity, rect)
          });
        }
      }
  
      return predictions.sort((a,b)=>b.probability - a.probability);
    },
  
    confidence(v, rect) {
      // Çarpışmanın şiddetini ve hızını hesapla. Hız ne kadar keskinse kararlılık (confidence) o kadar yüksektir.
      return Math.min(0.95, Math.abs(v.vx) + Math.abs(v.vy));
    }
};

// 3. INTENT SAFETY GATE (Aşırı Zeka Koruması)
window.IntentSafetyGate = {
    filter(intentArr, emotionState) {
      if (!intentArr.length) return [];
  
      // [!] KULLANICI STRESLİ/SİNİRLİ İSE: 
      // Boşa (false-positive) sunucuyu yormamak için agresif ön yüklemeyi durdur (%60 kırpar)
      if (emotionState && emotionState.frustration > 0.6) {
        return intentArr.map(i => ({
          ...i,
          probability: i.probability * 0.6
        }));
      }
  
      // [!] KULLANICI RAHAT/HAREKETSİZ (IDLE) İSE:
      // Konservatif prefetch: Rahat takıldığı için acil yüklemeye gerek yok
      if (emotionState && emotionState.impatience < 0.3) {
        return intentArr.map(i => ({
          ...i,
          probability: i.probability * 0.7
        }));
      }
  
      return intentArr;
    }
};

// 4. PRE-ACTIVATION LAYER (Arka Plan Silahlandırması)
window.IntentPreloader = {
    trigger(predictions) {
      const top = predictions[0];
      if (!top) return;
  
      // Karar eşiği %70 olarak belirlenmiştir. (Over-preload maliyetinden kaçış)
      if (top.probability > 0.70) {
        this.preload(top.element);
      }
    },
  
    preload(element) {
      const action = element.dataset.action || element.getAttribute('href');
      if(element.dataset.preloaded) return; // Zaten hazırlanmışsa tekrar yapma

      element.dataset.preloaded = "true";
      console.log(`%c[INTENT FORECAST] 🔮 Eylem 800ms Önceden Ateşlendi: ${action}`, "color: #00ffcc;");
      
      // Aksiyona Göre Özel Hazırlık (Mock Functions API varsayımıyla)
      switch(action) {
        case "reservation":
          if (window.SantisAPI) window.SantisAPI.prefetchReservation();
          break;
        case "checkout":
          if (window.SantisAPI) window.SantisAPI.prefetchStripe();
          break;
        case "menu":
          if (window.SantisAPI) window.SantisAPI.prefetchMenu();
          break;
        default:
          // Standart bir URL ise Oracle / Ghost Engine'e devret
          if (action && typeof window.SantisGhostEngine !== 'undefined') {
              window.SantisGhostEngine.preload(action, 'ghost-cache');
          }
          break;
      }
    }
};

// 5. THE LOOP (Kalp Atışı)
if (typeof document !== "undefined") {
    document.addEventListener("mousemove", (e) => {
        window.IntentForecaster.observe(e);
      
        // Sadece Dataset değerinde [data-action] veya önemli linkleri tarayarak performansı artır
        const targets = document.querySelectorAll("[data-action], a[data-intent]");
        if(!targets.length) return;

        const predictions = window.IntentField.evaluate(targets);
      
        // Sistemde EmotionCortex var mı? (Geriye Dönük Uyumluluk)
        const emotion = (window.EmotionCortex && window.EmotionCortex.state) ? window.EmotionCortex.state : { impatience: 0.5, frustration: 0 };
      
        const safePredictions = window.IntentSafetyGate.filter(predictions, emotion);
      
        window.IntentPreloader.trigger(safePredictions);
    }, { passive: true }); // passive true -> scroll/render performansını kilitlememek için
}
