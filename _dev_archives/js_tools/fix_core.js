const fs = require('fs');
let code = fs.readFileSync('assets/js/core/santis-core.js', 'utf8');

let head = code.substring(0, code.indexOf(`                case 'CRITICAL_ERROR':`));

let tail = `                case 'CRITICAL_ERROR':
                    console.error("🔴 GOD'S EYE PING:", data.message);
                    break;
                case 'LOG':
                    console.log(\`[AI Worker] \${data.message}\`);
                    break;
            }
        };
    }

    bootAI() {
        const savedWeights = JSON.parse(localStorage.getItem('santis_neural_weights')) || null;
        const context = {
            hour: new Date().getHours(),
            origin: document.referrer
        };
        this.aiWorker.postMessage({ action: 'BOOT', payload: { weights: savedWeights, context } });
    }

    startSensors() {
        let lastX = 0, lastY = 0;
        let directionChanges = 0;
        
        setInterval(() => {
            directionChanges = Math.max(0, directionChanges - 1);
        }, 500);

        window.addEventListener('mousemove', (e) => {
            if (Math.sign(e.movementX) !== Math.sign(lastX) || Math.sign(e.movementY) !== Math.sign(lastY)) {
                directionChanges++;
            }
            lastX = e.movementX;
            lastY = e.movementY;

            const sensorData = {
                friction: window.santisFrictionScore || 0.5,
                velocity: Math.min(1, (Math.abs(e.movementX) + Math.abs(e.movementY)) / 100),
                dwellTime: 0.5,
                jitter: Math.min(1, directionChanges / 10)
            };

            if (Math.random() > 0.8) {
                 this.aiWorker.postMessage({ action: 'TICK', payload: sensorData });
            }
        });
    }

    sendFeedback(clickedIntent, wasPredictedCorrectly, dominantFeature) {
        this.aiWorker.postMessage({
            action: 'FEEDBACK',
            payload: { success: wasPredictedCorrectly, dominantFeature: dominantFeature }
        });
    }
}

if (!window.__SANTIS_SYSTEM_INITIALIZED__) {
    window.SantisOS_Neural = new SantisSensors();
    window.__SANTIS_SYSTEM_INITIALIZED__ = true;
}

/**
 * PHASE M: SOVEREIGN GARBAGE COLLECTOR
 * Otonom bellek sizintisi (Memory Leak) ve Testere Disi (Sawtooth) onleyici.
 * Ghost Engine (page-router) sayfa degistirirken tetiklenir.
 */
class SantisGarbageCollector {
    constructor() {
        window.addEventListener('santis:route-destroy', () => this.flush());
    }

    flush() {
        console.log('[Sovereign GC] Flushing orphaned references and APM nodes...');

        // 1. Interaction Engine (Sovereign Ticker & Magnetic UI)
        if (window.santisTicker && typeof window.santisTicker.refresh === 'function') {
            window.santisTicker.refresh();
        }

        if (window.magneticInstances) {
            for (let [el, inst] of window.magneticInstances.entries()) {
                if (!document.body.contains(el)) {
                    if (inst.unbind) inst.unbind();
                    window.magneticInstances.delete(el);
                }
            }
        }

        // 2. Sovereign Acoustics (Web Audio API)
        if (window.SantisAcoustics && typeof window.SantisAcoustics.releaseSpatialOrphans === 'function') {
            window.SantisAcoustics.releaseSpatialOrphans();
        }

        // 3. Vector Gamma (WebGL & Three.js Canvas Destroy)
        // Sadece oksuz ogeleri temizle
        if (window.SovereignVectorGamma && typeof window.SovereignVectorGamma.resize === 'function') {
            window.SovereignVectorGamma.resize();
        }
    }
}

if (!window.__SANTIS_GC_ACTIVE__) {
    window.__SANTIS_GC_ACTIVE__ = new SantisGarbageCollector();
}
`;

fs.writeFileSync('assets/js/core/santis-core.js', head + tail, 'utf8');
console.log("RESTORED!");
