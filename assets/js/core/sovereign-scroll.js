/**
 * SANTIS SOVEREIGN V23 - Quantum Bridge Scroll Engine
 * Provides absolutely 0ms TBT smooth scrolling and injects CSS variables for Parallax/Skew.
 */
class SovereignScroll {
  constructor() {
    this.container = document.querySelector('#santis-main');
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

    // V23 FIX: Dynamically track container height for lazy-loaded images and injected footers
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        this.setBodyHeight();
      });
      ro.observe(this.container);
    }

    this.render();
  }

  setBodyHeight() {
    if (this.container) {
      document.body.style.height = `${this.container.getBoundingClientRect().height}px`;
    }
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
