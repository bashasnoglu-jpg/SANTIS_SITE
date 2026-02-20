/**
 * 🛡️ SANTIS HEALTH MONITOR (v1.0)
 * "The Tri-Mind Visualizer"
 * 
 * Purpose: Real-time HUD for debugging the Neural Network.
 * Activation: Press 'Ctrl + H' to toggle.
 */

class SantisHealth {
    constructor() {
        this.isVisible = false;
        this.hud = null;
        this.timer = null;
        this.init();
    }

    init() {
        console.log("🛡️ [Health Monitor] System Standing By (Ctrl+H to Activate)");
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && (e.key === 'h' || e.key === 'H')) {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    createHUD() {
        const div = document.createElement('div');
        div.id = 'santis-hud';
        div.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            background: rgba(10, 12, 16, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 3px solid #D4AF37;
            padding: 15px;
            font-family: 'Courier New', monospace;
            color: #0f0;
            font-size: 11px;
            z-index: 999999;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: none;
        `;
        div.innerHTML = `
            <div style="border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; display:flex; justify-content:space-between;">
                <strong>SANTIS OS v6.0-ORACLE</strong>
                <span id="hud-clock">00:00:00</span>
            </div>
            
            <!-- AMYGDALA (Emotion) -->
            <div style="margin-bottom: 10px;">
                <div style="color: #aaa;">🧠 AMYGDALA (Biometrics)</div>
                <div style="display:flex; align-items:center; margin-top:2px;">
                    <span style="width:50px;">STRS:</span>
                    <div style="flex:1; height:4px; background:#333;">
                        <div id="hud-stress-bar" style="width:0%; height:100%; background:#f00; transition: width 0.2s;"></div>
                    </div>
                    <span id="hud-stress-val" style="width:30px; text-align:right;">0%</span>
                </div>
                <div style="display:flex; align-items:center; margin-top:2px;">
                    <span style="width:50px;">FOCS:</span>
                    <div style="flex:1; height:4px; background:#333;">
                        <div id="hud-focus-bar" style="width:0%; height:100%; background:#00f; transition: width 0.2s;"></div>
                    </div>
                    <span id="hud-focus-val" style="width:30px; text-align:right;">0%</span>
                </div>
            </div>

            <!-- ORACLE (Decision) -->
            <div style="margin-bottom: 10px;">
                <div style="color: #aaa;">🔮 ORACLE (Prophecy)</div>
                <div id="hud-oracle-latest" style="color: #D4AF37; margin-top: 2px;">Waiting for vision...</div>
                <div id="hud-oracle-reason" style="color: #666; font-style: italic;">...</div>
            </div>

            <!-- HIPPOCAMPUS (Memory) -->
            <div>
                <div style="color: #aaa;">💾 HIPPOCAMPUS (History)</div>
                <div id="hud-memory-stats" style="color: #ccc; margin-top: 2px;">Visits: 0 | Mood: -</div>
                <div id="hud-memory-top" style="color: #888; margin-top: 2px;">Top Interest: -</div>
            </div>

            <!-- SIMULATION TOOLS -->
            <div style="margin-top: 15px; border-top: 1px solid #333; pt-2;">
                <div style="color: #aaa; margin-bottom: 5px;">🎮 SIMULATION</div>
                <button onclick="window.SantisHealth.simulate('stress')" style="background:#500; color:#fff; border:none; padding:2px 5px; cursor:pointer;">High Stress</button>
                <button onclick="window.SantisHealth.simulate('zen')" style="background:#005; color:#fff; border:none; padding:2px 5px; cursor:pointer;">Deep Zen</button>
                <button onclick="window.SantisHealth.simulate('reset')" style="background:#333; color:#ccc; border:none; padding:2px 5px; cursor:pointer;">Reset</button>
            </div>
        `;
        document.body.appendChild(div);
        this.hud = div;
    }

    simulate(mode) {
        if (!window.EmotionEngine) return;
        console.log(`🎮 [Health] Simulating: ${mode}`);

        if (mode === 'stress') {
            window.EmotionEngine.state.energy = 0.95;
            window.EmotionEngine.state.focus = 0.1;
        } else if (mode === 'zen') {
            window.EmotionEngine.state.energy = 0.1;
            window.EmotionEngine.state.focus = 0.95;
        } else {
            window.EmotionEngine.state.energy = 0.5;
            window.EmotionEngine.state.focus = 0.5;
        }

        // Force Prophecy Update
        if (window.SantisOracle) window.SantisOracle.manifestProphecy();
    }

    toggle() {
        if (!this.hud) this.createHUD();
        this.isVisible = !this.isVisible;
        this.hud.style.display = this.isVisible ? 'block' : 'none';

        if (this.isVisible) {
            this.startLoop();
        } else {
            this.stopLoop();
        }
    }

    startLoop() {
        this.update();
        this.timer = setInterval(() => this.update(), 1000);
    }

    stopLoop() {
        clearInterval(this.timer);
    }

    update() {
        if (!this.hud) return;

        // 1. Clock
        document.getElementById('hud-clock').innerText = new Date().toLocaleTimeString();

        // 2. Amygdala
        const emotion = window.EmotionEngine ? window.EmotionEngine.state : { energy: 0, focus: 0 };
        const stressPct = Math.round(emotion.energy * 100);
        const focusPct = Math.round(emotion.focus * 100);

        document.getElementById('hud-stress-bar').style.width = `${stressPct}%`;
        document.getElementById('hud-stress-val').innerText = `${stressPct}%`;

        document.getElementById('hud-focus-bar').style.width = `${focusPct}%`;
        document.getElementById('hud-focus-val').innerText = `${focusPct}%`;

        // 3. Oracle
        if (window.SantisOracle && window.SantisOracle.lastProphecy) {
            const p = window.SantisOracle.lastProphecy;
            document.getElementById('hud-oracle-latest').innerText = p.product.title.substring(0, 25);
            document.getElementById('hud-oracle-reason').innerText = `Via: ${p.reasoning[0] || 'Unknown'}`;
        }

        // 4. Memory
        if (window.Registry) {
            const reg = window.Registry.get();
            const views = reg.journey.services_viewed;
            const topInterest = Object.entries(views).sort((a, b) => b[1] - a[1])[0];

            document.getElementById('hud-memory-stats').innerText = `Visits: ${reg.context.visit_count} | Mood: ${reg.soul.dominant_element}`;
            document.getElementById('hud-memory-top').innerText = topInterest ? `${topInterest[0]} (${topInterest[1]})` : 'No Data';
        }
    }
}

// Global Export
window.SantisHealth = new SantisHealth();
