import { io } from 'socket.io-client';

/**
 * SANTIS SOVEREIGN EVENT BUS
 * Merkezi Socket Orkestrasyon Katmanı.
 * Tüm misafir modülleri bu Singleton üzerinden haberleşir.
 * Sıfır Teknik Borç & Tekil Bağlantı Garantisi.
 */
class SovereignEventBus {
  constructor() {
    if (!SovereignEventBus.instance) {
      console.log('📡 [Sovereign Event Bus]: Merkezi sinir sistemi başlatılıyor...');
      
      // Merkezi socket bağlantısı (Singleton)
      const config = window.getRuntimeConfig ? window.getRuntimeConfig() : { apiBaseUrl: '/api/v1' };
      const socketUrl = config.apiBaseUrl.includes('http') ? new URL(config.apiBaseUrl).origin : '';
      
      this.socket = io(socketUrl, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.setupBaseListeners();
      SovereignEventBus.instance = this;
    }

    return SovereignEventBus.instance;
  }

  setupBaseListeners() {
    this.socket.on('connect', () => {
      console.log('✅ [Sovereign Link]: Merkezi hat aktif. ID:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ [Sovereign Link]: Bağlantı kesildi. Sebep:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚨 [Sovereign Link]: Bağlantı hatası:', error.message);
    });
  }

  /**
   * Global olay yayınlama (Internal & External)
   */
  emit(event, data) {
    this.socket.emit(event, data);
  }

  /**
   * Global olay dinleme
   */
  on(event, callback) {
    this.socket.on(event, callback);
  }

  /**
   * Dinleyici kaldırma
   */
  off(event, callback) {
    this.socket.off(event, callback);
  }
}

// Tekil örneği (Singleton) dışarı aktarıyoruz
export const santisEventBus = new SovereignEventBus();
