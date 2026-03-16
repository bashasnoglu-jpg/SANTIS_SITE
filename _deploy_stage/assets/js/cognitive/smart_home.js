/**
 * SANTIS OS: COGNITIVE JS
 * Component: Smart Home (The Conscience)
 * Responsibility: Dynamic DOM & Voice Adaptation based on Cultural Health
 */

class SmartHome {
    constructor() {
        console.log("🧠 [Cognitive] Smart Home Online");
        this.init();
    }

    async init() {
        await this.syncCulturalConscience();
    }

    async syncCulturalConscience() {
        try {
            const res = await fetch('/api/admin/tone-health');
            if (!res.ok) return; // Silent fail if offline

            const data = await res.json();
            this.adaptVoice(data.score);
        } catch (e) {
            console.log("🧠 [Cognitive] Conscience Offline (Network Error)");
        }
    }

    adaptVoice(score) {
        const body = document.body;

        // Reset Modes
        body.classList.remove('mode-soft-influence', 'mode-high-confidence');

        if (score < 60) {
            // SOFT INFLUENCE MODE
            // System feels "guilty" about low quality, becomes more humble/informative
            body.classList.add('mode-soft-influence');
            console.log(`🧠 [Cognitive] Tone Drift Detected (${score}). Engaging Soft Influence Mode.`);
            this.injectSoftInfluences();
        } else if (score >= 75) {
            // HIGH CONFIDENCE MODE
            // System is proud, minimalist, fewer words
            body.classList.add('mode-high-confidence');
            console.log(`🧠 [Cognitive] Tone Excellent (${score}). Engaging High Confidence Mode.`);
        } else {
            console.log(`🧠 [Cognitive] Tone Balanced (${score}). Standard Mode Active.`);
        }
    }

    injectSoftInfluences() {
        // Example: Add a subtle disclaimer class or modify specific text elements
        // This is a CSS hook primarily, but can also be JS text replacement
        document.documentElement.style.setProperty('--os-voice-opacity', '0.9'); /* Slightly more visible text */
    }

    reorder(userInterest) {
        // Future: Reorder DOM based on Oracle data
    }
}

// Auto-Init
document.addEventListener('DOMContentLoaded', () => {
    window.SmartHomeEngine = new SmartHome();
});
