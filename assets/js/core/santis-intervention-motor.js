/* ==========================================================================
   SANTIS L9 INTERVENTION ENGINE (Priority-Gated Luxury Intervention System)
   Phase A: Concierge Pulse
   ========================================================================== */

class SantisInterventionMotor {
    constructor() {
        // 1. SESSION STATE MODEL
        this.state = {
            interventionsShown: 0,
            lastInterventionTime: 0,
            activeIntervention: null,
            cooldown: false,
            intentScore: 0
        };

        // 2. ARBITRATION RULES MATRIX (Thresholds)
        this.rules = {
            maxSession: 2,
            cooldownMs: 120000,
            minIntentOracle: 35,
            minIntentConcierge: 55,
            minIntentGolden: 75
        };

        this.init();
    }

    init() {
        console.log("🦅 [L9 Arbitration Core] Intervention Engine awakened.");
        this.attachSignals();
    }

    // ==========================================
    // LAYER 1: SIGNAL COLLECTOR
    // ==========================================
    attachSignals() {
        // Exit Intent (Phase C)
        document.addEventListener("mouseleave", this.exitIntent.bind(this));
        
        // Scroll Fatigue (Phase B)
        document.addEventListener("scroll", this.scrollMonitor.bind(this));

        // Checkout Stagnation (Phase A)
        this.startIdleTimer();
    }

    exitIntent(e) {
        if (e.clientY > 0) return;
        this.emitSignal("signal.exit_intent.detected");
        // this.evaluate("golden_rescue"); (Phase C deferred)
    }

    scrollMonitor() {
        /* Phase B fatigue logic deferred */
    }

    startIdleTimer() {
        // Sadece checkout veya rezervasyon sekmesindeysek izle (Checkout Stagnation)
        if (!window.location.pathname.includes('rezervasyon') && !window.location.pathname.includes('booking')) {
            return;
        }

        let timer;
        const resetTimer = () => {
            clearTimeout(timer);
            // 45 seconds of stagnation without typing or clicking
            timer = setTimeout(() => {
                this.emitSignal("signal.checkout_stagnation.detected");
                this.evaluate("concierge_pulse");
            }, 45000);
        };

        // Start initially and reset on events
        document.addEventListener("mousemove", resetTimer, { passive: true });
        document.addEventListener("click", resetTimer, { passive: true });
        document.addEventListener("keydown", resetTimer, { passive: true });
        resetTimer();
    }

    // ==========================================
    // LAYER 2: SCORE EVALUATOR & ARBITRATION CORE
    // ==========================================
    evaluate(type) {
        if (!this.canIntervene(type)) {
            this.emitEvent("intervention.blocked.priority");
            return;
        }
        this.trigger(type);
    }

    canIntervene(type) {
        if (this.state.cooldown) {
            this.emitEvent("intervention.blocked.cooldown");
            return false;
        }
        if (this.state.interventionsShown >= this.rules.maxSession) {
            this.emitEvent("intervention.blocked.session_cap");
            return false;
        }
        return true;
    }

    trigger(type) {
        // Arbitration Check Passed
        this.emitEvent(`intervention.${type}.eligible`);

        this.state.activeIntervention = type;
        this.state.interventionsShown++;
        this.state.lastInterventionTime = Date.now();
        
        this.startCooldown();
        this.emitEvent(`intervention.${type}.shown`);
        
        this.render(type);
    }

    startCooldown() {
        this.state.cooldown = true;
        this.emitEvent("intervention.cooldown.started");
        
        setTimeout(() => {
            this.state.cooldown = false;
            this.emitEvent("intervention.cooldown.ended");
        }, this.rules.cooldownMs);
    }

    // ==========================================
    // LAYER 4: RENDERER TRIGGER
    // ==========================================
    render(type) {
        if (type === "concierge_pulse") {
            this.renderConcierge();
        } else if (type === "golden_rescue") {
            this.renderGolden();
        }
    }

    renderConcierge() {
        // Dispatch UI Trigger
        document.dispatchEvent(new CustomEvent("santis:concierge_pulse"));
        
        // Setup pulse UI dynamically (Non-blocking DOM inject)
        let conciergeEl = document.getElementById("santis-concierge");
        if (!conciergeEl) {
            // Create a fake floating button for demo if not exists
            conciergeEl = document.createElement("div");
            conciergeEl.id = "santis-concierge";
            conciergeEl.className = "santis-concierge-float";
            document.body.appendChild(conciergeEl);
        }

        conciergeEl.classList.add("intervention-active", "concierge-pulse");
        
        // Add tooltip
        const tooltip = document.createElement("div");
        tooltip.className = "santis-luxury-tooltip";
        tooltip.innerHTML = `
            <div class="tooltip-title">Size yardımcı olmamızı ister misiniz?</div>
            <div class="tooltip-alt">Personal Concierge hazır.</div>
            <button class="tooltip-close" id="concierge-dismiss">Şimdilik geç</button>
        `;
        conciergeEl.appendChild(tooltip);

        // Telemetry binding
        conciergeEl.addEventListener("click", (e) => {
            if(e.target.id === 'concierge-dismiss') {
                e.stopPropagation();
                this.emitEvent("intervention.concierge_pulse.dismissed");
                conciergeEl.classList.remove("intervention-active", "concierge-pulse");
                tooltip.remove();
            } else {
                this.emitEvent("intervention.concierge_pulse.clicked");
                // Open real concierge modal logic here
                conciergeEl.classList.remove("intervention-active", "concierge-pulse");
                tooltip.remove();
            }
        }, { once: true });

        // Auto remove pulse after 3 pulses (approx 12s)
        setTimeout(() => {
            if(conciergeEl.classList.contains("intervention-active")) {
                conciergeEl.classList.remove("intervention-active", "concierge-pulse");
                if (conciergeEl.contains(tooltip)) tooltip.remove();
                this.emitEvent("intervention.concierge_pulse.dismissed");
            }
        }, 12000);
    }

    renderGolden() {
        // Phase C reserved
    }

    // ==========================================
    // TELEMETRY BINDING
    // ==========================================
    emitSignal(type) {
        console.log(`📡 [L9 Signal] ${type}`);
        this.emitEvent(type);
    }

    emitEvent(type) {
        console.log(`🛡️ [L9 Arbitrator] ${type}`);
        if(window.SantisTelemetryClient) {
            window.SantisTelemetryClient.track(type, {
                component: 'intervention_engine',
                action: type,
                page: window.location.pathname
            });
        }
    }
}

// Instantiate Singleton
window.SantisInterventionMotor = new SantisInterventionMotor();
