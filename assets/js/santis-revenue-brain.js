/**
 * SANTIS REVENUE BRAIN V11 CORE (Autonomous Wealth Engine)
 * Phase 36: Sovereign Yield, Scarcity & Rescue Protocol
 */

class SantisRevenueBrain {
    constructor() {
        this.intents = {
            abandonCart: false,
            scarcityActive: false
        };

        this.settings = {
            minGhostScoreForRescue: 70,  // Score Engine ile senkronize
            surgeMultiplierBase: 1.0,
            apiEndpoint: '/api/v1/ai/proactive-closing' // Phase 33 Agentic Backend endpointini sömüreceğiz
        };

        this.init();
    }

    init() {
        console.log("💰 [Revenue Brain] V11 Core Booting: Sovereign Financial Engine Online.");

        this.listenForScarcity();
        this.listenForExitIntent();
        this.listenForScoreEngine();  // ← YENİ: Score Engine reaktif bridge
        this.applySurgePricing();

        // Persona bazlı Rescue mesaj şablonları
        this._rescueMessages = {
            'recovery-seeker': {
                message: "Bedeniniz bugün derin bir dinlenmeyi hak ediyor. Sizin için özel hazırladığımız Recovery Journey paketine ücretsiz VIP transfer ekledik.",
                action_button: "Recovery Journey'imi Onayla",
                action_url: "/tr/hamam/index.html"
            },
            'sovereign-guest': {
                message: "Sovereign misafirimiz olarak bu ziyaretinize özel bir ayrıcalık hazırladık. Yönetim inisiyatifiyle VIP Suite & Transfer paketi sizin için rezerve edildi.",
                action_button: "Ayrıcalığı Onayla →",
                action_url: "/reservation"
            },
            'royal-gold': {
                message: "Sovereign misafirimiz olarak bu ziyaretinize özel bir ayrıcalık hazırladık. Yönetim inisiyatifiyle VIP Suite & Transfer paketi sizin için rezerve edildi.",
                action_button: "Ayrıcalığı Onayla →",
                action_url: "/reservation"
            },
            'default': {
                message: "Bu ziyaretinize özel, sadece bugün geçerli bir teklif hazırladık. Santis Club deneyiminize ücretsiz bir Hammam Ritual ekleyelim mi?",
                action_button: "Teklife Bak →",
                action_url: "/tr/hamam/index.html"
            }
        };
    }

    // H0: SCORE ENGINE REAKTIF BRIDGE (santis-score-engine.js ile konuşur)
    listenForScoreEngine() {
        // Score Engine 70 puanı aşınca bu event'i fırlatıyor
        window.addEventListener('santis:rescue_trigger', (e) => {
            if (this.intents.abandonCart) return; // Zaten tetiklendiyse çalışma
            console.log(`🚁 [Revenue Brain] Score Engine Rescue Event received. Score: ${e.detail.score}`);
            this.intents.abandonCart = true;
            this._triggerPersonaRescue(e.detail.persona);
        });

        // Surge event'ini de dinle
        window.addEventListener('santis-surge-active', (e) => {
            console.log(`📈 [Revenue Brain] Surge Active: ${e.detail.multiplier}x`);
        });
    }

    // H1: THE SURGE PROTOCOL
    applySurgePricing() {
        const surgeStr = sessionStorage.getItem('santis_surge_multiplier');
        let multiplier = this.settings.surgeMultiplierBase;

        if (surgeStr) {
            multiplier = parseFloat(surgeStr);
        } else {
            // Örnek: Eğer Ghost Score > 90 ise otonom lüks premium (+%15)
            const ghostScore = parseInt(sessionStorage.getItem('santis_ghost_score') || '0', 10);
            if (ghostScore >= 95) {
                multiplier = 1.15;
                sessionStorage.setItem('santis_surge_multiplier', multiplier.toString());
                console.log(`📈 [Revenue Brain] High-Intent Guest Detected. Surge Multiplier set to ${multiplier}x`);
            }
        }

        if (multiplier > 1.0) {
            window.dispatchEvent(new CustomEvent('santis-surge-active', { detail: { multiplier } }));
            // Frontend'de fiyatları güncelleyecek Observer'lar bu eventi dinler.
        }
    }

    // H2: SCARCITY WHISPERER
    listenForScarcity() {
        // Sepetteki veya listedeki öğelerde "Son 2 Slot" gibi lüks uyarılar basan algılayıcı.
        window.addEventListener('santis-demand-spike', (e) => {
            console.log("💎 [Revenue Brain] Scarcity whisper triggered for:", e.detail.item);
            // Sadece loglamakla kalmayıp, UI'a (örn: Card'ların üstüne) "Limited Availability" bandı çekebilir.
        });
    }

    // H3: SOVEREIGN RESCUE MISSION (Exit Intent / Mouse Bounce via Priority Queue)
    listenForExitIntent() {
        // Event Bus'a Event Gönder (Priority 1, Yüksek Öncelik)
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY < 5 && !this.intents.abandonCart) {
                if (window.SantisBus) {
                    window.SantisBus.debounceEmit('santis:exit-intent', { priority: 1, type: 'mouse-bounce' }, 500);
                } else {
                    this._handleExitIntent(); // Fallback if Bus is not loaded
                }
            }
        });

        // 📱 MOBİL İÇİN MODERN ÇÖZÜM: visibilitychange ve pagehide
        // Kullanıcı sekmeyi değiştirdiğinde, arka plana aldığında veya tarayıcıyı kapattığında tetiklenir
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && !this.intents.abandonCart) {
                if (window.SantisBus) {
                    window.SantisBus.debounceEmit('santis:exit-intent', { priority: 1, type: 'visibility-hidden' }, 500);
                } else {
                    this._handleExitIntent();
                }
            }
        });

        window.addEventListener('pagehide', () => {
            if (!this.intents.abandonCart) {
                if (window.SantisBus) {
                    window.SantisBus.emit('santis:exit-intent', { priority: 1, type: 'page-hide' });
                } else {
                    this._handleExitIntent();
                }
            }
        });

        // Event Bus'tan Dinle (Sadece Raylar Hazırsa - Anti-Jitter)
        if (window.SantisBus) {
            window.SantisBus.on('santis:exit-intent', (evt) => {
                if (evt.priority === 1 && window.SantisBus.history.has('santis:rail-ready')) {
                    this._handleExitIntent();
                } else if (!window.SantisBus.history.has('santis:rail-ready')) {
                    console.log("⏳ [Revenue Brain] Exit Intent detected but deferred. Waiting for 'santis:rail-ready'...");
                }
            });
        }

        // Otonom Kodla Testten Tetiklendiğinde (Santis Bus)
        window.addEventListener('santis-abandon-cart-intent', () => {
            if (window.SantisBus) window.SantisBus.emit('santis:exit-intent', { priority: 2, type: 'manual' });
            else this._handleExitIntent();
        });
    }

    _handleExitIntent() {
        if (!this.intents.abandonCart) {
            this.intents.abandonCart = true;
            this.triggerRescueMission();
        }
    }

    // H2.5: PERSONA BAZLI RESCUE (Score Engine Otonom Hand-off)
    _triggerPersonaRescue(eventPersona) {
        // 🧬 Persona Okuma Zinciri: SANTIS Global → santisPersona → sessionStorage → default
        const raw = window.SANTIS?.persona
            || window.santisPersona
            || eventPersona
            || sessionStorage.getItem('santis_persona')
            || 'default';
        console.log(`🎭 [Revenue Brain] Personifying Rescue: passing to Aurelia API (raw: "${raw}")`);
        this.triggerRescueMission();
    }

    async triggerRescueMission() {
        const ghostScoreStr = sessionStorage.getItem('santis_ghost_score');
        const ghostScore = parseInt(ghostScoreStr || '0', 10);

        console.log(`🔍 [Revenue Brain] Testing Rescue conditions. Ghost Score: ${ghostScore}, Minimum Required: ${this.settings.minGhostScoreForRescue}`);

        // Rail-Ready Gating (Architecture Principle 2)
        if (window.SantisBus && !window.SantisBus.history.has('santis:rail-ready')) {
            console.warn(`🛡️ [Revenue Brain] Delaying Sovereign Rescue: Physics Engine is not ready yet.`);
            return;
        }

        if (ghostScore < this.settings.minGhostScoreForRescue) {
            console.warn(`🛡️ [Revenue Brain] Exit intent detected, but Ghost Score is too low for Sovereign Rescue.`);
            return;
        }

        console.warn("🚁 [Revenue Brain] Sovereign Rescue Triggered! Executing Aurelia Hand-Off...");
        document.documentElement.style.setProperty('--santis-v10-bg', '#050505');

        // Otonom Hand-Off: Event fırlatma ve Doğrudan LLM Agent'ı Uyanış
        window.dispatchEvent(new CustomEvent('santis:aurelia_wakeup', { detail: { score: ghostScore } }));

        // 🔮 THE NEURAL GHOST CONCIERGE (Zero-Latency Stream API)
        if (window.Aurelia) {
            const currentNode = window.location.pathname.split('/').pop().replace('.html', '') || 'Santis Home';
            window.Aurelia.awaken(ghostScore, currentNode);
        } else {
            console.warn("⚠️ [Rescue] Aurelia Engine bulunamadı!");
        }
    }

    // H4: YIELD PROTECTION (Floor Price Shield)
    validateYield(originalPrice, proposedPrice) {
        const MIN_YIELD_RATIO = 0.80; // %20 max indirim kalkanı
        const floorPrice = originalPrice * MIN_YIELD_RATIO;

        if (proposedPrice < floorPrice) {
            console.warn(`🛡️ [Revenue Brain] YIELD SHIELD ACTIVATED! Proposed: €${proposedPrice} is below Floor: €${Math.ceil(floorPrice)}. Adjusted to Floor Price.`);
            return Math.ceil(floorPrice);
        }
        return proposedPrice;
    }
}

// OS Boot sequence
// DOMContentLoaded beklemiyoruz (defer ile yüklendiği için zaten DOM hazırdır)
window.santisRevenueBrain = new SantisRevenueBrain();
