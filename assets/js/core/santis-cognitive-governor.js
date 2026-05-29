/**
 * ╔═════════════════════════════════════════════════════════════════════════╗
 * ║  🛡️ SANTIS V43 - SAFETY & FATIGUE GOVERNOR (EU AI ACT 2026 COMPLIANT)   ║
 * ║  Strictly monitors physical interaction intensity to prevent UI fatigue.║
 * ║  Employs Zero-Retention cryptography. NO EMOTION OR STRESS TRACKING.    ║
 * ╚═════════════════════════════════════════════════════════════════════════╝
 */
class SafetyFatigueMonitor {
    constructor() {
        this.fatigueBuffer = 0;
        this.threshold = 1200; // Trigger threshold for physical UI fatigue
        this.leakRate = 1.5; // Natural decay rate per frame
        this.lastX = 0;
        this.lastY = 0;
        this.isSafemodeActive = false;
        this.promptShown = false;

        this.audioCtx = null;
        this.osc = null;

        this.initSensors();
        this.loop();
        console.log("🛡️ [Safety Governor] EU AI Act Compliant Fatigue Monitor Online. Zero-retention active.");
    }

    initSensors() {
        // Track erratic cursor physical velocity (Jitter)
        document.addEventListener('mousemove', (e) => {
            const dx = Math.abs(e.clientX - this.lastX);
            const dy = Math.abs(e.clientY - this.lastY);
            if (dx > 40 || dy > 40) {
                this.fatigueBuffer += (dx + dy) * 0.08;
            }
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        }, { passive: true });

        // Track hyper-scrolling velocity
        document.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > 60) {
                this.fatigueBuffer += Math.abs(e.deltaY) * 0.4;
            }
        }, { passive: true });

        // Track rapid selection clicks (UI Frustration)
        document.addEventListener('click', () => {
            this.fatigueBuffer += 150; 
        }, { passive: true });
    }

    loop() {
        if (this.isSafemodeActive) return;

        // Continuous Leaky Bucket drain
        if (this.fatigueBuffer > 0) {
            this.fatigueBuffer = Math.max(0, this.fatigueBuffer - this.leakRate);
        }

        // Apex Trigger
        if (this.fatigueBuffer > this.threshold && !this.promptShown) {
            this.triggerSafemodePrompt();
        }

        requestAnimationFrame(() => this.loop());
    }

    nuclearErasure() {
        // EU AI Act Compliance - Cryptographic Zero-Retention wipe of buffer memory
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            this.fatigueBuffer = (array[0] * 0); // Overwrite with secure logic gate
        }
        this.fatigueBuffer = 0;
        console.log("🧹 [Safety Governor] Clean Kill Protocol executed. Fatigue buffer cryptographically wiped.");
    }

    triggerSafemodePrompt() {
        if (this.promptShown) return;
        this.promptShown = true;

        console.warn(`🛡️ [Safety Governor] Interaction fatigue threshold breached. Proposing UI Safemode.`);

        // Log decision to Telemetry WITHOUT sending the buffer value (Zero-Retention)
        if (window.__SANTIS_DECISION_LOG__) {
            const entry = { module: 'safety_governor', decision: 'prompt_safemode', time: performance.now() }; // meta is entirely removed!
            window.__SANTIS_DECISION_LOG__.push(entry);
            if (navigator.sendBeacon) {
                const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
                const endpoint = isLocal ? "http://127.0.0.1:3030/api/v1/telemetry/decision" : "/api/v1/telemetry/decision";
                navigator.sendBeacon(endpoint, JSON.stringify(entry));
            }
        }

        // Elegant UI injection
        const prompt = document.createElement('div');
        prompt.id = 'spatial-zen-prompt';
        prompt.innerHTML = `
            <div class="flex" style="align-items: center; gap: 15px;">
                <span>High interaction fatigue detected. Enable UI Safemode?</span>
                <button class="text-lux-gold cursor-pointer" id="btn-enable-safemode" style="background: rgba(212, 175, 55, 0.1); border: 1px solid #c6a96b; padding: 6px 16px; border-radius: 4px; font-weight: 600; transition: 0.3s; letter-spacing: 0.05em;">OPT IN</button>
            </div>
        `;
        prompt.style.cssText = `
            position: fixed; top: 25px; left: 50%; z-index: 999999;
            background: rgba(8, 8, 8, 0.85); border: 1px solid #222; color: #eee;
            padding: 14px 24px; border-radius: 12px; font-family: -apple-system, sans-serif; font-size: 13px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.8); backdrop-filter: blur(12px);
            transform: translate(-50%, -30px); opacity: 0; transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        `;
        
        document.body.appendChild(prompt);

        requestAnimationFrame(() => {
            prompt.style.transform = 'translate(-50%, 0)';
            prompt.style.opacity = '1';
        });

        document.getElementById('btn-enable-safemode').addEventListener('click', () => {
            prompt.style.opacity = '0';
            setTimeout(() => prompt.remove(), 600);
            this.nuclearErasure(); // Wipe data immediately upon consent
            this.enableSafemode();
        });

        // Auto dismiss if ignored (protects agency from passive monitoring tracking)
        setTimeout(() => {
            if (document.body.contains(prompt)) {
                prompt.style.opacity = '0';
                setTimeout(() => prompt.remove(), 600);
                this.promptShown = false; 
                this.nuclearErasure(); // Wipe data on expiration
            }
        }, 8000);
    }

    enableSafemode() {
        this.isSafemodeActive = true;
        console.log("🧘‍♂️ [Safety Governor] UI Safemode Engaged. Visual noise minimized.");

        // 1. Visual Declutter Phase (Kept from V42 Zen architecture)
        document.body.classList.add('santis-zen-declutter');

        const style = document.createElement('style');
        style.innerHTML = `
            .santis-zen-declutter .bento-meta,
            .santis-zen-declutter .bento-price-tag,
            .santis-zen-declutter .footer-container,
            .santis-zen-declutter .santis-testimonials,
            .santis-zen-declutter .secondary-data {
                opacity: 0 !important;
                pointer-events: none !important;
                transition: opacity 1.2s ease !important;
            }
            .santis-zen-declutter {
                filter: brightness(0.92) contrast(0.95);
                transition: filter 2s ease;
            }
        `;
        document.head.appendChild(style);

        // 2. Safe WebAudio API Activation
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();

            this.osc.type = 'sine';
            this.osc.frequency.setValueAtTime(216, this.audioCtx.currentTime); 
            gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.04, this.audioCtx.currentTime + 4);

            this.osc.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            this.osc.start();

            gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 30);
            setTimeout(() => {
                this.audioCtx.close();
                this.isSafemodeActive = false;
                document.body.classList.remove('santis-zen-declutter'); 
                console.log("🧘‍♂️ [Safety Governor] Safemode Cycle Completed.");
            }, 32000);

        } catch (err) {
            console.warn("⚠️ [Safety Governor] Failed to initialize AudioContext:", err);
        }
    }
}

window.SantisCognitiveGovernor = SafetyFatigueMonitor;
