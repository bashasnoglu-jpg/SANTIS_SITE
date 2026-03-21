import re

file_path = 'c:\\Users\\tourg\\Desktop\\SANTIS_SITE\\assets\\js\\modules\\interaction-engine.js'

with open(file_path, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. First, we must remove the wrongly injected engine_code
# The engine_code starts with "// ==========================================\n// 🧬 SOVEREIGN MORPH ENGINE v2.0 (GOD-TIER FLIP)"
# And ends with "window.triggerSovereignReveal === 'function') window.triggerSovereignReveal(card);"

bad_injection_regex = r"// ==========================================\n// 🧬 SOVEREIGN MORPH ENGINE v2\.0 \(GOD-TIER FLIP\)[\s\S]+?window\.morphEngine = new SovereignMorphEngine\(\);\n\nwindow\.triggerSovereignReveal"

js = re.sub(bad_injection_regex, 'window.triggerSovereignReveal', js)

# Now, we inject it correctly!
# We find exactly:
# window.triggerSovereignReveal = function
correct_inject_point = r"window\.triggerSovereignReveal = function"
engine_code_fixed = """// ==========================================
// 🧬 SOVEREIGN MORPH ENGINE v2.0 (GOD-TIER FLIP)
// ==========================================
class SovereignMorphEngine {
  constructor() {
    this.activeAnimations = new Set();
    // Apple-vari fizik: Yay gibi gerilir, yumuşak oturur (Snappy but smooth)
    this.easing = 'cubic-bezier(0.32, 0.72, 0, 1)'; 
    this.duration = 600;
  }

  play(sourceCard, targetGhost) {
    // 1. Guard: Kullanıcı çılgın gibi aç/kapa yaparsa patlamaması için
    this.abort();

    const elements = sourceCard.querySelectorAll('[data-morph]');

    elements.forEach(sourceEl => {
      const key = sourceEl.dataset.morph;
      const targetEl = targetGhost.querySelector(`[data-morph="${key}"]`);
      if (!targetEl) return;

      // 2. İlk ve Son durum hesaplamaları (FIRST & LAST)
      const first = sourceEl.getBoundingClientRect();
      const last = targetEl.getBoundingClientRect();

      const dx = first.left - last.left;
      const dy = first.top - last.top;
      const dw = first.width / last.width;
      const dh = first.height / last.height;

      // 🚨 KRİTİK ZIRH 1: Matematik sapmasını önlemek için orijin sıfırlama
      targetEl.style.transformOrigin = 'top left';
      targetEl.style.willChange = 'transform, filter';

      // 🚨 KRİTİK ZIRH 2: Metin ezilmesini engelleme
      const isText = targetEl.tagName.match(/^H[1-6]$|^P$|^SPAN$|^A$/i);
      const isImage = targetEl.tagName.toLowerCase() === 'img';

      // Metinse scale yapma (1'de tut), boyut değişimi CSS font-size transition'ına kalsın
      const scaleX = isText ? 1 : dw;
      const scaleY = isText ? 1 : dh;

      // Cinematic Focus
      const startFilter = isImage ? 'blur(12px) brightness(1.2)' : 'none';

      const animation = targetEl.animate([
        {
          transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
          filter: startFilter
        },
        {
          transform: 'translate(0px, 0px) scale(1, 1)',
          filter: 'none'
        }
      ], {
        duration: this.duration,
        easing: this.easing,
        fill: 'both'
      });

      this.activeAnimations.add(animation);

      // 3. Memory Cleanup: Animasyon bitince GPU'yu rahatlat
      animation.onfinish = () => {
        targetEl.style.transformOrigin = '';
        targetEl.style.willChange = 'auto';
        this.activeAnimations.delete(animation);
      };
    });
  }

  abort() {
    this.activeAnimations.forEach(a => a.cancel());
    this.activeAnimations.clear();
  }
}

// Global kullanıma hazır
window.morphEngine = new SovereignMorphEngine();

window.triggerSovereignReveal = function"""

js = js.replace('window.triggerSovereignReveal = function', engine_code_fixed, 1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("Fixed interaction-engine.js")
