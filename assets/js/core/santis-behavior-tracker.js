/**
 * SANTIS BEHAVIOR TRACKER (PROTOCOL 24)
 * Phase 1: Throttled Sensors & Web Worker Bridge
 * Zero CPU overhead, battery-aware, strict passive listeners.
 */

class SantisBehaviorTracker {
    constructor() {
        this.worker = null;
        this.isActive = false;
        this.mousePos = { x: 0, y: 0 };
        this.lastThrottleTime = 0;
        this.THROTTLE_MS = 250; // 4 times a second max

        // Boot ONLY when browser is completely idle
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.checkKillSwitchAndBoot(), { timeout: 2000 });
        } else {
            setTimeout(() => this.checkKillSwitchAndBoot(), 500);
        }
    }

    async checkKillSwitchAndBoot() {
        // 1. Data Saver Check
        if (navigator.connection && (navigator.connection.saveData || ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType))) {
            console.warn('🛡️ [Neural Nav] Data Saver active or network slow. Sensors disabled.');
            return;
        }

        // 2. Battery Check (If API available)
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                if (battery.level < 0.20 && !battery.charging) {
                    console.warn('🔋 [Neural Nav] Battery low. Core UI protected. Sensors disabled.');
                    return;
                }
            } catch (e) { }
        }

        this.bootEngine();
    }

    bootEngine() {
        console.log('🧠 [Neural Nav] Environment clean. Engaging Web Worker & Sensors...');

        // Initialize Web Worker for isolated heavy lifting
        try {
            const rootPath = (typeof getSantisRootPath === 'function' ? getSantisRootPath() : '');
            const cleanRoot = rootPath.endsWith('/') ? rootPath.slice(0, -1) : rootPath;

            // To avoid cross-origin issues during local dev, we might load it via Blob, 
            // but standard external file is best for prod.
            this.worker = new Worker(cleanRoot + '/assets/js/core/santis-intent-worker.js');

            this.worker.onmessage = this.handleWorkerMessage.bind(this);
            this.isActive = true;

            this.injectSensors();
        } catch (e) {
            console.warn('🚨 [Neural Nav] Worker init failed. Falling back to dumb mode.', e);
        }
    }

    injectSensors() {
        // 1. Dwell Time (Hover Intention) - Passive
        document.addEventListener("mouseover", (e) => {
            const link = e.target.closest("a");
            if (!link || link.hostname !== window.location.hostname || link.hash) return;

            this.worker.postMessage({ type: 'HOVER_START', url: link.href, ts: Date.now() });
        }, { passive: true });

        document.addEventListener("mouseout", (e) => {
            const link = e.target.closest("a");
            if (!link || link.hostname !== window.location.hostname || link.hash) return;

            this.worker.postMessage({ type: 'HOVER_END', url: link.href, ts: Date.now() });
        }, { passive: true });

        // 2. IntersectionObserver (Gaze / Visibility)
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.worker.postMessage({ type: 'GAZE_HIT', url: entry.target.href });
                    io.unobserve(entry.target); // Once is enough to imply they've seen it
                }
            });
        }, { threshold: 0.5 }); // Element must be 50% visible

        document.querySelectorAll('a').forEach(a => {
            if (a.hostname === window.location.hostname && !a.hash) {
                io.observe(a);
            }
        });

        // 3. Vektörel Hız için Throttled MouseMove
        document.addEventListener("mousemove", (e) => {
            const now = Date.now();
            if (now - this.lastThrottleTime >= this.THROTTLE_MS) {
                this.lastThrottleTime = now;
                // Only send general mouse position for velocity mapping
                this.worker.postMessage({
                    type: 'MOUSE_VECTOR',
                    x: e.clientX,
                    y: e.clientY,
                    ts: now
                });
            }
        }, { passive: true });

        // Pass baseline context to worker
        const currentScore = parseInt(sessionStorage.getItem('santis_ghost_score') || '0', 10);
        this.worker.postMessage({ type: 'INIT_CONTEXT', score: currentScore, currentUrl: window.location.href });
    }

    handleWorkerMessage(e) {
        const payload = e.data;

        if (payload.action === 'PREFETCH_EXECUTE') {
            this.executeZeroLagPrefetch(payload.url);
        } else if (payload.action === 'BATCH_TELEMETRY') {
            this.sendBatchToBackend(payload.batch);
        }
    }

    executeZeroLagPrefetch(url) {
        console.log(`⚡ [Neural Nav] Confidence High. Speculative Fetch/Prerender Triggered: ${url}`);

        // Use Speculation Rules API if available (Chrome 109+) (Protocol 25: Prerender)
        if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
            const specScript = document.createElement('script');
            specScript.type = 'speculationrules';
            specScript.textContent = JSON.stringify({
                prerender: [{
                    source: "list",
                    urls: [url]
                }]
            });
            document.head.appendChild(specScript);
        } else {
            // Fallback to standard link prefetch
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
        }
    }

    sendBatchToBackend(batch) {
        if (!batch || batch.length === 0) return;

        const sessionId = sessionStorage.getItem('santis_ghost_session') || `ghost_anon_${Date.now()}`;

        // POST to Zero-Crash Pipeline
        const payloadStr = JSON.stringify({
            session_id: sessionId,
            predictions: batch
        });

        // Use keepalive / fetch for batch sending
        fetch('/api/v1/telemetry/intent-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payloadStr,
            keepalive: true
        }).catch(err => {
            // Silently fail to protect UI
        });
    }
}

// Auto-Instantiate if not prevented
document.addEventListener('DOMContentLoaded', () => {
    window.SantisBehavior = new SantisBehaviorTracker();
});
