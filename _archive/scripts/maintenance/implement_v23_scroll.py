import os
from pathlib import Path
import re

ROOT_DIR = Path(r"C:\Users\tourg\Desktop\SANTIS_SITE")

# 1. Create sovereign-scroll.js
JS_CONTENT = """/**
 * SANTIS SOVEREIGN V23 - Quantum Bridge Scroll Engine
 * Provides absolutely 0ms TBT smooth scrolling and injects CSS variables for Parallax/Skew.
 */
class SovereignScroll {
  constructor() {
    this.container = document.querySelector('#nv-main');
    if (!this.container) return;
    
    this.currentY = 0;
    this.targetY = 0;
    this.ease = 0.08;
    
    this.init();
  }

  init() {
    this.setBodyHeight();
    
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      willChange: 'transform'
    });

    window.addEventListener('scroll', () => {
      this.targetY = window.scrollY;
    }, { passive: true });

    window.addEventListener('resize', () => {
      this.setBodyHeight();
    });

    this.render();
  }

  setBodyHeight() {
    document.body.style.height = `${this.container.getBoundingClientRect().height}px`;
  }

  render() {
    // 1. Kinetik İvme (Velocity): Kullanıcının o anki kaydırma şiddeti ve yönü
    const velocity = this.targetY - this.currentY;

    // 2. LERP Matematiği
    this.currentY += velocity * this.ease;

    // 3. Alt-piksel sabitleme (Titremeleri önler)
    if (Math.abs(velocity) < 0.05) {
      this.currentY = this.targetY;
    }

    // --- SİHİRLİ DOKUNUŞ: Kuantum Köprüsü (V23) ---
    document.documentElement.style.setProperty('--scroll-y', this.currentY.toFixed(2));
    document.documentElement.style.setProperty('--scroll-velocity', velocity.toFixed(2));
    // ----------------------------------------------

    // 4. Kapsayıcıyı fiziksel olarak kaydır (V22 - GPU Üzerinde 0ms TBT)
    this.container.style.transform = `translate3d(0, -${this.currentY.toFixed(2)}px, 0)`;

    // 5. Monitörün yenileme hızına göre döngüyü sürdür
    requestAnimationFrame(this.render.bind(this));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.innerWidth >= 1024) {
    window.sovereignKinetics = new SovereignScroll();
  } else {
    // Mobile fallback CSS CSS Variables only
    let currentY = 0;
    const renderMobile = () => {
      const targetY = window.scrollY;
      const velocity = targetY - currentY;
      currentY += velocity * 0.1;
      document.documentElement.style.setProperty('--scroll-y', currentY.toFixed(2));
      document.documentElement.style.setProperty('--scroll-velocity', velocity.toFixed(2));
      requestAnimationFrame(renderMobile);
    }
    renderMobile();
  }
});
"""

js_path = ROOT_DIR / "assets" / "js" / "core" / "sovereign-scroll.js"
os.makedirs(js_path.parent, exist_ok=True)
with open(js_path, "w", encoding="utf-8") as f:
    f.write(JS_CONTENT)
print("Created sovereign-scroll.js")

# 2. Update assets/css/style.css
CSS_ADDITION = """
/* --- Sovereign V23: Kinetik İllüzyon Motoru --- */

/* 1. Sonsuz Derinlik (Paralaks): Hero Görselleri ve Arka Planlar İçin */
.hero-image,
.parallax-bg {
  /* Sayfa kayarken, görsel kendi çerçevesi içinde zıt yönde (%15 oranında) daha yavaş kayar. 
     Derinlik hissi verir. Bu işlem sadece ekran kartında (GPU) yapılır! */
  transform: translate3d(0, calc(var(--scroll-y, 0) * 0.15px), 0) scale(1.15);
  will-change: transform;
  transform-origin: center;
}

/* 2. Sıvı İvme (Liquid Momentum): Matrix ve Blog Kartları İçin */
.matrix-card,
.santis-blog-card,
.nv-signature-card,
.nv-trend-card,
.santis-card {
  /* Kullanıcı sayfayı agresif kaydırdığında ivme (--scroll-velocity) artar, 
     kartlar rüzgar yemiş masif bir kumaş gibi çok hafifçe esner (skew).
     0.03deg hassas bir 'Quiet Luxury' katsayısıdır, abartıdan kaçınır. */
  transform: skewY(calc(var(--scroll-velocity, 0) * 0.03deg));
  will-change: transform;
  
  /* Kaydırma durduğunda kartların lüks bir süspansiyonla jilet gibi 0 dereceye (düz) dönmesi: */
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

/* 3. Dinamik Cam Yansıması (Opsiyonel: Yapışkan Header İçin) */
.santis-header.is-sticky,
#site-header.is-sticky {
  /* Hızlı kaydırmalarda header'ın arka plan bulanıklığı (blur) dinamik olarak artar */
  backdrop-filter: blur(calc(10px + Math.abs(var(--scroll-velocity, 0)) * 0.1px));
}
"""
css_path = ROOT_DIR / "assets" / "css" / "style.css"
with open(css_path, "a", encoding="utf-8") as f:
    f.write(CSS_ADDITION)
print("Appended V23 CSS rules to style.css")

# 3. Inject scripts into HTML
TARGETS = [
    ROOT_DIR / "tr" / "index.html",
    ROOT_DIR / "tr" / "hamam" / "santis-pasa.html"
]

for t in TARGETS:
    if not t.exists():
        continue
    with open(t, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Inject sovereign-scroll.js if not already there
    if "sovereign-scroll.js" not in content:
        # Prepend to core scripts section
        if "<!-- CORE SCRIPTS -->" in content:
            content = content.replace(
                "<!-- CORE SCRIPTS -->", 
                "<!-- CORE SCRIPTS -->\n<script src=\"/assets/js/core/sovereign-scroll.js\" defer></script>"
            )
        else:
            # before app.js fallback
            content = content.replace(
                '<script src="/assets/js/app.js"',
                '<script src="/assets/js/core/sovereign-scroll.js" defer></script>\n<script src="/assets/js/app.js"'
            )
        with open(t, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Injected sovereign-scroll.js in {t.name}")
