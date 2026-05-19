/**
 * 🌌 ANTIGRAVITY PROMPTER
 * Antigravity AI Çalışma Ortamı ile iletişim kuran istemci modülü.
 * Port 46696 (veya Proxy üzerinden 3030) üzerinden Santis standartlarında yapılandırılmış prompt gönderir.
 */
export class AntigravityPrompter {
    constructor() {
      // Artık istekler doğrudan AI motoruna değil, Truth Layer Proxy'sine gidiyor
      const config = window.getRuntimeConfig ? window.getRuntimeConfig() : { apiBaseUrl: '/api/v1' };
      const baseUrl = config.apiBaseUrl.replace('/v1', '');
      this.aiEndpoint = `${baseUrl}/antigravity/proxy`;
      
      this.systemPrompt = `
        Sen "Antigravity" AI çalışma ortamısın.
        Kurallar:
        1. Sadece temiz, modüler ve belgelenmiş kod üret.
        2. Tüm CSS ve görsel kararlarda "Sovereign Visual" Token mimarisini kullan. Ham (raw) değerler kullanma.
        3. Yazdığın kodları her zaman adım adım açıklayıcı yorum satırlarıyla (inline documentation) destekle.
        4. "Quiet Luxury" estetiğini (smoky warm gray, low saturation) koru.
      `;
    }
  
    /**
     * AI motoruna yeni bir prompt/görev gönderir.
     */
    async sendPrompt(userTask) {
      try {
        console.log('🌌 Antigravity motoruna (Proxy üzerinden) prompt gönderiliyor...');
  
        const response = await fetch(this.aiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            system: this.systemPrompt,
            prompt: userTask,
            temperature: 0.2 
          })
        });
  
        if (!response.ok) {
           throw new Error(`Antigravity bağlantısı sağlanamadı. Durum: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('✅ Antigravity Yanıtı alındı.');
        return data.result || data.response; // API yanıt yapısına göre esneklik
  
      } catch (error) {
        console.error('⚠️ Antigravity İletişim Hatası:', error);
        return null;
      }
    }
  }
