import os
import re
from pathlib import Path

ROOT_DIR = Path(r"C:\Users\tourg\Desktop\SANTIS_SITE")

# 1. ghost-concierge.js
JS_CONTENT = """/**
 * Sovereign V21 - The Ghost Concierge
 * Davranışsal Durum Hafızası ve Zarif Çıkış Niyeti (Exit Intent)
 */
class GhostConcierge {
  constructor() {
    // 1. Lüks Kuralı: Misafiri asla darlama. Oturum (session) başına sadece 1 kez görünür.
    if (sessionStorage.getItem('santis_ghost_awoken') === 'true') return;
    
    // 2. Hedef Kitle: Yalnızca fare kullanan cihazlarda (Masaüstü) Y-ekseni takibi yapılabilir
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    this.initSensor();
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
    
    let serviceName = "Santis'in eşsiz arınma ritüelleri";
    let actionUrl = "/tr/rezervasyon/index.html";

    if (memory && memory.lastViewed) {
        serviceName = memory.lastViewed;
        actionUrl = memory.url || actionUrl;
    }

    // 4. Lüks Arayüzü Tetikle
    this.renderLuxuriousModal(serviceName, actionUrl);
  }

  // Sayfalarda kullanıcının ilgisini kaydetmek için kullanılacak statik metod
  static recordInterest(serviceName, url) {
    const state = { lastViewed: serviceName, url: url, timestamp: Date.now() };
    localStorage.setItem('santis_memory_state', JSON.stringify(state));
  }

  renderLuxuriousModal(serviceName, actionUrl) {
    // Native HTML5 Dialog Mimarisi (Erişilebilirlik ve arka plan kilidi için kusursuzdur)
    const dialogHTML = `
      <dialog id="sovereign-ghost-dialog" class="ghost-concierge-modal">
        <div class="ghost-content">
          <button class="ghost-close" onclick="this.closest('dialog').close()" aria-label="Kapat">✕</button>
          <span class="ghost-eyebrow">Ayrılmadan Önce...</span>
          <h3 class="ghost-title">Unutulmaz Bir Deneyim Sizi Bekliyor.</h3>
          <p class="ghost-message">Ruhunuzu ve bedeninizi dinlendirecek <strong>${serviceName}</strong> için size özel ayrılmış zaman dilimlerini görmek ister misiniz?</p>
          <div class="ghost-actions">
            <a href="${actionUrl}" class="ghost-btn-primary">Önceliğimi Kullan</a>
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

// Sistemi aktifleştir
document.addEventListener('DOMContentLoaded', () => new GhostConcierge());
"""

js_path = ROOT_DIR / "assets" / "js" / "ghost-concierge.js"
with open(js_path, "w", encoding="utf-8") as f:
    f.write(JS_CONTENT)
print("Wrote ghost-concierge.js")

# 2. Add CSS to style.css
CSS_CONTENT = """
/* --- Sovereign V21: The Ghost Concierge --- */
.ghost-concierge-modal {
  border: none;
  background: transparent;
  padding: 0;
  max-width: 550px;
  width: 90%;
  margin: auto;
  overflow: visible;
}

/* Kuantum Sisi - Lüks Cam Efekti (Native ::backdrop) */
.ghost-concierge-modal::backdrop {
  background: rgba(26, 26, 26, 0.4);
  backdrop-filter: blur(0px);
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.ghost-concierge-modal.is-visible::backdrop {
  backdrop-filter: blur(12px); /* Ekranı lüks bir sis kaplar */
}

/* Panel Kinematiği */
.ghost-content {
  position: relative;
  background: #f4f3f1; /* "Quiet Luxury" bej zemini */
  padding: 4rem 3rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 30px 60px rgba(0,0,0,0.15);
  
  /* Derinlikten geliş animasyonu */
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.ghost-concierge-modal.is-visible .ghost-content {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Tipografi & Butonlar */
.ghost-eyebrow { font-size: 0.75rem; letter-spacing: 0.2em; color: #8b7a5e; display: block; margin-bottom: 1rem; text-transform: uppercase; }
.ghost-title { font-family: 'BrandQuietFont', serif; font-size: 1.8rem; color: #1a1a1a; margin-top: 0; margin-bottom: 1.5rem; line-height: 1.3;}
.ghost-message { color: #555; line-height: 1.6; margin-bottom: 2.5rem; font-size: 1rem; }

.ghost-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #1a1a1a;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}
.ghost-close:hover { opacity: 1; }

.ghost-actions { display: flex; justify-content: center; }
.ghost-btn-primary {
  background: #1a1a1a;
  color: #fff;
  padding: 1rem 2.5rem;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.3s ease;
}
.ghost-btn-primary:hover { background: #333; }
"""

css_path = ROOT_DIR / "assets" / "css" / "style.css"
with open(css_path, "r", encoding="utf-8") as f:
    existing_css = f.read()

if "Sovereign V21: The Ghost Concierge" not in existing_css:
    with open(css_path, "a", encoding="utf-8") as f:
        f.write(CSS_CONTENT)
    print("Appended CSS Ghost Concierge")

# 3. index.html Injection
index_path = ROOT_DIR / "tr" / "index.html"
with open(index_path, "r", encoding="utf-8") as f:
    idx_content = f.read()
if "ghost-concierge.js" not in idx_content:
    idx_content = idx_content.replace(
        "<!-- CORE SCRIPTS -->",
        "<!-- CORE SCRIPTS -->\n<script src=\"/assets/js/ghost-concierge.js\" defer></script>"
    )
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(idx_content)
    print("Injected into index.html")

# 4. derin-detoks Injection
detoks_path = ROOT_DIR / "tr" / "rituals" / "derin-detoks-paketi.html"
if detoks_path.exists():
    with open(detoks_path, "r", encoding="utf-8") as f:
        detoks_ct = f.read()
    if "GhostConcierge.recordInterest" not in detoks_ct:
        inj = """<script>
document.addEventListener('DOMContentLoaded', () => {
    if (typeof GhostConcierge !== 'undefined') {
        GhostConcierge.recordInterest("Derin Detoks Paketi", window.location.href);
    }
});
</script>
</body>"""
        detoks_ct = detoks_ct.replace("</body>", inj)
        # Check if ghost-concierge.js is loaded
        if "ghost-concierge.js" not in detoks_ct:
            detoks_ct = detoks_ct.replace("</body>", '<script src="/assets/js/ghost-concierge.js" defer></script>\n</body>')
        with open(detoks_path, "w", encoding="utf-8") as f:
            f.write(detoks_ct)
        print("Injected into derin detoks")
