/**
 * Sovereign V21 - The Ghost Concierge
 * Davranışsal Durum Hafızası ve Zarif Çıkış Niyeti (Exit Intent)
 */
class GhostConcierge {
  constructor() {
    // 0. Sovereign Kalkanı: Gateway (Kök dizin) sayfasında css yüklü olmadığı için çalışmasını engelle (Çirkin görünümü önleme)
    const path = window.location.pathname;
    if (path === '/' || path.toLowerCase() === '/index.html') return;

    // 1. Lüks Kuralı: Misafiri asla darlama. Oturum (session) başına sadece 1 kez görünür.
    if (sessionStorage.getItem('santis_ghost_awoken') === 'true') return;
    
    // 2. Hedef Kitle: Yalnızca fare kullanan cihazlarda (Masaüstü) Y-ekseni takibi yapılabilir
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    this.initSensor();
    this.initAutoTracker();
  }

  initAutoTracker() {
    // URL tabanlı sessiz niyet algılayıcısı
    const path = window.location.pathname;
    let intentType = 'default';
    
    if (path.includes('/hamam')) intentType = 'hamam';
    else if (path.includes('/masaj')) intentType = 'masaj';
    else if (path.includes('/cilt')) intentType = 'cilt';
    else if (path.includes('/rituel')) intentType = 'rituel';

    if (intentType !== 'default') {
        // Ziyaretçi sayfada 3 saniye geçirirse "Niyet Mühürlenir"
        setTimeout(() => {
            const h1 = document.querySelector('h1');
            const serviceName = h1 ? h1.innerText.trim() : document.title.split('-')[0].trim();
            GhostConcierge.recordInterest(intentType, serviceName, window.location.href);
            console.log(`%c[Ghost Concierge] Niyet Mühürlendi: ${intentType} -> ${serviceName}`, 'color: #8b5cf6; font-style: italic;');
        }, 3000);
    }
  }

  initSensor() {
    this.exitListener = this.handleExitIntent.bind(this);
    // Fare tarayıcı penceresinin dışına çıktığında dinle
    document.addEventListener('mouseleave', this.exitListener);
  }

  handleExitIntent(e) {
    // İmleç tarayıcının ÜST sınırından (sekme kapatma/URL çubuğu yönüne) agresifçe çıkarsa
    if (e.clientY <= 10) {
      this.awakenGhost();
    }
  }

  awakenGhost() {
    // Hayaleti mühürle (Bir daha çıkmasın)
    sessionStorage.setItem('santis_ghost_awoken', 'true');
    document.removeEventListener('mouseleave', this.exitListener);

    // 3. Hafıza Kontrolü: Ziyaretçi en son neye bakmıştı?
    const rawMemory = localStorage.getItem('santis_memory_state');
    const memory = rawMemory ? JSON.parse(rawMemory) : null;
    
    let intentType = 'default';
    let serviceName = "Santis'in eşsiz arınma ritüelleri";
    let actionUrl = "/tr/rezervasyon/index.html";

    if (memory) {
        if (memory.lastViewed) serviceName = memory.lastViewed;
        if (memory.url) actionUrl = memory.url;
        if (memory.intentType) intentType = memory.intentType;
    }

    // 4. Lüks Arayüzü Tetikle
    this.renderLuxuriousModal(intentType, serviceName, actionUrl);
  }

  // Sayfalarda kullanıcının ilgisini kaydetmek için kullanılacak statik metod
  static recordInterest(intentType, serviceNameOrObj, url) {
    let iType = intentType || 'default';
    let sName = serviceNameOrObj || "Özel Rezervasyon";
    let sUrl = url || "/tr/rezervasyon/index.html";
    
    // Fallback if the first argument was omitted and an object was passed
    if (typeof intentType === 'object') {
        const obj = intentType;
        iType = obj.intentType || 'default';
        sName = obj.page || obj.intent || obj.lastViewed || "Özel Rezervasyon";
        sUrl = obj.url || "/tr/rezervasyon/index.html";
    }
    
    const state = { intentType: iType, lastViewed: sName, url: sUrl, timestamp: Date.now() };
    localStorage.setItem('santis_memory_state', JSON.stringify(state));
  }

  renderLuxuriousModal(intentType, serviceName, actionUrl) {
    // Senaryolar Stratejisi (Phase 16)
    const scenarios = {
      'hamam': {
        title: "Arınma Zamanı...",
        message: `Geleneksel Türk Hamamı'nın sıcak mermerleri ve eşsiz köpük terapisiyle ruhunuzu arındırmak için <strong>${serviceName}</strong> özel paketimize göz atmak ister misiniz?`,
        btn: "Hamam Rezervasyonu"
      },
      'masaj': {
        title: "Derin Bir Rahatlama...",
        message: `Bedeninizdeki tüm stresi ve yorgunluğu atacağınız <strong>${serviceName}</strong> için son müsaitliklerimizi inceleyin.`,
        btn: "Masaj Önceliği Al"
      },
      'cilt': {
        title: "Işıldayan Bir Cilt...",
        message: `Kendinize bir iyilik yapın. Sothys ürünleriyle uygulanan <strong>${serviceName}</strong> seanslarımızı keşfedin.`,
        btn: "Cilt Bakımına Göz At"
      },
      'default': {
        title: "Unutulmaz Bir Deneyim Sizi Bekliyor.",
        message: `Ruhunuzu ve bedeninizi dinlendirecek <strong>${serviceName}</strong> için size özel ayrılmış zaman dilimlerini görmek ister misiniz?`,
        btn: "Önceliğimi Kullan"
      }
    };

    const scenario = scenarios[intentType] || scenarios['default'];

    // Native HTML5 Dialog Mimarisi (Erişilebilirlik ve arka plan kilidi için kusursuzdur)
    const dialogHTML = `
      <dialog id="sovereign-ghost-dialog" class="ghost-concierge-modal">
        <div class="ghost-content">
          <button class="ghost-close" onclick="this.closest('dialog').close()" aria-label="Kapat">✕</button>
          <span class="ghost-eyebrow">Ayrılmadan Önce...</span>
          <h3 class="ghost-title">${scenario.title}</h3>
          <p class="ghost-message">${scenario.message}</p>
          <div class="ghost-actions">
            <a href="${actionUrl}" class="ghost-btn-primary">${scenario.btn}</a>
          </div>
        </div>
      </dialog>
    `;

    document.body.insertAdjacentHTML('beforeend', dialogHTML);
    const dialog = document.getElementById('sovereign-ghost-dialog');
    
    // DOM'a eklendikten sonra göster ve animasyonu tetikle
    dialog.showModal();
    
    requestAnimationFrame(() => {
      dialog.classList.add('is-visible');
    });

    // Kapatıldığında DOM'dan temizle
    dialog.addEventListener('close', () => {
        dialog.classList.remove('is-visible');
        setTimeout(() => dialog.remove(), 600);
    });
  }
}

// Sistemi aktifleştir (Dinamik yüklendiğini varsayar)
const initGhost = () => {
    window.GhostConcierge = GhostConcierge;
    new GhostConcierge();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGhost);
} else {
  initGhost();
}
