/**
 * SANTIS OS - MODULE: Intent & Revenue Engine
 * Architecture: Web Worker Offloading, State-Driven UI, Autonomous CTA
 */

export class RevenueEngineModule {
  constructor(engine) {
    this.engine = engine;
    this._isAlive = false;
    this._subscriptions = [];
    this.intentWorker = null;

    // İstihbarat Spammer Koruması
    this.lastTransmittedMood = null;
    this.lastTransmitTime = 0;
    this.TRANSMIT_COOLDOWN = 60000; // Aynı niyet saniyede bir atılmasın
  }

  mount() {
    this._isAlive = true;
    this.initCognitiveWorker();
    this.bindDynamicOfferSystem();
    console.log('🔥 [Santis OS] Revenue Engine v1 Armed & Active.');
  }

  // 1. KOGNİTİF İŞLEMCİ (Web Worker İzolasyonu)
  initCognitiveWorker() {
    // Worker kodunu Blob olarak oluşturuyoruz (Ayrı dosya gerektirmez, Plug & Play)
    const workerCode = `
      self.onmessage = function(e) {
        const { scrollDepth, cursorSpeed, hoverTime } = e.data;
        let mood = 'browsing';
        let confidence = 0.50;

        // Neural Karar Algoritması (Saldırı Modu)
        if (cursorSpeed > 2500 && scrollDepth < 30) {
          // Kullanıcı aniden yukarı/kapatmaya yöneldi
          mood = 'exit_intent';
          confidence = 0.90;
        } else if (hoverTime > 2500 && scrollDepth > 60) {
          // Fiyatlara veya paketlere uzun süre odaklandı
          mood = 'buying';
          // Hover süresine göre güven skorunu artır (Maks: 0.99)
          confidence = Math.min(0.99, 0.70 + (hoverTime / 10000)); 
        } else if (scrollDepth > 80 && cursorSpeed < 600) {
          // Yavaşça okuyarak aşağı iniyor, ısınıyor
          mood = 'engaged';
          confidence = 0.85;
        }

        self.postMessage({ mood, confidence });
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.intentWorker = new Worker(URL.createObjectURL(blob));

    // Worker'dan gelen kararı doğrudan Santis Core State'ine yazdır
    this.intentWorker.onmessage = (e) => {
      if (!this._isAlive) return;
      this.engine.setState('intent', e.data);
    };

    // NeuralRuntime'dan gelen verileri Worker'a pompala
    const unsubNeural = this.engine.subscribe('neuralData', (sensorData) => {
      if (this.intentWorker && this._isAlive) {
        this.intentWorker.postMessage(sensorData);
      }
    });
    
    this._subscriptions.push(unsubNeural);
  }

  // 2. DİNAMİK TEKLİF SİSTEMİ (Revenue-Driven UI)
  bindDynamicOfferSystem() {
    const mainCtaBtn = document.getElementById('santis-master-cta');

    // Niyet (Intent) state'ini dinle ve UI'ı Priority Scheduler kalkanıyla güncelle
    const unsubIntent = this.engine.subscribe('intent', (intentData) => {
      if (!this._isAlive || !intentData) return;

      // Layout Thrashing'i önlemek için requestAnimationFrame kullanımı
      requestAnimationFrame(() => {
        if (mainCtaBtn) {
          if (intentData.mood === 'buying' && intentData.confidence >= 0.85) {
            // SALDIRI: Kullanıcı satın almaya hazır
            mainCtaBtn.textContent = 'Şimdi Rezervasyon Yap (Son 1 Yer)';
            mainCtaBtn.className = 'w-full py-4 santis-cta-hot font-bold transition-all duration-300 animate-pulse';
          } 
          else if (intentData.mood === 'exit_intent' && intentData.confidence >= 0.80) {
            // KURTARMA: Kullanıcı kaçıyor
            mainCtaBtn.textContent = 'Sistemden Çıkmadan %10 İndirimini Al';
            mainCtaBtn.className = 'w-full py-4 text-black bg-santis-gold font-bold transition-all duration-300 transform scale-105';
          } 
          else {
            // BEKLEME: Standart "Quiet Luxury" modu
            mainCtaBtn.textContent = 'Sessizliğe Adım At';
            mainCtaBtn.className = 'w-full py-4 santis-cta-waiting font-light transition-all duration-1000';
          }
        }

        // 2. BEACON API: GİZLİ İSTİHBARAT AKTARIMI
        if (intentData.confidence >= 0.85) {
          this.transmitHotLead(intentData);
        }
      });
    });

    this._subscriptions.push(unsubIntent);

    // 3. Kapanış Kapanı (Page Unload)
    // Kullanıcı sekmeyi kapatırken son bir "Exit Intent" fırlatır
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.transmitHotLead({ mood: 'abandoned_session', confidence: 1.0 });
      }
    });
  }

  // 📡 GİZLİ VERİ TRANSFER MERKEZİ
  transmitHotLead(intentData) {
    // Cooldown kontrolü: Aynı lead türünü sürekli sunucuya basmayı engeller
    const now = Date.now();
    if (this.lastTransmittedMood === intentData.mood && (now - this.lastTransmitTime < this.TRANSMIT_COOLDOWN)) {
      return; 
    }

    const payload = JSON.stringify({
      sessionId: this.engine.getState('visitorId') || `GUEST_${Math.random().toString(36).substr(2, 9)}`,
      mood: intentData.mood,
      confidence: intentData.confidence.toFixed(2),
      url: window.location.pathname,
      timestamp: new Date().toISOString()
    });

    // sendBeacon JSON verisini en sağlıklı Blob formatında yollar
    const blob = new Blob([payload], { type: 'application/json' });
    const success = navigator.sendBeacon('/api/intelligence/hot-lead', blob);

    if (success) {
      this.lastTransmittedMood = intentData.mood;
      this.lastTransmitTime = now;
      console.log(`🦅 [Santis Intelligence] Payload fırlatıldı: ${intentData.mood} (%${Math.round(intentData.confidence * 100)})`);
    }
  }

  // 3. ELITE LIFECYCLE (Garbage Collection)
  unmount() {
    this._isAlive = false;
    
    if (this.intentWorker) {
      this.intentWorker.terminate(); // Web Worker'ı acımasızca öldür (Zero-Leak)
      this.intentWorker = null;
    }

    this._subscriptions.forEach(unsub => unsub());
    this._subscriptions = [];
    
    console.log('💀 [Santis OS] Revenue Engine Terminated.');
  }
}
