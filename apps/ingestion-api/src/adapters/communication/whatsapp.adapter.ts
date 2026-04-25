export interface WhatsAppTemplatePayload {
  targetPhoneNumber: string; // Örn: "905320000000"
  templateName: string;      // Meta Panelinde onaylanan şablon adı (örn: "sovereign_handover")
  languageCode?: string;     // Varsayılan: "tr"
  variables?: string[];      // Şablondaki {{1}}, {{2}} gibi değişkenleri dolduracak veriler
}

export class WhatsAppAdapter {
  private readonly apiUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor() {
    // Sovereign OS Çevresel Değişkenleri (Environment Variables)
    this.accessToken = process.env.META_WA_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID || '';
    
    // Meta Graph API v18.0 (veya güncel sürüm) doğrudan bağlantı noktası
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }

  /**
   * Kriptografik mührü ve elçi mesajını hedefe fısıldar.
   */
  async sendNeuralWhisper(payload: WhatsAppTemplatePayload): Promise<boolean> {
    // Güvenlik kalkanı: Token yoksa (örn: Local ortam), sessizce simüle et.
    if (!this.accessToken || !this.phoneNumberId) {
      console.warn(`[SOVEREIGN KONSOL] Meta Token bulunamadı. Fısıltı simüle ediliyor -> Numara: ${payload.targetPhoneNumber}`);
      return true;
    }

    try {
      const requestBody = {
        messaging_product: "whatsapp",
        to: payload.targetPhoneNumber,
        type: "template",
        template: {
          name: payload.templateName,
          language: { code: payload.languageCode || "tr" },
          // Eğer şablonda dinamik değişkenler varsa, Meta'nın katı formatına göre diz
          components: payload.variables && payload.variables.length > 0 ? [
            {
              type: "body",
              parameters: payload.variables.map(variable => ({
                type: "text",
                text: variable
              }))
            }
          ] : []
        }
      }

      // Saf ve doğrudan temas: Aracı SDK yok.
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[SOVEREIGN ZIRHI] Meta Graph API Reddi:', JSON.stringify(errorData, null, 2));
        throw new Error('Nöral Fısıltı hedefe iletilemedi.');
      }

      console.log(`[SOVEREIGN OS] Nöral Fısıltı başarıyla iletildi. Hedef: ${payload.targetPhoneNumber}`);
      return true;

    } catch (error) {
      console.error('[SOVEREIGN ZIRHI] WhatsApp İletişim Zırhı hasar gördü:', error);
      return false;
    }
  }
}
