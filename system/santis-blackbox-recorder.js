// santis-blackbox-recorder.js
// SDCR V52.0 OMEGA - OBSERVABILITY & CAUSALITY LAYER

class SantisBlackBox {
  constructor(maxCapacity = 2000) {
    this.tape = [];
    this.capacity = maxCapacity; // Ring Buffer limiti (Memory Leak Koruması)
    this.bootTime = performance.now();
    this.isReplaying = false;

    console.warn('%c[SDCR:BLACKBOX] ⬛ Ocular Recording Engine Online. Causality tracking started.', 'color: #888; font-weight: bold;');
    
    // Global exposure for all organs to report
    window.__SDCR_BLACKBOX__ = this;
    
    this.initSWListener();
  }

  // -----------------------------
  // 1. EVENT INGESTION (Nedensellik Kaydı)
  // -----------------------------
  record(actor, action, reason, meta = {}) {
    if (this.isReplaying) return; // Ghost Protocol sırasında sonsuz döngü paradoksu yaratma

    const timestamp = Math.round(performance.now() - this.bootTime);
    const currentSSS = window.__SANTIS_SSS__ || 0;

    const snapshot = {
      t: timestamp,
      actor,       // Kim yaptı? ('CORTEX', 'INTERCEPTOR', 'ASSASSIN', 'TELEMETRY')
      action,      // Ne yaptı? ('AMPUTATE', 'RESURRECT', 'CHOKE_CPU', 'SKIP_MODULE')
      reason,      // Neden yaptı? ('SSS_CRITICAL', 'LAB_TEST', 'COOL_DOWN')
      sss: currentSSS,
      meta
    };

    this.tape.push(snapshot);

    // ⭕ Ring Buffer (FIFO Amnesia): Gözlemcinin bizzat RAM'i şişirmesini engelle
    if (this.tape.length > this.capacity) {
      this.tape.shift();
    }
  }

  // -----------------------------
  // 2. SW IPC BRIDGE (Kör Nokta Çözücü)
  // -----------------------------
  // Service Worker (Interceptor) izole yaşadığı için kararlarını postMessage ile fısıldar
  initSWListener() {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'BLACKBOX_LOG') {
          this.record('INTERCEPTOR', event.data.action, event.data.reason, event.data.meta);
        }
      });
    }
  }

  // -----------------------------
  // 3. FORENSIC DUMP (Otopsi ve Zaman Çizelgesi)
  // -----------------------------
  generateAutopsy() {
    console.groupCollapsed('%c⬛ SDCR V52.0 - POST-MORTEM & CAUSALITY TIMELINE', 'color: #00ffcc; background: #000; padding: 4px 8px;');
    
    if (this.tape.length === 0) {
      console.log('Kayıt yok. Sistem kusursuz bir barış içinde yaşadı.');
      console.groupEnd();
      return;
    }

    const tableData = this.tape.map(e => ({
      'Time': `T+${e.t}ms`,
      'Actor': e.actor,
      'Action': e.action,
      'Stress (SSS)': e.sss >= 600 ? `🔴 ${e.sss}` : (e.sss >= 200 ? `🟡 ${e.sss}` : `🟢 ${e.sss}`),
      'Causality (Why?)': e.reason,
      'Context': JSON.stringify(e.meta)
    }));

    console.table(tableData);
    console.groupEnd();
    
    return this.tape;
  }

  // -----------------------------
  // 4. DNA EXPORT (Hive Mind Hazırlığı)
  // -----------------------------
  exportDNA() {
    // Sürüyü (Swarm) ilgilendirmeyen Assassin test loglarını çıkar, 
    // sadece evrimsel hayatta kalma kararlarını (Amputasyon, Cortex Skip) al.
    const evolutionChain = this.tape.filter(e => 
      ['AMPUTATE', 'RESURRECT', 'SKIP_MODULE'].includes(e.action)
    );
    
    const payload = {
      session_duration: performance.now() - this.bootTime,
      mutations: evolutionChain
    };

    // P2P transfer için Base64 kodlanmış genetik dizilim
    return btoa(JSON.stringify(payload)); 
  }

  // -----------------------------
  // 5. GHOST PROTOCOL (Time-Travel Replay)
  // -----------------------------
  async replayTape(tapeData = this.tape) {
    if (tapeData.length === 0) return console.warn('[BLACKBOX] No tape to replay.');

    console.warn('[SDCR:BLACKBOX] ⏪ GHOST PROTOCOL: Deterministik simülasyon için Runtime ele geçiriliyor...');
    this.isReplaying = true;

    const originalSSS = window.__SANTIS_SSS__ || 0;

    for (let i = 0; i < tapeData.length; i++) {
      const event = tapeData[i];
      const nextEvent = tapeData[i + 1];

      // O anki stresi (SSS) sisteme zorla (Force Injection)
      window.__SANTIS_SSS__ = event.sss;

      const sssColor = event.sss >= 600 ? 'color: #ff4444' : (event.sss >= 200 ? 'color: #ffbb33' : 'color: #00C851');
      console.log(
        `%c[T+${event.t}ms] %c[SSS: ${event.sss}] %c[${event.actor}] -> ${event.action} %c(Why: ${event.reason})`, 
        'color: gray', sssColor, 'color: white; font-weight: bold;', 'color: cyan'
      );

      if (nextEvent) {
        // Gerçek bekleme süresini hesapla (Replay sırasında saatlerce beklememek için max 1 saniye cap koyuyoruz)
        const delay = Math.min(nextEvent.t - event.t, 1000);
        await new Promise(r => setTimeout(r, delay));
      }
    }

    // Gerçekliği geri ver
    window.__SANTIS_SSS__ = originalSSS;
    this.isReplaying = false;
    console.warn('[SDCR:BLACKBOX] ⏹️ REPLAY FINISHED. Reality restored.');
  }
}

export const blackbox = new SantisBlackBox();
