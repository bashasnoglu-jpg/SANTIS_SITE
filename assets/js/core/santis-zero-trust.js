// İzin verilen dosya imzalarının Hexadecimal karşılıkları
const ALLOWED_SIGNATURES = {
  '89504e47': 'image/png',
  'ffd8ffe0': 'image/jpeg',
  'ffd8ffe1': 'image/jpeg', // Farklı JPEG formatları (EXIF vb.)
  'ffd8ffe2': 'image/jpeg',
  'ffd8ffe3': 'image/jpeg',
  'ffd8ffe8': 'image/jpeg',
  '25504446': 'application/pdf',
  '504b0304': 'application/zip', // ZIP (Genellikle DOCX, XLSX gibi formatlar da aslında ZIP'tir)
};

export class ZeroTrustGate {
  /**
   * Dosyanın Magic Byte imzasını okur ve doğrular.
   * @param {File} file - Yüklenecek dosya nesnesi
   * @returns {Promise<Object>} - Doğrulama sonucu { isValid: boolean, type: string | null }
   */
  static async inspect(file) {
    return new Promise((resolve) => {
      // FileReader ile dosyanın sadece ilk 4 baytlık (0-4 arası) dilimini okuyoruz
      const blob = file.slice(0, 4);
      const reader = new FileReader();

      reader.onloadend = (event) => {
        if (event.target.readyState === FileReader.DONE) {
          // Gelen veriyi 8-bitlik işaretsiz tam sayı dizisine çevir
          const uint8Array = new Uint8Array(event.target.result);
          
          // Her bir baytı Hexadecimal formata dönüştür ve birleştir
          let headerHex = "";
          for (let i = 0; i < uint8Array.length; i++) {
            headerHex += uint8Array[i].toString(16).padStart(2, '0');
          }

          console.log(`[Zero-Trust Gate] File DNA (Hex): ${headerHex}`);

          // İmza güvenli listemizde var mı?
          if (ALLOWED_SIGNATURES[headerHex]) {
            resolve({ isValid: true, realType: ALLOWED_SIGNATURES[headerHex] });
          } else {
            resolve({ isValid: false, realType: 'UNKNOWN_OR_MALICIOUS' });
          }
        }
      };

      // Okuma sırasında hata olursa direkt reddet
      reader.onerror = () => {
        resolve({ isValid: false, realType: 'READ_ERROR' });
      };

      // ArrayBuffer olarak okumayı başlat
      reader.readAsArrayBuffer(blob);
    });
  }
}
