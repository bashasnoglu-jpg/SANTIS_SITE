/**
 * ==========================================
 * 🛡️ EXECUTION ARBITRATION LAYER (EAL) V1
 * ==========================================
 * Mimarideki 3 farklı SPA/Router motorunun (Reality Collision)
 * aynı anda DOM üzerinde çatışmasını engelleyen Merkezi Hakem.
 */

window.SantisRuntime = {
    mode: "public",
  
    engines: {
      sovereign: { enabled: false }, // Legacy Admin (DOMForge)
      quantum:   { enabled: false }, // Matrix Paneli (Shadow Worker)
      ghost:     { enabled: false }  // Halka Açık Site (View Transitions)
    },
  
    activeEngine: null,
  
    resolveEngine(url) {
      const isAdmin = url.includes('/admin');
      const isPublic = url.endsWith('.html') || url.includes('/hamam') || url.includes('/massage');
  
      if (isAdmin && url.includes('boardroom')) return "sovereign";
      if (isAdmin) return "quantum";
      return "ghost";
    },

    gate(url) {
      const engine = this.resolveEngine(url);
  
      // Bütün motorların yetkisini elinden al (Reset)
      Object.keys(this.engines).forEach(k => {
        this.engines[k].enabled = false;
      });
  
      // Sadece o anki vizyona uygun motoru aktif et
      this.engines[engine].enabled = true;
      this.activeEngine = engine;
  
      console.log(`%c[EXECUTION GATE] Otorite Sağlandı → Aktif Motor: ${engine.toUpperCase()}`, "color: #ff3366; font-weight: bold;");
      return engine;
    },

    // Herhangi bir motorun o an çalışmaya yetkisi olup olmadığını denetler
    isAllowed(engine) {
        return this.engines[engine] && this.engines[engine].enabled;
    }
};

// Sayfa ilk açıldığında Gate'i aktif rotaya göre kalibre et
window.SantisRuntime.gate(window.location.pathname);
