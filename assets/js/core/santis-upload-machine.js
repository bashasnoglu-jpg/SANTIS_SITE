// Olası tüm durumları dondurulmuş bir obje olarak tanımlıyoruz (Değiştirilemez)
export const UPLOAD_STATES = Object.freeze({
  IDLE: 'IDLE',
  VALIDATING: 'VALIDATING', // Magic bytes kontrolü
  REQUESTING_UPLOAD: 'REQUESTING_UPLOAD', // Presigned URL veya izin bekleme
  UPLOADING: 'UPLOADING', // Veri aktarımı
  PROCESSING: 'PROCESSING', // Sunucuda işlenme
  STREAM_CONNECTED: 'STREAM_CONNECTED', // SSE aktif
  COMPLETED: 'COMPLETED', // Başarılı son
  RETRYING: 'RETRYING', // Ağ koptu, tekrar deneniyor
  ERROR: 'ERROR', // Kalıcı hata
  QUARANTINED: 'QUARANTINED' // Güvenlik ihlali (Sahte dosya)
});

export class SovereignStateMachine {
  constructor(options = {}) {
    this.state = UPLOAD_STATES.IDLE;
    
    // Konfigürasyon Ayarları
    this.maxRetries = options.maxRetries || 5;
    this.timeoutMs = options.timeoutMs || 30000; // 30 saniye
    
    // İç Durum Takipçileri
    this.retryCount = 0;
    this.timeoutTimer = null;
    this.listeners = []; // UI'ı güncellemek için dinleyiciler
  }

  // UI bileşenlerinin durum değişikliklerini dinlemesi için metod
  onChange(callback) {
    this.listeners.push(callback);
    // İlk kayıt anında mevcut durumu da gönder
    callback(this.state, { retryCount: this.retryCount, maxRetries: this.maxRetries }); 
  }

  // Durum geçişlerini merkezi olarak yöneten ana fonksiyon
  transitionTo(newState, payload = {}) {
    if (!Object.values(UPLOAD_STATES).includes(newState)) {
      console.warn(`[State Machine] Geçersiz durum: ${newState}`);
      return;
    }

    // Aynı duruma tekrar geçmeyi engelle
    if (this.state === newState) return;

    this.state = newState;
    console.log(`[Command Center State] -> ${newState}`);

    // Yeni duruma göre zaman aşımı (timeout) kuralları işlet
    this._handleTimeouts(newState);

    // Dinleyicilere (UI) haber ver
    this.listeners.forEach(listener => listener(this.state, { 
      retryCount: this.retryCount, 
      maxRetries: this.maxRetries,
      ...payload 
    }));
  }

  // Belirli durumlarda (Upload veya Process) 30s takılmayı önleyen mantık
  _handleTimeouts(newState) {
    // Önceki timer'ı temizle
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    // Sadece bekleme gerektiren durumlarda timer başlat
    const statesNeedingTimeout = [
      UPLOAD_STATES.UPLOADING, 
      UPLOAD_STATES.PROCESSING, 
      UPLOAD_STATES.REQUESTING_UPLOAD
    ];

    if (statesNeedingTimeout.includes(newState)) {
      this.timeoutTimer = setTimeout(() => {
        console.error(`[Command Center] Timeout ulaşıldı: ${newState}`);
        this.handleNetworkFailure('Timeout: Sunucudan yanıt alınamadı.');
      }, this.timeoutMs);
    }
  }

  // Ağ kopması veya Timeout durumunda çalışacak Exponential Backoff mantığı
  handleNetworkFailure(reason) {
    if (this.retryCount >= this.maxRetries) {
      this.transitionTo(UPLOAD_STATES.ERROR, { message: `Maksimum deneme sayısına ulaşıldı. (${reason})` });
      return;
    }

    this.retryCount++;
    this.transitionTo(UPLOAD_STATES.RETRYING, { message: `Bağlantı koptu. Tekrar deneniyor... (${reason})` });

    // Exponential Backoff: 1s, 2s, 4s, 8s...
    const backoffTime = Math.pow(2, this.retryCount - 1) * 1000;
    
    setTimeout(() => {
      // Yeniden bağlanma simülasyonu tetiklemesi
      console.log(`[Command Center] ${backoffTime}ms sonra yeniden bağlanılıyor... (Deneme ${this.retryCount}/${this.maxRetries})`);
      this.reconnectSSE();
    }, backoffTime);
  }

  // SSE Yeniden bağlanma simülasyonu
  reconnectSSE() {
    // Dışarıdan enjekte edilebilir veya override edilebilir. 
    // Örn: this.transitionTo(UPLOAD_STATES.STREAM_CONNECTED);
  }

  // Kasıtlı iptal
  cancelIntentional() {
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    this.transitionTo(UPLOAD_STATES.IDLE, { message: 'İşlem kullanıcı tarafından iptal edildi.' });
    this.retryCount = 0;
  }
}
