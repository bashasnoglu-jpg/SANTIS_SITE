/**
 * WS Stabilization Patch Pack v1.0
 * Özellikler: Singleton, Reconnect Guard, Handshake ACK, Strict Cleanup
 */
class WebSocketManager {
  // Singleton instance'ları tutacağımız depo (Frontend ve Admin için ayrı)
  static instances = {};

  constructor(namespace, url, options = {}) {
    // 1. SINGLETON KALKANI: Bu namespace için zaten bir bağlantı varsa, onu döndür.
    if (WebSocketManager.instances[namespace]) {
      console.warn(`[WS Guard] ${namespace} için zaten aktif bir bağlantı var. Var olan kalkan kullanılıyor.`);
      return WebSocketManager.instances[namespace];
    }

    // İlk defa oluşturuluyorsa, depoya kaydet
    WebSocketManager.instances[namespace] = this;

    // Temel Değişkenler
    this.namespace = namespace; // 'frontend' veya 'admin'
    this.url = url;
    this.ws = null;
    
    // Durum Bayrakları (Guard Mekanizmaları)
    this.isConnected = false;
    this.isConnecting = false;       // Reconnect fırtınasını önler
    this.isHandshakeComplete = false; // Kimlik doğrulama kalkanı

    // Yeniden Bağlanma Ayarları
    this.reconnectAttempts = 0;
    this.maxAttempts = options.maxAttempts || 5;
    this.baseDelay = options.baseDelay || 1000; // 1 saniye ile başla
    this.reconnectTimer = null;

    // Olay Dinleyicileri (Event Listeners)
    this.onMessageCallback = options.onMessage || null;
  }

  // Bağlantıyı Başlat
  connect() {
    // 2. RECONNECT GUARD: Zaten bağlanıyorsak veya bağlandıysak işlemi durdur.
    if (this.isConnecting || this.isConnected) {
      console.log(`[WS Guard] ${this.namespace} zaten aktif veya bağlanıyor. Çift tetikleme engellendi.`);
      return;
    }

    this.isConnecting = true;
    console.log(`[WS System] ${this.namespace} için bağlantı başlatılıyor...`);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = this._handleOpen.bind(this);
      this.ws.onmessage = this._handleMessage.bind(this);
      this.ws.onclose = this._handleClose.bind(this);
      this.ws.onerror = this._handleError.bind(this);
    } catch (error) {
      console.error(`[WS Error] Bağlantı başlatılamadı:`, error);
      this.isConnecting = false;
      this._scheduleReconnect();
    }
  }

  // 3. HANDSHAKE MEKANİZMASI: Kapı açıldı ama kimlik doğrulaması şart
  _handleOpen() {
    console.log(`[WS System] ${this.namespace} fiziksel bağlantı sağlandı. Handshake (INIT) gönderiliyor...`);
    this.isConnecting = false;
    this.isConnected = true;
    this.reconnectAttempts = 0; // Başarılı bağlantıda deneme sayacını sıfırla

    let identity = null;
    let identitySource = 'Sovereign_Core';
    if (window.SantisIdentity) { identity = window.SantisIdentity.getIdentityBundle(); }

    if (!identity) {
        if (this.namespace === 'admin') {
            identitySource = 'fallback_ephemeral';
            const generateId = (p) => `${p}-EPHEM-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
            let vid = null, sid = null;
            try {
                vid = localStorage.getItem('santis.visitorId') || generateId('VIS');
                localStorage.setItem('santis.visitorId', vid);
                sid = sessionStorage.getItem('santis.sessionId') || generateId('SES');
                sessionStorage.setItem('santis.sessionId', sid);
            } catch(e) {
                vid = generateId('VIS');
                sid = generateId('SES');
            }
            identity = { visitorId: vid, sessionId: sid, connectionId: generateId('CONN') };
        } else {
            console.error("[WS Guard] Sovereign Identity missing for frontend namespace. BLOCKED.");
            this.ws.close();
            return;
        }
    }

    // Sunucuya kimliğimizi bildiriyoruz
    const initPayload = JSON.stringify({
      type: 'INIT',
      namespace: this.namespace,
      token: 'ANONYMOUS',
      visitorId: identity.visitorId,
      sessionId: identity.sessionId,
      connectionId: identity.connectionId,
      timestamp: Date.now(),
      meta: { identitySource }
    });
    this.ws.send(initPayload);
  }

  // Mesajları Yönet ve ACK bekle
  _handleMessage(event) {
    try {
      const data = JSON.parse(event.data);

      // Sunucudan ACK (Onay) geldi mi?
      if (!this.isHandshakeComplete && data.type === 'ACK') {
        console.log(`[WS System] 🟢 ${this.namespace} HANDSHAKE BAŞARILI. Kale kapıları açıldı.`);
        this.isHandshakeComplete = true;
        return; // ACK mesajını dışarı sızdırma
      }

      // Handshake tamamlanmadan gelen diğer mesajları reddet (Güvenlik)
      if (!this.isHandshakeComplete) {
        console.warn(`[WS Guard] Handshake tamamlanmadı! Mesaj reddedildi.`);
        return;
      }

      // Normal mesajları dışarı aktar
      if (this.onMessageCallback) {
        this.onMessageCallback(data);
      }

    } catch (error) {
      console.error(`[WS Error] Mesaj ayrıştırma hatası:`, error);
    }
  }

  _handleClose(event) {
    console.warn(`[WS System] 🔴 ${this.namespace} bağlantısı koptu. Kod: ${event.code}`);
    this._resetState();
    this._scheduleReconnect();
  }

  _handleError(error) {
    console.error(`[WS Error] ${this.namespace} soket hatası:`, error);
    // Hata sonrası onClose otomatik tetiklenir, state sıfırlamayı oraya bırakıyoruz.
  }

  // Yeniden Bağlanma Fırtınası Kalkanı (Exponential Backoff)
  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxAttempts) {
      console.error(`[WS System] ❌ ${this.namespace} için maksimum deneme sayısına ulaşıldı. Bağlantı kesildi.`);
      return;
    }

    // Her denemede süreyi uzat (1s, 2s, 4s, 8s...)
    const delay = this.baseDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`[WS System] ⏳ ${delay}ms sonra yeniden bağlanılacak... (Deneme: ${this.reconnectAttempts})`);
    
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  _resetState() {
    this.isConnected = false;
    this.isConnecting = false;
    this.isHandshakeComplete = false;
  }

  // 4. CLEANUP HOOKS: Temiz ve kayıpsız imha
  destroy() {
    console.log(`[WS System] 🧹 ${this.namespace} bağlantısı imha ediliyor...`);
    
    // Zamanlayıcıları temizle
    clearTimeout(this.reconnectTimer);
    
    if (this.ws) {
      // Yeniden bağlanmayı tetiklememek için event listener'ları temizle
      this.ws.onclose = null; 
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }

    this._resetState();
    
    // Singleton deposundan kendini sil
    delete WebSocketManager.instances[this.namespace];
    console.log(`[WS System] 🗑️ ${this.namespace} başarıyla temizlendi.`);
  }

  // Dışarıdan veri göndermek için güvenli metod
  send(data) {
    if (this.isConnected && this.isHandshakeComplete) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn(`[WS Guard] Bağlantı veya Handshake hazır değil. Veri gönderilemedi.`);
    }
  }
}

export default WebSocketManager;
