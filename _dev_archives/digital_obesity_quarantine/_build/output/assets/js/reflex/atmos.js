/**
 * SANTIS OS: REFLEX JS
 * Component: Atmosphere Controller
 * Responsibility: Lighting, Shadows, Micro-interactions (<16ms)
 */

class Atmosphere {
    constructor() {
        this.lastMood = null;
        console.log("⚡ [Reflex] Atmosphere Online");
    }

    sync(timeOfDay, source = 'system') {
        // Sync CSS Variables with Time of Day / Mood
        // timeOfDay: 'dawn', 'mist', 'zen', 'sunset', 'midnight', 'deep'

        if (!timeOfDay) return;

        // Guard: Prevent system from overriding user choice
        if (source === 'system' && window.__atmosUserOverride) return;
        if (source === 'user') window.__atmosUserOverride = true;
        if (window.__atmosLastMood === timeOfDay && document.body?.dataset?.userMood === timeOfDay) return;
        window.__atmosLastMood = timeOfDay;

        console.log(`⚡ [Reflex] Atmosphere syncing to: ${timeOfDay}`);
        document.documentElement.style.setProperty('--santis-mood', timeOfDay);
        document.body.dataset.userMood = timeOfDay; // Sync for SmartPopup & other Cognitive modules

        // 1. Remove existing mood/atmos classes from body to reset state
        // This ensures no conflicting moods are active (e.g. dawn vs midnight)
        const classesToRemove = [];
        document.body.classList.forEach(cls => {
            if (cls.startsWith('mode-') || cls.startsWith('atmos-')) {
                classesToRemove.push(cls);
            }
        });
        classesToRemove.forEach(cls => document.body.classList.remove(cls));

        // 2. Apply new mode class based on mapping
        // Mapping aligned with assets/css/atmospheres.css
        const moodMap = {
            'dawn': 'mode-dawn',
            'sunset': 'mode-sunset',
            'midnight': 'mode-midnight',
            'deep': 'mode-midnight',      // Night variant (23:00-06:00)
            'rain': 'mode-sunset',         // Evening variant (18:00-23:00)
            'mist': 'atmos-mist',
            'underwater': 'atmos-underwater',
            'golden_hour': 'atmos-golden_hour',
            'zen': null // Default state (no class)
        };

        const newClass = moodMap[timeOfDay];
        if (newClass) {
            document.body.classList.add(newClass);
        }

        // 3. Trigger Sonic Layer (Santis Audio Engine)
        if (window.SantisAudio && window.SantisAudio.active) {
            // Map visual moods to audio profiles if needed
            const audioMap = {
                'underwater': 'deep',
                'golden_hour': 'zen',
                'sunset': 'deep'
            };
            const audioProfile = audioMap[timeOfDay] || timeOfDay;
            window.SantisAudio.setAmbience(audioProfile);
        }

        // 4. Trigger Voice (AI Concierge)
        if (window.SantisVoice && window.SantisVoice.active) {
            const voiceMessages = {
                'dawn': "Günaydın. Enerjik bir başlangıç için hazırsınız.",
                'sunset': "Günün yorgunluğunu atma vakti.",
                'midnight': "Sessizlik ve huzur...",
                'mist': "Sisli sabahlarda sakin kalmak en iyisi."
            };
            const msg = voiceMessages[timeOfDay];
            if (msg) window.SantisVoice.speak(msg);
        }

        // Future expansion: Trigger specific 3D lighting changes here
    }

    /**
     * Applies a full sensory profile from a Ritual's DNA.
     * @param {Object} dna - The sensory_dna object from the ritual definition.
     */
    applyAtmosphere(dna) {
        if (!dna) return;

        console.log(`🧬 [Sensory DNA] Applying Dimension: ${dna.dimension.toUpperCase()}`);

        // 1. Color Injection
        if (dna.color) {
            document.documentElement.style.setProperty('--atmos-accent', dna.color);
        }

        // 2. Light Mode (Body Class Transaction)
        if (dna.light_mode) {
            // Remove existing atmos classes
            document.body.classList.forEach(cls => {
                if (cls.startsWith('atmos-')) document.body.classList.remove(cls);
            });
            // Add new dimension
            document.body.classList.add(`atmos-${dna.light_mode}`);
        }

        // 3. Soundscape Strategy (Lazy Load)
        if (dna.sound_profile) {
            console.log(`🔊 [Sensory Audio] Preloading soundscape: ${dna.sound_profile}`);
            // Actual audio implementation will come in audio-engine.js
            // This is just the architectural hook.
        }

        // 4. Physics / Particles
        if (dna.particle_intensity !== undefined) {
            console.log(`✨ [Sensory Physics] Particle Intensity set to: ${dna.particle_intensity}`);
            document.documentElement.style.setProperty('--particle-intensity', dna.particle_intensity);
        }
    }
    /**
     * Dynamic Mood Shift (Triggered by Emotion Engine)
     * @param {string} mode - 'calm', 'clarity', 'energy'
     */
    shift(mode) {
        console.log(`⚡ [Reflex] Atmosphere Shifting to: ${mode.toUpperCase()}`);
        const root = document.documentElement;

        if (mode === 'calm') {
            // Slower animations, less noise
            root.style.setProperty('--santis-easing', 'cubic-bezier(0.2, 0.8, 0.2, 1)');
            root.style.setProperty('--particle-intensity', '0.2');
            root.style.setProperty('--atmos-overlay-opacity', '0.4'); // Dim the lights
        } else if (mode === 'clarity') {
            // High contrast, no noise
            root.style.setProperty('--particle-intensity', '0.0');
            root.style.setProperty('--atmos-overlay-opacity', '0.1');
            // Maybe increase font weight var if exists?
        } else {
            // Reset to default (Energy/Neutral)
            root.style.setProperty('--santis-easing', 'var(--ease-out-expo)');
            root.style.setProperty('--particle-intensity', '0.5');
            root.style.setProperty('--atmos-overlay-opacity', '0.0');
        }
    }
}

// Global Export
window.Atmosphere = Atmosphere;
