// santis-telemetry-emitter.js

export class SovereignTelemetry {
  constructor(endpoint, visitorInfo = {}) {
    this.endpoint = endpoint;
    this.visitorInfo = visitorInfo; // { visitorId, sessionId vb. }
    this.socket = null;

    // Otonom Sistem Değişkenleri
    this.queue = [];
    this.isConnected = false;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;

    // Orbital Stream için Throttle (Kısma) kontrolü
    this.lastOrbitalPulse = 0;
    this.orbitalThrottleMs = 250; // Çeyrek saniyede bir ping atar

    this.connect();
  }

  connect() {
    // Mevcut bağlantı varsa veya deneniyorsa durdur
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.socket = new WebSocket(this.endpoint);

    this.socket.onopen = () => {
      console.log(`[Telemetry] Uplink Established: ${this.endpoint}`);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // KIMLIK DOGRULAMA: WebSocket açıldığı an kendini bildir. 
      this.socket.send(JSON.stringify({
        type: 'AUTH',
        role: 'GHOST_CELL',
        client: this.visitorInfo
      }));

      this.flushQueue(); // Bekleyen mesajları fırlat
    };

    this.socket.onclose = () => {
      this.isConnected = false;
      console.warn('[Telemetry] Uplink Lost. Retrying...');
      this.scheduleReconnect();
    };

    this.socket.onerror = (err) => {
      // Hata durumunda onclose zaten tetikleneceği için sadece logluyoruz
      console.error('[Telemetry] Socket Error.', err);
    };
  }

  scheduleReconnect() {
    const backoffTime = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000); // Max 30s
    this.reconnectAttempts++;

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), backoffTime);
  }

  /**
   * Ana Gönderim Fonksiyonu
   */
  _emit(type, payload) {
    const packet = {
      type: type,
      client: this.visitorInfo,
      payload: payload,
      timestamp: Date.now()
    };

    if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(packet));
    } else {
      // Bağlantı yoksa kara kutuya al (En fazla 50 mesaj tutarak RAM'i koru)
      if (this.queue.length < 50) {
        this.queue.push(packet);
      }
    }
  }

  flushQueue() {
    while (this.queue.length > 0 && this.socket.readyState === WebSocket.OPEN) {
      const packet = this.queue.shift();
      this.socket.send(JSON.stringify(packet));
    }
  }

  // --- KAMUSAL API (RADAR TETİKLEYİCİLERİ) ---

  // Kırmızı Hat
  emitThreatPulse(spoofedName, detectedHex, signature, action = "QUARANTINED") {
    this._emit("THREAT_PULSE", { spoofedName, detectedHex, signature, action });
  }

  // Sarı Hat
  emitDegradationWarn(engineState, riskLevel = "UI_JANK_EXPECTED") {
    this._emit("DEGRADATION_WARN", { engineState, riskLevel });
  }

  // Mavi/Yeşil Hat (Throttle Korumalı)
  emitOrbitalStream(fileId, percent, speedStr = "Calculating...") {
    const now = Date.now();
    if (now - this.lastOrbitalPulse >= this.orbitalThrottleMs || percent === 100) {
      this._emit("ORBITAL_STREAM", { fileId, percent, speed: speedStr });
      this.lastOrbitalPulse = now;
    }
  }
}

// Proje genelinde kullanılacak Singleton
// Üretimde wss:// kullan ve token'ı .env'den oku
export const uplinkTelemetry = new SovereignTelemetry(
  'ws://localhost:8080/?role=emitter&token=SANTIS-CORE-TX99',
  {
    visitorId: window.__SANTIS_VISITOR_ID__ || 'ANON',
    userAgent: navigator.userAgent
  }
);

// ----------------------------------------------------------------------
// THE GREAT BYPASS: Matrix Engine WebTransport Entegrasyonu
// ----------------------------------------------------------------------
let transport;
let datagramWriter;

export async function initMatrixTelemetry() {
  try {
    // Gateway portumuz olan 4040'a bağlanıyoruz
    transport = new WebTransport('https://localhost:4040/telemetry'); 
    await transport.ready;
    
    // Datagram yazıcısını alıyoruz (Doğrudan RAM bypass)
    datagramWriter = transport.datagrams.writable.getWriter();
    console.log("[SOVEREIGN_GATEWAY] WebTransport Tüneli Kilitlendi. 60FPS Akış Başlıyor.");

    // Fare hareketlerini dinle
    document.addEventListener('mousemove', (e) => {
      if (datagramWriter) {
        // THE GREAT BYPASS: JSON.stringify KULLANMIYORUZ!
        // X, Y koordinatlarını ve zaman damgasını 32-bit Float dizisine sıkıştırıyoruz
        const payload = new Float32Array([e.clientX, e.clientY, Date.now()]);
        
        // Ham baytları (Uint8Array) doğrudan tünele fırlatıyoruz (Fire and Forget)
        datagramWriter.write(new Uint8Array(payload.buffer)).catch(err => {
          // Datagramlar kaybolabilir, bu yüzden hata fırlatmasını sessizce yutabiliriz
          // console.debug("Datagram drop:", err);
        });
      }
    });
  } catch (error) {
    console.warn("[SOVEREIGN_GATEWAY] Telemetri Bağlantı Hatası (Sertifika veya Ağ Kaynaklı):", error);
  }
}

// Otonom Başlatma
if (typeof window !== 'undefined' && window.WebTransport) {
  initMatrixTelemetry();
} else if (typeof window !== 'undefined') {
  console.warn("[SOVEREIGN_GATEWAY] Tarayıcı WebTransport desteklemiyor. The Great Bypass devre dışı.");
}

