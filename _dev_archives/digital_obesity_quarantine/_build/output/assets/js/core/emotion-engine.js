/**
 * 🧠 SANTIS OS: EMOTION ENGINE (Phase 40)
 * Component: The Analyst (Subconscious Processor)
 * Responsibility: Infer User Mood from Behavior (Scroll Velocity, Click Rage, Dwell Time)
 * Actions: Adjusts Atmosphere & Sorts Content
 */

const EmotionEngine = (function () {

    // Config
    const CONFIG = {
        sampleRate: 200, // ms
        stressThreshold: 2500, // px/s (High Speed Scroll)
        focusThreshold: 5000, // ms (Time spent without scroll)
        decay: 0.9 // How fast energy level drops
    };

    // State
    let state = {
        energy: 0.5, // 0.0 (Sleepy) -> 1.0 (Hyper/Stressed)
        focus: 0.5,  // 0.0 (Distracted) -> 1.0 (Deep Reading)
        lastScrollY: 0,
        lastTs: Date.now(),
        isIdle: false
    };

    let _timer = null;
    let _idleTimer = null;

    // --- ANALYTICS LOOP ---

    function start() {
        console.log("🧠 [Emotion Engine] Analyst Started.");

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('click', onClick);

        // Heartbeat (Analysis Loop)
        _timer = setInterval(analyze, 1000);
    }

    function onScroll() {
        // Reset Idle
        if (state.isIdle) {
            state.isIdle = false;
            console.log("🧠 [Emotion] Woke up from Idle.");
        }
        clearTimeout(_idleTimer);
        _idleTimer = setTimeout(() => { state.isIdle = true; }, CONFIG.focusThreshold);

        // Calculate Velocity
        const now = Date.now();
        const dy = Math.abs(window.scrollY - state.lastScrollY);
        const dt = now - state.lastTs;

        if (dt > 50) { // filter micro-jitters
            const velocity = (dy / dt) * 1000; // px/sec

            // Energy Spike
            if (velocity > CONFIG.stressThreshold) {
                state.energy = Math.min(state.energy + 0.2, 1.0);
                // console.log("🔥 [Emotion] High Energy Detected!", velocity.toFixed(0));
            }

            state.lastScrollY = window.scrollY;
            state.lastTs = now;
        }
    }

    function onClick() {
        // Clicks indicate engagement (or frustration if rapid)
        state.focus = Math.min(state.focus + 0.1, 1.0);
    }

    // --- CORE LOGIC ---

    function analyze() {
        // 1. Decay Energy (Return to Calm)
        state.energy *= CONFIG.decay;

        // 2. Adjust Focus (Idle = Focus?)
        if (state.isIdle) {
            state.focus = Math.min(state.focus + 0.05, 1.0);
        } else {
            state.focus *= 0.95; // Moving breaks focus
        }

        // 3. Infer Mood Vector
        const mood = {
            calm: 1.0 - state.energy,
            stress: state.energy,
            focus: state.focus
        };

        // 4. Update Registry (The Soul)
        if (window.Registry) {
            // Determine dominant element based on mood
            let element = 'earth'; // Default
            if (state.energy > 0.7) element = 'water'; // Need calming
            else if (state.focus > 0.8) element = 'air'; // Clarity
            else if (state.energy > 0.4 && state.focus < 0.3) element = 'fire'; // High energy, low focus

            // We update Registry casually (not every second to save write cycles)
            if (Math.random() < 0.05) { // 5% chance per tick ~ every 20s
                window.Registry.updateSoul(element);
            }
        }

        // 5. Trigger Effector (Atmosphere)
        if (state.energy > 0.7) {
            // User is rushing/stressed -> CALM THEM DOWN
            triggerIntervention('calm');
        } else if (state.focus > 0.8) {
            // User is reading -> CLARITY MODE
            triggerIntervention('clarity');
        } else {
            // Default
            triggerIntervention('neutral');
        }

        // Debug
        // console.log(`🧠 [Emotion] E:${state.energy.toFixed(2)} F:${state.focus.toFixed(2)}`);
    }

    let lastIntervention = null;
    let lastInterventionTime = 0;
    const COOLDOWN_MS = 30000; // 30s cooldown between atmosphere shifts

    function triggerIntervention(mode) {
        if (lastIntervention === mode) return;

        // Prevent ping-pong: ignore rapid switches
        const now = Date.now();
        if (now - lastInterventionTime < COOLDOWN_MS) return;

        lastIntervention = mode;
        lastInterventionTime = now;

        console.log(`🧠 [Emotion] Triggering Intervention: ${mode.toUpperCase()}`);

        if (window.Atmosphere) {
            // Create ephemeral instance to bridge command
            try {
                new window.Atmosphere().shift(mode);
            } catch (e) {
                console.error("Atmosphere Bridge Failed:", e);
                applyCSSMood(mode);
            }
        } else {
            applyCSSMood(mode);
        }
    }

    function applyCSSMood(mode) {
        const root = document.documentElement;
        if (mode === 'calm') {
            root.style.setProperty('--santis-easing', 'cubic-bezier(0.2, 0.8, 0.2, 1)'); // Slower
            root.style.setProperty('--particle-intensity', '0.3'); // Less noise
        } else if (mode === 'clarity') {
            root.style.setProperty('--particle-intensity', '0.0'); // No noise
            // Dim background logic could go here
        } else {
            root.style.setProperty('--santis-easing', 'var(--ease-out-expo)'); // Default
            root.style.setProperty('--particle-intensity', '0.5');
        }
    }

    // Auto-Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    return {
        get state() { return state; }
    };

})();
