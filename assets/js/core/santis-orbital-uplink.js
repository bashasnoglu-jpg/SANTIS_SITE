// santis-orbital-uplink.js

export class SovereignUplink {
  /**
   * 1. Sunucudan tek kullanımlık, süreli bir Presigned URL alır.
   * @param {Object} metadata - Dosyanın adı, boyutu, türü vb.
   * @returns {Promise<Object>} - { uploadUrl, fileId, publicUrl }
   */
  static async requestUploadTicket(metadata) {
    const response = await fetch('/api/v1/storage/request-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata)
    });

    if (!response.ok) throw new Error('Ticket reddedildi. Sunucu izni vermedi.');
    return response.json(); // Sunucunun döndürdüğü şifreli Presigned URL
  }

  /**
   * 2. Saf veriyi doğrudan Cloud Storage'a (S3/R2) fırlatır.
   * @param {Blob} blob - Sıkıştırılmış dosya verisi
   * @param {String} presignedUrl - S3/R2'den alınan güvenli URL
   * @param {Function} onProgress - Yüzdelik ilerlemeyi UI'a basmak için callback
   * @returns {Promise<void>}
   */
  static pushPayload(blob, presignedUrl, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('PUT', presignedUrl, true);
      
      // S3/R2'nin veriyi doğru tanıması için Content-Type zorunludur
      xhr.setRequestHeader('Content-Type', blob.type || 'image/jpeg');

      // Radara veri akışını bildir (UI Progress Bar için)
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Storage Provider reddetti. Status: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Ağ kopması yaşandı (Orbital Uplink koptu).'));
      
      // Veriyi doğrudan ikili (binary) formatta gönderiyoruz
      xhr.send(blob);
    });
  }

  /**
   * 3. Yükleme başarıyla tamamlandığında sunucuya "Kaydet" komutu gönderir.
   * @param {String} fileId - Başlangıçta alınan biletin ID'si
   */
  static async finalizeUpload(fileId) {
    const response = await fetch('/api/v1/storage/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId })
    });

    if (!response.ok) throw new Error('Finalize aşaması başarısız oldu.');
  }
}
