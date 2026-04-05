/**
 * ==========================================
 * 🧠 SANTIS ORACLE V6.2: THE BAYESIAN ENGINE
 * Closed-Loop Learning Runtime (CLLR)
 * ==========================================
 * Bu modül tahmin eden değil, "Olasılığı öğrenen ve yöneten" sistemdir.
 * Geçmiş prefetch kararlarını (Memory Cortex) saklar, zamanla utulur (Time Decay)
 * ve EAL (Execution Authority Layer) ile konuşur.
 */

// 1. ZİHİNSEL HAFIZA (Memory Cortex with Time Decay)
window.MemoryCortex = {
    log: new Map(),

    TIME_DECAY(lastSeen) {
        const age = Date.now() - lastSeen;
        // Exponential decay: 30 dakikalık yarı ömür (half-life)
        return Math.exp(-age / (1000 * 60 * 30));
    },

    record(url, visited) {
        if (!this.log.has(url)) {
            this.log.set(url, {
                hits: 0,
                misses: 0,
                confidence: 0.5,
                lastSeen: Date.now()
            });
        }

        const entry = this.log.get(url);
        if (visited) entry.hits++;
        else entry.misses++;

        entry.lastSeen = Date.now();

        // Continuous Upate (Soft Learning)
        entry.confidence = entry.hits / (entry.hits + entry.misses + 1);

        // Saturation Guard (Hafıza Taşkın Koruması)
        if (this.log.size > 5000) this.pruneOldestByDrift();
    },

    read(url) {
        const entry = this.log.get(url);
        if (!entry) return null;
        // Zeka: Eski kararları unutmaya (decay) başlar
        return entry.confidence * this.TIME_DECAY(entry.lastSeen);
    },

    pruneOldestByDrift() {
        console.warn("🧹 [MEMORY CORTEX] Saturation ulaşıldı. Unutma protokolü devrede.");
        const keys = Array.from(this.log.keys());
        // En az güvenilen ve en eski %20'yi sil
        keys.sort((a,b) => this.log.get(a).confidence - this.log.get(b).confidence).slice(0, 1000).forEach(k => this.log.delete(k));
    }
};

// 2. İSTATİSTİKSEL KAYMA DÜZELTİCİ (Drift Layer)
window.DriftLayer = {
    evaluate() {
        const entries = [...window.MemoryCortex.log.values()];
        if (entries.length === 0) return;

        const avgConfidence = entries.reduce((a,b) => a + b.confidence, 0) / entries.length;
        const expected = 0.65; // Sistem baseline beklentisi (Survival threshold)
        const drift = Math.abs(avgConfidence - expected);

        if (drift > 0.25) {
            this.applyCorrection(drift);
        }
    },

    applyCorrection(drift) {
        // Soft Weight Rebalancing (Sinir Ağı Bağlantılarını Yeniden Yapılandır)
        window.SantisOracle.velocityWeight *= (1 - drift * 0.3);
        window.SantisOracle.lingerWeight *= (1 + drift * 0.3);
        console.log(`🧠 [DRIFT LAYER] Ağırlıklar Mutasyona Uğradı -> V_W: ${window.SantisOracle.velocityWeight.toFixed(2)}, L_W: ${window.SantisOracle.lingerWeight.toFixed(2)}`);
    }
};

// 3. ORACLE KAVRAMSAL MOTOR (Cognitive Pre-fetch Core)
window.SantisOracle = {
    vector: null,
    intent: null,
    confidence: 0,
    lastDecision: "WAIT",
    aggression: 1.0, 
    velocityWeight: 0.6,
    lingerWeight: 0.4,
  
    init() {
        this.bindSensors();
        this.bindHomeostaticLoop();
        console.log("%c[ORACLE V6.2] Bayesian Cognitive Prefetch Layer Uyanıyor...", "color: #a855f7; font-weight: bold;");
    },

    observe(input, currentUrlTarget) {
      this.vector = input.vector || this.vector;
      this.intent = input.intent || this.intent;
      
      if (!this.vector || !this.intent) return { action: "WAIT" };

      this.confidence = this.calculateConfidence();
      return this.decide(currentUrlTarget);
    },
  
    calculateConfidence() {
      const v = Math.abs(this.vector.velocity || 0);
      const linger = this.intent.linger || 0;
  
      // Evrimleşebilen Ağırlıklar (Drift Layer ile Güncellenir)
      return Math.min(1, (v * this.velocityWeight + linger * this.lingerWeight));
    },

    decide(url) {
        // Bayesian Memory Fusion (Geçmiş deneyimleri hatırla)
        const prior = url ? (window.MemoryCortex.read(url) ?? 0.5) : 0.5;

        // Sensörleri (Risk) oku
        let riskScore = 0;
        if (window.RiskProfiler && typeof window.RiskProfiler.getRiskScore === 'function') {
            riskScore = window.RiskProfiler.getRiskScore(); // 0 ile 100 arası
        }

        // Fused Intelligence: Oracle Confidence + Prior Memory
        const fusedConfidence = (this.confidence * 0.6) + (prior * 0.4);

        // 🛡️ HARD SAFETY SHUTDOWN (Termal Çökme / Aşırı Yük)
        if (riskScore > 80) {
            this.lastDecision = "SYSTEM_SAFE_MODE";
            return { action: "SYSTEM_SAFE_MODE", prefetch: false, reason: "THERMAL_OR_COGNITIVE_OVERLOAD" };
        }

        const riskPenalty = this.calculateRiskPenalty(riskScore);
        
        let effectiveConfidence = (fusedConfidence * this.aggression) - riskPenalty;

        // 🧠 Hysteresis Band (Oscillation Killer)
        if (this.lastDecision === "NO_PREFETCH" && effectiveConfidence < 0.55) {
            return { action: "NO_PREFETCH", stable: true };
        }

        if (effectiveConfidence < 0.55) {
            this.lastDecision = "NO_PREFETCH";
            if (url) window.MemoryCortex.record(url, false); // Güven düşük (Miss)
            return { action: "NO_PREFETCH", reason: "UNCERTAINTY_RISK_FUSION" };
        }
      
        if (effectiveConfidence < 0.75) {
            this.lastDecision = "SOFT_PREFETCH";
            if (url) window.MemoryCortex.record(url, true); // Ziyaret olasılığı artıyor
            return { action: "SOFT_PREFETCH", mode: "lazy-shadow" };
        }
      
        this.lastDecision = "HARD_PREFETCH";
        if (url) window.MemoryCortex.record(url, true);
        return { action: "HARD_PREFETCH", mode: "ghost-cache" };
    },

    calculateRiskPenalty(risk) {
        if (risk < 30) return risk / 200;     
        if (risk < 60) return risk / 120;     
        return risk / 80;                     
    },

    // 🧠 Feedback Loop Stabilizer
    bindHomeostaticLoop() {
        setInterval(() => {
            if (!window.RiskProfiler || typeof window.RiskProfiler.getRiskScore !== 'function') return;
            const risk = window.RiskProfiler.getRiskScore();
            
            if (risk < 30) this.aggression = 1.2;
            else if (risk < 60) this.aggression = 0.8;
            else this.aggression = 0.4;

            // Zamanla istatistiksel kaymayı ölç ve ağırlıkları (Weights) mutasyona uğrat
            window.DriftLayer.evaluate();

        }, 2000);
    },

    bindSensors() {
        let lastMouse = { x: 0, y: 0, time: performance.now() };

        // 1. Vector Tracker (İvme Ölçümü)
        document.addEventListener("mousemove", (e) => {
            const now = performance.now();
            const dt = Math.max(1, now - lastMouse.time);
            
            const dx = e.clientX - lastMouse.x;
            const dy = e.clientY - lastMouse.y;
            const velocity = Math.sqrt(dx*dx + dy*dy) / dt; 

            window.__vector = { velocity };
            lastMouse = { x: e.clientX, y: e.clientY, time: now };
            
            this.observe({ vector: window.__vector }, null);
        }, { passive: true });

        // 2. Intent Linger (Odak Bekleme Ölçümü)
        let hoverStart = null;
        let hoverTarget = null;

        document.addEventListener("mouseover", (e) => {
            const card = e.target.closest("[data-intent], a"); 
            if (!card || card === hoverTarget) return;

            hoverStart = performance.now();
            hoverTarget = card;
        }, { passive: true });

        document.addEventListener("mouseout", (e) => {
            const card = e.target.closest("[data-intent], a");
            if (!card || !hoverStart || card !== hoverTarget) return;

            const linger = performance.now() - hoverStart;
            window.__intentState = { linger: linger / 1000 };
            
            const decision = this.observe({ intent: window.__intentState }, card.href);

            // EAL'e (Gate) bildir
            if (decision.action !== "NO_PREFETCH" && card.href) {
                this.delegateToEAL(card.href, decision);
            }

            hoverStart = null;
            hoverTarget = null;
        }, { passive: true });
    },

    delegateToEAL(url, decision) {
        if (!window.SantisRuntime) return;

        const authority = window.SantisRuntime.gate(new URL(url).pathname);
        if (!window.SantisRuntime.isAllowed(authority)) return;

        console.log(`%c[ORACLE DELEGATION] Karar: ${decision.action} -> Hakem: ${authority.toUpperCase()}`, "color: #d4af37; font-size: 10px;");
        
        if (authority === "ghost" && window.SantisGhostEngine && typeof window.SantisGhostEngine.preload === 'function') {
            window.SantisGhostEngine.preload(url, decision.mode);
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SantisOracle.init());
} else {
    window.SantisOracle.init();
}
