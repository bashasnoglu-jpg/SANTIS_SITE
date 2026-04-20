// santis-worker-bridge.js

export class SovereignWorkerBridge {
  constructor() {
    // Worker'ı başlat (Yol projene göre değişebilir)
    this.worker = new Worker('/assets/js/core/workers/santis-image-worker.js');
    this.jobCounter = 0;
    this.callbacks = new Map(); // Devam eden işleri takip etmek için

    // Worker'dan gelen cevapları dinle
    this.worker.onmessage = (event) => {
      const { status, jobId, payload, error } = event.data;
      const callback = this.callbacks.get(jobId);

      if (callback) {
        if (status === 'SUCCESS') {
          callback.resolve(payload);
        } else {
          callback.reject(new Error(error));
        }
        // İş bitti, bellekten sil
        this.callbacks.delete(jobId);
      }
    };
  }

  /**
   * Görseli arka planda sıkıştırır.
   * @param {File} file - Orijinal dosya
   * @param {Object} options - { maxWidth, quality, type }
   * @returns {Promise<Object>} - Sıkıştırılmış blob ve metrikler
   */
  compressImage(file, options = {}) {
    return new Promise((resolve, reject) => {
      const jobId = `job_${this.jobCounter++}`;
      
      // İşlem sonucunu bekleyecek resolve/reject fonksiyonlarını Map'e kaydet
      this.callbacks.set(jobId, { resolve, reject });

      // Worker'a işi ve veriyi yolla
      this.worker.postMessage({ file, options, jobId });
    });
  }

  // Sistemi kapatırken Worker'ı öldürmek için (Clean-up)
  terminate() {
    this.worker.terminate();
  }
}

// Projede tek bir örnek (Singleton) kullanmak performansı artırır
export const imageWorkerProxy = new SovereignWorkerBridge();
