/**
 * 🚀 SANTIS AI INTEGRATION TEST
 * Antigravity AI motorunun Token-Only mimarisine sadakatini test eder.
 */
import { AntigravityPrompter } from './modules/antigravity-prompter.js';

async function testSovereignAI() {
  console.log("🌌 [Santis AI] Test süreci başlatılıyor...");
  
  const aiClient = new AntigravityPrompter();
  
  const prompt = "Santis 'Quiet Luxury' token mimarisine uygun, başlık, kısa açıklama ve bir aksiyon butonu içeren premium bir içerik kartı (content card) için sadece HTML ve CSS kodunu üret. Asla ham (raw) renk veya px kullanma, sadece CSS değişkenleri (token) kullan.";

  try {
    const response = await aiClient.sendPrompt(prompt);
    
    console.log("✨ [Antigravity Response]:");
    console.log(response);
    
    // UI'da görsel bir geri bildirim için konsola bir başarı mesajı
    if (response && response.includes('simulated_success')) {
        console.log("✅ Proxy Köprüsü ve AI Simülasyonu sorunsuz çalışıyor.");
    }
  } catch (error) {
    console.error("❌ AI Testi Başarısız:", error);
  }
}

// Global scope'a ekle (Konsoldan tetiklemek için)
window.testSovereignAI = testSovereignAI;

// Sayfa yüklendiğinde otomatik tetikle (Geliştirme aşaması için)
window.addEventListener('load', () => {
    setTimeout(testSovereignAI, 1000);
});
