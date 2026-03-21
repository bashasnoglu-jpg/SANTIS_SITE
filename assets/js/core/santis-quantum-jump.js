// santis-quantum-jump.js?v=V34_OMEGA
class QuantumJumpEngine {
  constructor() {
    this.injectSpeculationRules();
  }

  injectSpeculationRules() {
    if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
      const specScript = document.createElement('script');
      specScript.type = 'speculationrules';
      
      const rules = {
        "prerender": [
          {
            "source": "document",
            "where": { 
              "and": [ 
                { "href_matches": "/*" },
                { "not": { "href_matches": "/checkout/*" } }
              ]
            },
            "eagerness": "moderate"
          }
        ]
      };
      
      specScript.textContent = JSON.stringify(rules);
      document.head.appendChild(specScript);
      console.log("⚡ [Quantum Jump] Phase 64: Speculation Rules enjekte edildi. Zaman bükülmesi (0ms geçiş) hazır.");
    } else {
      console.log("🌌 [Quantum Jump] Prerender desteklenmiyor. Fallback LERP Prefetch devrede.");
    }
  }
}

if (!window.__quantumJumpEngine) window.__quantumJumpEngine = new QuantumJumpEngine();
