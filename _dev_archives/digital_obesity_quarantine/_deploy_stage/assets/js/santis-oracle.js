/**
 * 🧠 SANTIS ORACLE (v1.0) - THE TRI-MIND CORTEX
 * "The Prophecy Engine"
 * 
 * Architecture:
 * 1. HIPPOCAMPUS (Registry): Reads deep history & implicit interest.
 * 2. AMYGDALA (EmotionEngine): Reads real-time biometric stress/focus.
 * 3. CORTEX (Oracle): Synthesizes data to predict the user's *unspoken* need.
 * 
 * Algorithm:
 * Score = (Interest * 2.0) + (MoodMatch * 1.5) + (TimeMatch * 1.2)
 */

class SantisOracle {
    constructor() {
        this.products = [];
        this.lastProphecy = null;
        this.init();
    }

    async init() {
        // console.log("🔮 [Oracle] Awakening...");

        // Wait for Catalogue
        if (!window.productCatalog || window.productCatalog.length === 0) {
            await this.waitForData();
        }
        this.products = window.productCatalog || [];

        // Initial Prophecy (wait a bit for EmotionEngine to gather samples)
        setTimeout(() => this.manifestProphecy(), 2000);

        // Listen for Real-Time Updates
        window.addEventListener('santis-mood-change', () => this.manifestProphecy());
    }

    waitForData() {
        return new Promise(resolve => {
            const check = setInterval(() => {
                if (window.productCatalog && window.productCatalog.length > 0) {
                    clearInterval(check);
                    resolve();
                }
            }, 500);
        });
    }

    /**
     * THE CORE ALGORITHM
     * Generates a ranked list of products based on the Tri-Mind state.
     */
    divine() {
        if (this.products.length === 0) return null;

        // 1. GATHER INPUTS
        const history = window.Registry ? window.Registry.get().journey.services_viewed : {};
        const emotion = window.EmotionEngine ? window.EmotionEngine.state : { energy: 0.5, focus: 0.5 };
        const hour = new Date().getHours();
        const currentMood = document.documentElement.getAttribute('data-mood') || 'day';

        // console.log(`🔮 [Oracle] Inputs -> Energy:${emotion.energy.toFixed(2)} Focus:${emotion.focus.toFixed(2)} Time:${hour}`);

        // 2. SCORING LOOP
        const scored = this.products.map(p => {
            let score = 0;
            let reasoning = [];

            // A. INTEREST (Registry) - Weight: 2.0
            // Has user viewed this specific item?
            if (history[p.id]) {
                score += (history[p.id] * 5); // Direct hit
                reasoning.push(`Viewed ${history[p.id]}x`);
            }
            // Category match?
            const categoryInterest = Object.keys(history).some(k => k.includes(p.category));
            if (categoryInterest) {
                score += 10;
                reasoning.push('Category Interest');
            }

            // B. EMOTION MATCH (Amygdala) - Weight: 1.5
            // High Energy (Stress) -> Needs Calm (Massage, Hammam)
            if (emotion.energy > 0.7) {
                if (this.isCalming(p)) {
                    score += 15;
                    reasoning.push('Antidote to Stress');
                }
            }
            // High Focus -> Needs Detailed Content / Rituals
            if (emotion.focus > 0.8) {
                if (p.category.includes('Ritual') || p.price > 2000) {
                    score += 10;
                    reasoning.push('Matches Focus Depth');
                }
            }

            // C. TIME/MOOD MATCH (Circadian) - Weight: 1.2
            if (hour >= 22 || hour < 5) { // Late Night
                if (this.isSleepAid(p)) {
                    score += 12;
                    reasoning.push('Midnight Recovery');
                }
            } else if (hour >= 6 && hour < 11) { // Morning
                if (this.isEnergizing(p)) {
                    score += 12;
                    reasoning.push('Morning Awake');
                }
            }

            return { product: p, score, reasoning };
        });

        // 3. RANK & FILTER
        scored.sort((a, b) => b.score - a.score);

        // Return top result + debug data
        return scored[0];
    }

    manifestProphecy() {
        const result = this.divine();
        if (!result || result.score < 5) {
            // Threshold: Don't recommend if score is too low (random guessing)
            // console.log("🔮 [Oracle] Vision unclear. Standing by.");
            return;
        }

        if (this.lastProphecy && this.lastProphecy.product.id === result.product.id) {
            return; // No change
        }

        this.lastProphecy = result;
        // console.log(`🔮 [Oracle] PROPHECY: ${result.product.title} (Score: ${result.score})`, result.reasoning);

        // INJECT INTO UI
        if (window.renderSpotlight) {
            window.renderSpotlight(result.product, result.reasoning.join(' • '));
        }
    }

    // --- HELPERS ---

    isCalming(p) {
        const keywords = ['massage', 'masaj', 'relax', 'hammam', 'hamam', 'aromatherapy', 'sleep'];
        return this.checkKeywords(p, keywords);
    }

    isEnergizing(p) {
        const keywords = ['thai', 'sport', 'detox', 'coffee', 'scrub', 'canlandırıcı'];
        return this.checkKeywords(p, keywords);
    }

    isSleepAid(p) {
        const keywords = ['deep', 'sleep', 'relax', 'sıcak', 'hot', 'stone', 'mum'];
        return this.checkKeywords(p, keywords);
    }

    checkKeywords(p, words) {
        const text = (p.title + ' ' + p.category + ' ' + (p.desc || '')).toLowerCase();
        return words.some(w => text.includes(w));
    }
}

// Global Export
window.SantisOracle = new SantisOracle();
