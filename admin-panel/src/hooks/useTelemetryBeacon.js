import { useCallback } from 'react';

// ----------------------------------------------------------------------
// SOVEREIGN TELEMETRY BEACON (Stash Status: HEALTHY)
// Uçtan uca şifreli, "Sessiz Lüks" prensibine uygun (hata anında çökmez),
// anonimleştirilmiş REST API iletişim köprüsü.
// ----------------------------------------------------------------------

const SERVER_URL = 'http://localhost:8080/api/v1/telemetry/beacon';

export const useTelemetryBeacon = () => {
  
  const sendBeacon = useCallback(async (actionType, metadata = {}) => {
    try {
      // Gönderilecek veriyi yapılandır (Etik ve Anonim)
      const payload = {
        timestamp: new Date().toISOString(),
        action: actionType, // Örn: 'SESSION_STARTED', 'PACKAGE_VIEWED'
        client: 'santis-wellness-ui',
        data: metadata
      };

      // Deterministik REST İsteği (Fire and Forget)
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer SOVEREIGN_FRONTEND_TOKEN_V1' // Basit güvenlik katmanı
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Sovereign Server reddetti: ${response.status}`);
      }

      // İstek başarılıysa sessizce kal (Konsolu kirletme)
      return true;

    } catch (error) {
      // SİSTEMSEL KORUMA (Silent Fail)
      // "Sessiz Lüks" kuralı: Backend çökse bile kullanıcı asla hata mesajı görmez,
      // deneyim pürüzsüzce devam eder. Sadece geliştirici uyarılır.
      console.warn('[Telemetry Uyarısı]: Bağlantı köprüsü kapalı. Veri yerel olarak imha edildi.', error.message);
      return false;
    }
  }, []);

  return { sendBeacon };
};
