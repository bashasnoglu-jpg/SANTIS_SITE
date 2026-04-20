// system/santis-dom-forge.js
// SDCR V61.0 - SOVEREIGN DOM SYNTHESIZER (No-innerHTML Architecture)

export class DOMForge {
  /**
   * Güvenli DOM Klonlama ve Hidrasyon Motoru
   * @param {string} templateId - HTML'deki <template> etiketinin ID'si (Örn: 'tpl-boardroom')
   * @param {HTMLElement|string} targetNodeOrId - İçeriğin basılacağı hedef DOM elemanı veya eleman ID'si
   */
  static mount(templateId, targetNodeOrId) {
    const template = document.getElementById(templateId);
    
    // Resolve target
    const targetNode = typeof targetNodeOrId === 'string' 
        ? document.getElementById(targetNodeOrId) 
        : targetNodeOrId;
    
    if (!template) {
      console.error(`🩸 [DOM FORGE] Doku Reddi: '${templateId}' şablonu bulunamadı.`);
      return null;
    }
    
    if (!targetNode) {
        console.error(`🩸 [DOM FORGE] Hedef Yok: Mount edilecek hedef node bulunamadı.`);
        return null;
    }

    // 1. Şablonu Klonla (HTML Parser'ı yormadan saf DOM kopyası çıkarır, 0.00ms hedefine uyar)
    const clone = template.content.cloneNode(true);

    // 2. Korumasız Fonksiyon Kalkanı (Rapor: Missing Functions Cleanup)
    // Eğer buton onClick="exportBookingsCSV()" arıyorsa ama o modül o an Kovan'da yüklü değilse çökmesini engelle.
    const buttons = clone.querySelectorAll('[onclick]');
    buttons.forEach(btn => {
      // "exportBookingsCSV()" stringinden fonksiyon adını ayıkla
      const onclickAttr = btn.getAttribute('onclick');
      if (onclickAttr) {
        const fnMatch = onclickAttr.match(/^([a-zA-Z0-9_$]+)/);
        if (fnMatch) {
          const fnName = fnMatch[1];
          // Check global window scope
          if (typeof window[fnName] !== 'function') {
            // Boşluğa düşen fonksiyonu, sistemi çökertmeyen bir 'Kara Delik' (Blackhole) ile yamala
            console.warn(`🛡️ [UI GUARD] ${fnName} DOM Forge esnasında bulunamadı. Blackhole'a (() => {}) sarılıyor.`);
            window[fnName] = () => {
              console.warn(`🛡️ [UI GUARD] Modül henüz aktif değil. '${fnName}' işlemi yutuldu.`);
            };
          }
        }
      }
    });

    // 3. Güvenli Enjeksiyon (innerHTML çöpe atıldı)
    // replaceChildren methodu DOM'un eski çocuklarını söküp atarken, memory leak oluşumunu azaltır
    targetNode.replaceChildren(clone);
    
    console.log(`🧬 [DOM FORGE] '${templateId}' başarıyla sentezlendi ve hedefe bağlandı.`);
    
    // Mount edilen canlı DOM segmentini geri döndür ki üzerinde querySelector vs. yapılabilsin
    return targetNode;
  }
}
