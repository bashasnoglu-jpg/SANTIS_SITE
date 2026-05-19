/**
 * 🎭 SANTIS REVEAL ENGINE v1.0
 * 'Sessiz Lüks' (Quiet Luxury) prensibiyle çalışan sinematik süzülüş motoru.
 * transform + opacity tabanlı, yüksek performanslı ve erişilebilir.
 */
class SantisRevealEngine {
  constructor() {
    this.revealSelector = '.sovereign-reveal-item';
    this.observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    };
    
    this.init();
  }

  init() {
    // 1. Reduced Motion Kontrolü
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      console.log('🔇 [Reveal Engine]: Reduced motion active. Skipping animations.');
      return;
    }

    // 2. Observer Kurulumu
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          // Bir kez tetiklendikten sonra gözlemlemeyi bırak (Performans)
          this.observer.unobserve(entry.target);
        }
      });
    }, this.observerOptions);

    // 3. Mevcut öğeleri topla ve gözlemle
    this.revealAll();

    // 4. Dinamik içerikler için MutationObserver (Gerekirse)
    this.watchForNewItems();
  }

  revealAll() {
    const items = document.querySelectorAll(this.revealSelector);
    items.forEach(item => {
      // Eğer öğe zaten ekrandaysa (above the fold), hemen veya kısa bir gecikmeyle tetikle
      if (this.isAboveFold(item)) {
        setTimeout(() => {
          item.classList.add('is-revealed');
        }, 100);
      } else {
        this.observer.observe(item);
      }
    });
  }

  isAboveFold(element) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight;
  }

  watchForNewItems() {
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // ELEMENT_NODE
            if (node.matches(this.revealSelector)) {
              this.observer.observe(node);
            }
            node.querySelectorAll(this.revealSelector).forEach(child => {
              this.observer.observe(child);
            });
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }
}

// Global başlatma
window.SantisReveal = new SantisRevealEngine();
