/**
 * 🛡️ LAYER 1: SANTIS DOM GUARDIAN
 * HTML Parser Integrity & Strict Head Enforcer
 */
class SantisDOMGuardian {
  static enforce() {
    const ALLOWED_IN_HEAD = new Set(['TITLE', 'META', 'LINK', 'STYLE', 'SCRIPT', 'BASE', 'NOSCRIPT', 'TEMPLATE']);
    
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          // Eğer eklenen Node bir elementse ve Head içindeyse
          if (node.nodeType === 1 && node.parentNode === document.head) {
            if (!ALLOWED_IN_HEAD.has(node.tagName.toUpperCase())) {
              console.error(`🚨 [DOM GUARDIAN] İhlal Tespit Edildi: <head> içine <${node.tagName}> sızdı.`);
              // Parser'ın Body'e atlamasını (Insertion Mode Transition) engellemek için anında imha!
              node.remove(); 
              // Alternatif: document.body hazırsa document.body.prepend(node); ile sürgün et.
            }
          }
        }
      }
    });

    if (document.head) {
        observer.observe(document.head, { childList: true });
        console.log("🛡️ [Santis OS] <head> mühürlendi. Strict Parsing Mode devrede.");
    }
  }
}
SantisDOMGuardian.enforce();
