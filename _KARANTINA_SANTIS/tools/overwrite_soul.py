
path = r"C:\Users\tourg\Desktop\SANTIS_SITE\assets\js\santis-soul.js"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Let's try to find just the first line of the function to anchor
anchor = "injectLayers() {"
function_body_end = "document.body.prepend(div);\n        }\n    }"

start_index = text.find(anchor)
if start_index != -1:
    # Find the closing brace of the function
    # heuristic: find the next 'document.body.prepend' and then the closing brace
    # Actually, let's just replace the whole block manually by matching line by line or just rewriting the file
    pass

# Direct overwrite approach since we know the file structure is simple
new_content = """/**
 * SANTIS SOUL ENGINE v1.0 (JS Core)
 * Controller for Bio-Rhythm & Liquid Starlight
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

        // Configuration
        this.smoothness = 0.08; // 0.0 to 1.0 (Lower is smoother/slower)

        this.init();
    }

    init() {
        console.log("🦅 [Soul Engine] Awakening...");

        // 1. Inject Structure if missing
        this.injectLayers();

        // 2. Event Listeners
        this.bindEvents();

        // 3. Start Heartbeat (Animation Loop)
        this.animate();

        console.log("🦅 [Soul Engine] Breathe in... 4... 7... 8...");
    }

    injectLayers() {
        if (!document.querySelector('.soul-atmosphere')) {
            const div = document.createElement('div');
            div.className = 'soul-atmosphere';

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
                    <div class="soul-rays"></div>
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
        window.addEventListener('deviceorientation', (e) => {
            if (e.beta !== null && e.gamma !== null) {
                this.hasGyro = true;
                // Clamp tilt values to reasonable angles (-45 to 45)
                const maxTilt = 45;
                this.tiltX = Math.max(Math.min(e.gamma, maxTilt), -maxTilt); // Left/Right
                this.tiltY = Math.max(Math.min(e.beta, maxTilt), -maxTilt);  // Front/Back
            }
        });
    }

    animate() {
        if (!this.active) return;

        // 1. Smooth Interpolation (Lerp) for Liquid Flow
        // Current = Current + (Target - Current) * Smoothness

        // If Gyro exists, use Tilt to offset the center
        let finalX = this.targetX;
        let finalY = this.targetY;

        if (this.hasGyro) {
            // Convert tilt to pixel offset
            // E.g. 20 degrees tilt = move light 200px
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            finalX = centerX + (this.tiltX * 5);
            finalY = centerY + (this.tiltY * 5);
        }

        // Apply Lerp for smoothness
        this.mouseX += (finalX - this.mouseX) * this.smoothness;
        this.mouseY += (finalY - this.mouseY) * this.smoothness;

        // 2. Update CSS Variables (Batch Update)
        this.root.style.setProperty('--cursor-x', `${this.mouseX.toFixed(1)}px`);
        this.root.style.setProperty('--cursor-y', `${this.mouseY.toFixed(1)}px`);

        // 3. Recursion
        requestAnimationFrame(() => this.animate());
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
        console.log(`🫁 Breath speed set to: ${speed}`);
    }

    setMood(mood) {
        // Changes color palette via class on body (managed by CSS)
        // Changes color palette via class on body (managed by CSS)
        document.body.classList.remove(
            'mode-dawn', 'mode-midnight', 'mode-zen',
            'mode-rain', 'mode-mist', 'mode-deep' // V2 Modes
        );
        document.body.classList.add(`mode-${mood}`);
        console.log(`🎨 Mood set to: ${mood}`);

        // Sync Sonic Layer
        if (window.SantisAudio) {
            window.SantisAudio.setAmbience(mood);
        }
    }
}

// Auto-Launch
document.addEventListener('DOMContentLoaded', () => {
    window.SantisSoul = new SantisSoul();
});
"""

with open(path, "w", encoding="utf-8") as f:
    f.write(new_content)
print("Overwrote santis-soul.js with context-aware logic")
