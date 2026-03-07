/**
 * SANTIS SOUL ENGINE v1.1 (Neural Core)
 * Controller for Bio-Rhythm & Liquid Starlight
 * Features:
 * - Mouse & Gyro Tracking
 * - Neural Scroll Reaction (Velocity-based atmosphere)
 * - Dynamic Breath Control
 * - Pulse Event Hook
 */

class SantisSoul {
    constructor() {
        this.root = document.documentElement;
        this.active = true;

        // State
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.targetX = this.mouseX;
        this.targetY = this.mouseY;

        // Gyroscope State
        this.tiltX = 0;
        this.tiltY = 0;
        this.hasGyro = false;

        // Scroll State
        this.scrollY = window.scrollY;
        this.scrollVelocity = 0;
        this.isScrolling = false;
        this.scrollTimer = null;

        // Configuration
        // Configuration (Quiet Luxury Tuning)
        this.smoothness = 0.05; // Heavier inertia for "premium" feel
        this.breathCycleMs = 6000; // Slower, deeper breathing

        this.init();
    }

    init() {
        // console.log("🦅 [Soul Engine] Awakening (Neural V1.1)...");

        // 0. Initialize Sub-Systems
        if (typeof Atmosphere !== 'undefined') {
            this.atmosphere = new Atmosphere();
        } else {
            console.warn("⚠️ [Soul Engine] Atmosphere component missing.");
        }

        // 1. Inject Structure if missing
        this.injectLayers();

        // 1.5 Load Performance Config
        this.loadConfig();

        // 2. Event Listeners
        this.bindEvents();

        // 3. Start Heartbeat (Animation Loop)
        this.animate();

        // console.log("🦅 [Soul Engine] Breathe in... 4... 7... 8...");
    }

    injectLayers() {
        if (!document.querySelector('.soul-atmosphere')) {
            const div = document.createElement('div');
            div.className = 'soul-atmosphere';
            // CRITICAL: Inline styles to prevent click-blocking even if CSS isn't loaded
            div.style.pointerEvents = 'none';
            div.style.position = 'fixed';
            div.style.top = '0';
            div.style.left = '0';
            div.style.width = '100vw';
            div.style.height = '100vh';
            div.style.zIndex = '-1';
            div.style.overflow = 'hidden';

            // Detect Context
            const isHome = document.querySelector('.home-editorial') || window.location.pathname === '/' || window.location.pathname.includes('index.html');

            if (isHome) {
                // 🌌 Full Cinematic (Homepage)
                div.innerHTML = `
                    <div class="soul-nebula"></div>
                    <!-- Elemental Layers V2 -->
                    <div class="soul-element element-rain"></div>
                    <div class="soul-element element-mist"></div>
                    <div class="soul-element element-dawn"></div>
                    <div class="soul-element element-water"></div>
                    <!-- Light & Texture -->
                    <div class="soul-light"></div>
                `;
            } else {
                // 🌫️ Lite Luxury Mode (Inner Pages)
                div.classList.add('soul-lite');
                div.innerHTML = `
                    <div class="soul-nebula" style="opacity:0.4;"></div>
                    <div class="soul-element element-mist" style="opacity:0.3;"></div>
                    <div class="soul-light" style="opacity:0.6;"></div>
                `;
            }

            document.body.prepend(div);
        }
    }

    bindEvents() {
        // Desktop: Mouse Tracking
        document.addEventListener('mousemove', (e) => {
            this.targetX = e.clientX;
            this.targetY = e.clientY;
        });

        // Mobile: Touch Tracking (Fallback if no Gyro)
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.targetX = e.touches[0].clientX;
                this.targetY = e.touches[0].clientY;
            }
        }, { passive: true });

        // Mobile: Gyroscope
        // DISABLED: Specific Security Hardening (Permissions-Policy: gyroscope=())
        // This prevents console violations and enhances battery life.
        /*
        try {
            window.addEventListener('deviceorientation', (e) => {
                if (e.beta !== null && e.gamma !== null) {
                    this.hasGyro = true;
                    const maxTilt = 45;
                    this.tiltX = Math.max(Math.min(e.gamma, maxTilt), -maxTilt);
                    this.tiltY = Math.max(Math.min(e.beta, maxTilt), -maxTilt);
                }
            });
        } catch (e) {
            console.warn("SoulEngine: Gyro access denied by protocol.");
        }
        */

        // Neural Scroll Listener
        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;
            const delta = currentScroll - this.scrollY;

            // Calculate Velocity (Simple)
            this.scrollVelocity = Math.abs(delta);
            this.scrollY = currentScroll;
            this.isScrolling = true;

            // Dynamic Breath: Rapid scroll = Energized
            if (this.scrollVelocity > 50) {
                this.root.style.setProperty('--breath-cycle', '8s');
            }

            // Debounce Reset
            clearTimeout(this.scrollTimer);
            this.scrollTimer = setTimeout(() => {
                this.isScrolling = false;
                this.scrollVelocity = 0;
                this.root.style.setProperty('--breath-cycle', '19s'); // Return to calm
            }, 150);
        }, { passive: true });
    }

    animate() {
        if (!this.active) return;

        // 1. Target Calculation
        let finalX = this.targetX;
        let finalY = this.targetY;

        if (this.hasGyro) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            finalX = centerX + (this.tiltX * 5);
            finalY = centerY + (this.tiltY * 5);
        }

        // 2. Neural Scroll Influence
        // Scrolling adds a vertical "drift" to the atmosphere
        if (this.isScrolling) {
            finalY += (this.scrollVelocity * 0.5);
        }

        // 3. Smooth Interpolation
        this.mouseX += (finalX - this.mouseX) * this.smoothness;
        this.mouseY += (finalY - this.mouseY) * this.smoothness;

        // 4. Update CSS
        this.root.style.setProperty('--cursor-x', `${this.mouseX.toFixed(1)}px`);
        this.root.style.setProperty('--cursor-y', `${this.mouseY.toFixed(1)}px`);

        // Dynamic Opacity based on activity
        // If scrolling fast, dim the atmosphere slightly to focus on content
        const dynamicOpacity = this.isScrolling && this.scrollVelocity > 20 ? 0.6 : 1.0;
        this.root.style.setProperty('--soul-opacity', dynamicOpacity);

        requestAnimationFrame(() => this.animate());
    }

    triggerPulse(intensity = 1.0) {
        // External Hook: Call this when user clicks or hovers significant items
        const pulse = document.createElement('div');
        pulse.className = 'soul-pulse';
        pulse.style.left = `${this.mouseX}px`;
        pulse.style.top = `${this.mouseY}px`;
        pulse.style.transform = `scale(${intensity})`;
        document.body.appendChild(pulse);

        setTimeout(() => pulse.remove(), 1000); // CSS animation should match
    }

    // --- ADMIN CONTROLS ---

    setBreathSpeed(speed) {
        // 'calm' (19s), 'normal' (12s), 'energized' (8s)
        const cycles = {
            'calm': '19s',
            'normal': '12s',
            'energized': '8s'
        };
        this.root.style.setProperty('--breath-cycle', cycles[speed] || '19s');
        // console.log(`🫁 Breath speed set to: ${speed}`);
    }

    setMood(mood) {
        document.body.classList.remove(
            'mode-dawn', 'mode-midnight', 'mode-zen',
            'mode-rain', 'mode-mist', 'mode-deep'
        );
        document.body.classList.add(`mode-${mood}`);
        // console.log(`🎨 Mood set to: ${mood}`);

        if (window.SantisAudio) {
            window.SantisAudio.setAmbience(mood);
        }

        // Sync Atmosphere
        if (this.atmosphere) {
            this.atmosphere.sync(mood);
        }
    }

    async loadConfig() {
        try {
            // 1. Load System Config
            const resConfig = await fetch('/api/config');
            if (resConfig.ok) {
                const cfg = await resConfig.json();
                if (cfg.animation_level === 'low') {
                    console.log("🌑 SoulEngine: Optimization Mode Active (Throttled)");
                    document.body.classList.add('nv-low-perf');
                    this.smoothness = 0.02;
                    this.root.style.setProperty('--breath-cycle', '25s');
                }
            }

            // 2. Consult The Oracle (Phase 24)
            // ... (Removed for pure Client-Side Emotion Engine) ...

            this.startEmotionEngine();

        } catch (e) { console.warn("Soul Config Load Failed", e); }
    }

    // --- PHASE 40: EMOTION ENGINE (Client-Side Cortex) ---

    startEmotionEngine() {
        // console.log("🧠 [Emotion Engine] Connected. Observing behavior...");

        // Init Behavior State
        this.behavior = {
            startTime: Date.now(),
            clicks: 0,
            scrolls: [],
            maxVelocity: 0,
            mood: 'neutral'
        };

        // Track Clicks
        document.addEventListener('click', () => {
            this.behavior.clicks++;
            this.behavior.lastClickTime = Date.now();
        });

        // Loop (Every 5 seconds)
        setInterval(() => this.analyzeBehavior(), 5000);
    }

    analyzeBehavior() {
        const now = Date.now();
        const duration = (now - this.behavior.startTime) / 1000; // seconds
        const velocity = this.scrollVelocity; // Current snapshot

        // Track Peak Velocity
        if (velocity > this.behavior.maxVelocity) this.behavior.maxVelocity = velocity;

        let scores = { calm: 0, decisive: 0, hesitant: 0, escape: 0 };

        // 1. CALM LOGIC (Slow scroll, long dwell)
        if (this.behavior.maxVelocity < 150 && duration > 20) scores.calm += 0.8;
        if (this.behavior.clicks < 3 && duration > 15) scores.calm += 0.4;

        // 2. DECISIVE LOGIC (Fast scroll, clicking)
        if (this.behavior.maxVelocity > 400) scores.decisive += 0.6;
        if (this.behavior.clicks > 4) scores.decisive += 0.5;

        // 3. HESITANT LOGIC (Erratic? For now, just low interaction but high dwell)
        if (this.behavior.maxVelocity > 100 && this.behavior.maxVelocity < 300 && duration > 60 && this.behavior.clicks < 2) {
            scores.hesitant += 0.7; // Scrolling a lot but not clicking
        }

        // 4. ESCAPE LOGIC (Time based)
        const hour = new Date().getHours();
        if (hour >= 23 || hour < 5) scores.escape += 0.9;

        // Winner?
        const winner = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        const intensity = scores[winner];

        if (intensity > 0.5 && winner !== this.behavior.mood) {
            this.behavior.mood = winner;
            this.applyStrategy(winner);
        }
    }

    applyStrategy(mood) {
        // console.log(`🧠 [Emotion Engine] Mood Shift Detected: ${mood.toUpperCase()}`);

        const strategies = {
            'calm': { mode: 'zen', breath: '19s', smoothing: 0.08 },
            'decisive': { mode: 'mist', breath: '8s', smoothing: 0.03 }, // Snappy
            'hesitant': { mode: 'sunset', breath: '12s', smoothing: 0.05 }, // Warm reassurance
            'escape': { mode: 'midnight', breath: '25s', smoothing: 0.1 } // Deep immersion
        };

        const strat = strategies[mood] || strategies['calm'];

        // Apply Physical Changes
        this.setMood(strat.mode);
        this.root.style.setProperty('--breath-cycle', strat.breath);
        this.smoothness = strat.smoothing;

        // Notify Body for CSS hooks (e.g. CTA contrast)
        document.body.dataset.userMood = mood;
    }
}

// Auto-Launch
document.addEventListener('DOMContentLoaded', () => {
    window.SantisSoul = new SantisSoul();
});
