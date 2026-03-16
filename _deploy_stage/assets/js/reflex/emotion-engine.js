/**
 * SANTIS REFLEX: EMOTION ENGINE v1.0
 * Maps User Moods to Sensory DNA (Ritual Antidotes)
 * Part of the "Bio-Chemical Architecture"
 */

class EmotionEngine {
    constructor() {
        console.log("🧠 [Reflex] Emotion Engine Online");

        // Protocol Mapping: Mood -> Dimension
        this.protocols = {
            'burnout': {
                dimension: 'sage',
                target_category: 'sothys-purifying',
                antidote: 'Rituel Détox Lumière'
            },
            'stress': {
                dimension: 'slate',
                target_category: 'sothys-men', // Grounding
                antidote: 'Rituel Homme Force & Calme'
            },
            'fatigue': {
                dimension: 'ice',
                target_category: 'sothys-hydra', // Energy/Hydra
                antidote: 'Rituel Hydra Sublime'
            },
            'anxiety': {
                dimension: 'gold',
                target_category: 'sothys-antiage', // Comfort
                antidote: 'Rituel Jeunesse Suprême'
            },
            'dullness': {
                dimension: 'sage',
                target_category: 'sothys-purifying',
                antidote: 'Rituel Pureté Profonde'
            }
        };
    }

    /**
     * Prescribes a ritual based on detected/input mood.
     * @param {string} mood - The user's emotional state key.
     * @returns {Object} Recommendation object with dimension and specific ritual.
     */
    prescribe(mood) {
        const protocol = this.protocols[mood.toLowerCase()];

        if (!protocol) {
            console.warn(`⚠️ [Emotion Engine] No protocol found for mood: ${mood}`);
            return this.protocols['stress']; // Default fallback
        }

        console.log(`💊 [Emotion Engine] Prescribing Antidote for ${mood.toUpperCase()} -> ${protocol.antidote} (${protocol.dimension})`);

        // Trigger Atmosphere immediately if on a compatible page
        if (window.Atmosphere) {
            // Mock DNA for immediate atmospheric shift
            const mockDNA = {
                dimension: protocol.dimension,
                light_mode: this.getLightMode(protocol.dimension),
                color: this.getColor(protocol.dimension)
            };
            new Atmosphere().applyAtmosphere(mockDNA);
        }

        return protocol;
    }

    getLightMode(dim) {
        const map = {
            'sage': 'mist',
            'ice': 'underwater',
            'gold': 'golden_hour',
            'slate': 'midnight'
        };
        return map[dim] || 'zen';
    }

    getColor(dim) {
        const map = {
            'sage': '#B7C4B8',
            'ice': '#E0F7FA',
            'gold': '#D4AF37',
            'slate': '#2C3E50'
        };
        return map[dim] || '#FFFFFF';
    }
}

// Global Export
window.EmotionEngine = EmotionEngine;
