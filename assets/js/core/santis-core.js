/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🧠 SANTIS OS v3 — RUNTIME KERNEL                          ║
 * ║  Deterministic Boot · Neural Runtime · Fail-Safe            ║
 * ║  Zero Dependencies · Main-Thread Safe · Worker-Clustered    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/* ─── 1. KERNEL GLOBAL STATE ─────────────────────────────────────────────── */
const __SANTIS__ = {
    version: '4.0.0', // V4: Unified Runtime
    bootTime: performance.now(),
    modules: new Map(),       // Yüklü modül cache
    workers: new Map(),       // Worker havuzu
    services: {},             // Çekirdek servisler
    signals: {                // Neural runtime sinyalleri
        cursorSpeed: 0,
        scrollDepth: 0,
        hoverTime: 0,
        vipScore: parseInt(sessionStorage.getItem('santis_vip') || '0'),
        deviceTier: navigator.hardwareConcurrency >= 4 ? 'high' : 'low'
    },
    flags: {
        safeMode: false,
        kernelReady: false,
        neuralActive: false
    },
    policy: {
        enforceCLS: true,
        enforceLifecycle: true,
        enforceScheduler: true,
        enforceSEO: true
    }
};
globalThis.__SANTIS__ = __SANTIS__;

/* ─── 2. SCHEDULER ENGINE ────────────────────────────────────────────────── */
/**
 * Priority Queue ile scheduler.postTask → requestIdleCallback → MessageChannel
 * sıralı polyfill zinciri.
 */
const SantisScheduler = (() => {
    const PRIORITY = { CRITICAL: 0, HIGH: 1, NORMAL: 2, IDLE: 3 };
    const queues = [[], [], [], []];
    let rafPending = false;

    // MessageChannel tabanlı micro-task fallback (Safari < 16 desteği)
    const mc = typeof MessageChannel !== 'undefined' ? new MessageChannel() : null;
    if (mc) {
        mc.port1.onmessage = () => _drain(PRIORITY.NORMAL);
    }

    function _drain(prio) {
        const q = queues[prio];
        const deadline = performance.now() + 4; // 4ms frame budget
        while (q.length && performance.now() < deadline) {
            try { q.shift()(); } catch (e) { /* sessiz */ }
        }
        if (q.length) _schedule(prio); // Kalan işler → sonraki frame
    }

    function _schedule(prio) {
        if (prio <= PRIORITY.HIGH) {
            queueMicrotask(() => _drain(prio));
        } else if ('requestIdleCallback' in window) {
            requestIdleCallback(() => _drain(prio), { timeout: 2000 });
        } else if (mc) {
            mc.port2.postMessage(null);
        } else {
            setTimeout(() => _drain(prio), 16);
        }
    }

    return {
        post(task, priority = 'normal') {
            // Native scheduler.postTask API (Chrome 94+)
            if ('scheduler' in globalThis) {
                return globalThis.scheduler.postTask(task, { priority });
            }
            const prio = { 'user-blocking': 0, 'user-visible': 2, 'background': 3 }[priority] ?? PRIORITY.NORMAL;
            queues[prio].push(task);
            _schedule(prio);
        },

        critical: (fn) => SantisScheduler.post(fn, 'user-blocking'),
        high:     (fn) => SantisScheduler.post(fn, 'user-visible'),
        idle:     (fn) => SantisScheduler.post(fn, 'background')
    };
})();

/* ─── 3. EVENT BUS ───────────────────────────────────────────────────────── */
const SantisEventBus = (() => {
    const target = new EventTarget();
    return {
        on(event, handler)  { target.addEventListener(event, handler); },
        off(event, handler) { target.removeEventListener(event, handler); },
        once(event, handler){ target.addEventListener(event, handler, { once: true }); },
        emit(event, detail) {
            target.dispatchEvent(new CustomEvent(event, { detail, bubbles: false }));
        }
    };
})();

/* ─── 4. RESILIENT MODULE LOADER ─────────────────────────────────────────── */
/**
 * Exponential backoff retry + circuit breaker + fallback UI.
 * Hiçbir modül başarısız yükleme nedeniyle boş ekrana yol açamaz.
 */
const failures = new Map();

async function resilientImport(name, importFn, options = {}) {
    const { retries = 3, fallback = null } = options;

    // Cache: zaten yüklüyse tekrar yükleme
    if (__SANTIS__.modules.has(name)) return __SANTIS__.modules.get(name);

    // Circuit breaker: 3+ hata varsa devre dışı
    if ((failures.get(name) || 0) >= 3) {
        console.warn(`[Kernel] ⚡ Circuit OPEN: ${name} geçici olarak devre dışı`);
        return fallback ? { init: fallback } : null;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const mod = await importFn();
            __SANTIS__.modules.set(name, mod);
            failures.delete(name);
            SantisEventBus.emit('kernel:module-ready', { name });
            return mod;
        } catch (e) {
            const count = (failures.get(name) || 0) + 1;
            failures.set(name, count);
            if (attempt < retries) {
                const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
                console.warn(`[Kernel] ⏳ ${name} — deneme ${attempt}/${retries}, ${delay}ms bekleniyor...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    // Tüm denemeler başarısız → Fallback
    console.error(`[Kernel] 🚨 ${name} yüklenemedi — fallback aktif`);
    SantisEventBus.emit('kernel:module-failed', { name });

    if (name === 'commerce') {
        return {
            init: () => {
                document.querySelectorAll('[data-booking-trigger]').forEach(el => {
                    el.href = 'https://wa.me/905348350169';
                    el.textContent = 'WhatsApp ile Rezervasyon';
                });
            }
        };
    }
    return null;
}

/* ─── 5. DEPENDENCY GRAPH ────────────────────────────────────────────────── */
const DEPENDENCY_GRAPH = {
    render:      { deps: [],                       loader: () => import('../engines/gpu-effects.js') },
    data:        { deps: [],                       loader: () => import('../loaders/data-bridge.js') },
    interaction: { deps: [],                       loader: () => import('../modules/interaction-engine.js?v=V51_GHOST14') },
    router:      { deps: ['interaction'],           loader: () => import('../modules/page-router.js') },
    ui:          { deps: ['render','interaction'],  loader: () => import('../ui/massage-matrix.js?v=V51_GHOST14') },
    commerce:    { deps: ['data'],                 loader: () => import('../core/checkout-ritual.js') },
    experience:  { deps: ['render'],               loader: () => import('../core/neuro-detail.js') },
    analytics:   { deps: [],                       loader: () => import('../santis-score-engine.js') },
    ai:          { deps: ['analytics'],            loader: () => import('../ai/santis_intent_ai.js') }
};

const resolving = new Map();

async function resolveModule(name) {
    if (__SANTIS__.modules.has(name)) return __SANTIS__.modules.get(name);
    if (resolving.has(name)) return resolving.get(name);

    const node = DEPENDENCY_GRAPH[name];
    if (!node) return null;

    const promise = (async () => {
        // Önce bağımlılıkları çöz
        for (const dep of node.deps) await resolveModule(dep);
        // Sonra modülü yükle — `loader` fn Vite/Rollup için statik olarak analiz edilebilir
        return resilientImport(name, node.loader);
    })();

    resolving.set(name, promise);
    const result = await promise;
    resolving.delete(name);
    return result;
}

/* ─── 6. NEURAL RUNTIME — Predictive Module Loader ──────────────────────── */
const NeuralRuntime = (() => {
    let active = false;
    let lastMouseX = 0, lastMouseY = 0, lastMouseTime = 0;
    const prefetched = new Set();

    function _prefetch(name) {
        if (prefetched.has(name) || __SANTIS__.modules.has(name)) return;
        prefetched.add(name);
        SantisScheduler.idle(() => {
            resolveModule(name).then(() => {
                console.log(`[Neural] 🔮 Predictive prefetch: ${name}`);
            });
        });
    }

    function _analyze() {
        const s = __SANTIS__.signals;

        // ── APTAL UI: Sadece sinyalleri Beyin'e (Worker'a) raporla ──────────
        // Main Thread KARAR VERMEZ. Prefetch emirlerini Worker'dan alır, uygular.
        const aiWorker = __SANTIS__.workers.get('ai');
        if (aiWorker) {
            aiWorker.analyzeIntent(
                s.scrollDepth,
                s.cursorSpeed,
                s.hoverTime,
                s.vipScore,
                s.deviceTier
            ).then(result => {
                // Skoru güncelle
                __SANTIS__.signals.vipScore = result.score;
                sessionStorage.setItem('santis_vip', result.score);
                SantisEventBus.emit('neural:vip-update', result);

                // Beynin verdiği Prefetch Emirlerine körü körüne itaat et
                result.actions?.prefetch?.forEach(mod => {
                    _prefetch(mod);
                    console.log(`%c[Neural 🔮] Intent: ${result.intent} → Prefetch: [${mod}]`,
                        'color:#d4af37;font-family:monospace;font-size:11px;');
                });
            }).catch(() => _localVIPScore(s));
        } else {
            _localVIPScore(s);
        }
        // ─────────────────────────────────────────────────────────────────────
    }

    // Worker yokken yerel (sync) skor — 100µs altında, graceful degradation
    function _localVIPScore(s) {
        const score = Math.min(
            Math.round(s.scrollDepth * 40 + s.cursorSpeed / 50 + s.hoverTime * 10 + s.vipScore),
            100
        );
        __SANTIS__.signals.vipScore = score;
        sessionStorage.setItem('santis_vip', score);
    }

    return {
        start() {
            if (active) return;
            active = true;
            __SANTIS__.flags.neuralActive = true;

            let lastSignalUpdate = 0; // ⏱️ 200ms throttle

            function _throttledAnalyze() {
                const now = performance.now();
                if (now - lastSignalUpdate < 200) return;
                lastSignalUpdate = now;
                _analyze();
            }

            // Scroll derinliği
            const onScroll = () => {
                __SANTIS__.signals.scrollDepth = window.scrollY /
                    (document.body.scrollHeight - window.innerHeight || 1);
                _throttledAnalyze();
            };

            // Cursor hızı
            const onMouseMove = (e) => {
                const now = performance.now();
                const dt = now - lastMouseTime || 16;
                const dx = e.clientX - lastMouseX;
                const dy = e.clientY - lastMouseY;
                __SANTIS__.signals.cursorSpeed = Math.sqrt(dx*dx + dy*dy) / dt * 1000;
                lastMouseX = e.clientX; lastMouseY = e.clientY; lastMouseTime = now;
            };

            // Hover süresi
            let hoverStart = 0;
            const onMouseOver = (e) => {
                if (e.target.closest('a, button, [data-booking-trigger]')) {
                    hoverStart = performance.now();
                }
            };
            const onMouseOut = () => {
                if (hoverStart) {
                    __SANTIS__.signals.hoverTime = (performance.now() - hoverStart) / 1000;
                    hoverStart = 0;
                    _throttledAnalyze();
                }
            };

            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('mousemove', onMouseMove, { passive: true });
            document.addEventListener('mouseover', onMouseOver, { passive: true });
            document.addEventListener('mouseout', onMouseOut, { passive: true });
        }
    };
})();

/* ─── 7. SAFE MODE ───────────────────────────────────────────────────────── */
function activateSafeMode(reason) {
    __SANTIS__.flags.safeMode = true;
    document.documentElement.classList.add('santis-safe-mode');
    document.documentElement.classList.add('app-ready'); // Siyah ekran kalmasın
    console.error(`[Kernel] 🛡️ SAFE MODE — ${reason}`);

    // Tüm animasyon durdur
    const style = document.createElement('style');
    style.textContent = `
        .santis-safe-mode *, .santis-safe-mode *::before, .santis-safe-mode *::after {
            animation: none !important;
            transition: none !important;
            transform: none !important;
        }
    `;
    document.head.appendChild(style);

    // Statik rezervasyon linki koru
    document.querySelectorAll('[data-booking-trigger], .santis-btn-primary').forEach(el => {
        if (el.tagName === 'A') el.href = 'https://wa.me/905348350169';
    });

    SantisEventBus.emit('kernel:safe-mode', { reason });
}

/* ─── 8. RUNTIME ENFORCEMENT & SHIELD ────────────────────────────────────── */
const SantisEnforcer = (() => {
    // 1. CLS Auto-Fixer (MutationObserver)
    if (__SANTIS__.policy.enforceCLS) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.tagName === 'IMG') {
                        if (!node.style.aspectRatio && !node.getAttribute('height')) {
                            console.warn('⚠️ [Santis Enforcer] CLS violation fixed: aspect-ratio applied.');
                            node.style.aspectRatio = '16/9';
                            node.style.width = '100%';
                            node.style.objectFit = 'cover';
                        }
                        node.setAttribute('decoding', 'async');
                    }
                });
            });
        });
        // Start watching the DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => observer.observe(document.body, { childList: true, subtree: true }));
        } else {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    // 2. Global Socket Click Event Enforcement (Event Bus Lock)
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-socket]');
        if (!target) return;
        const socketType = target.dataset.socket;
        SantisEventBus.emit(socketType, target);
    });

    // 3. Layout Thrashing Guard
    let readQueue = [];
    let writeQueue = [];
    function flushThrashing() {
        if (readQueue.length || writeQueue.length) {
            readQueue.forEach(fn => fn());
            writeQueue.forEach(fn => fn());
            readQueue = [];
            writeQueue = [];
        }
        requestAnimationFrame(flushThrashing);
    }
    requestAnimationFrame(flushThrashing);

    // 4. Continuous Memory Validation (Zombie Detector)
    setInterval(() => {
        const activeMod = __SANTIS__.activeModule;
        const subs = activeMod?.__subscriptions?.length || 0;
        if (subs > 20) {
            console.warn('⚠️ [Santis Enforcer] Suspicious subscription growth detected in ' + (activeMod.constructor.name || 'active module'));
        }
    }, 5000);

    return {
        scheduleRead: (fn) => readQueue.push(fn),
        scheduleWrite: (fn) => writeQueue.push(fn),
        updateHead: (meta) => {
            if (meta.title) document.title = meta.title;
            const desc = document.querySelector('meta[name="description"]');
            if (desc && meta.description) desc.content = meta.description;
        },
        domUpdate: (fn) => {
            SantisScheduler.post(fn, 'normal');
        },
        registerResource: (cleanupFn) => {
            if (!__SANTIS__.activeModule) return;
            __SANTIS__.activeModule.__resources ??= [];
            __SANTIS__.activeModule.__resources.push(cleanupFn);
        }
    };
})();
__SANTIS__.enforcer = SantisEnforcer;

/* ─── 9. KERNEL BOOT SEQUENCE ────────────────────────────────────────────── */
async function kernelBoot() {
    performance.mark('santis-kernel-start'); // 📊 Boot ölçümü başlat
    const t0 = __SANTIS__.bootTime;
    const log = (msg) => console.log(
        `%c🧠 [Kernel v3] ${msg} +${Math.round(performance.now() - t0)}ms`,
        'color:#d4af37;font-family:monospace;'
    );

    // Çift boot koruması
    if (window.__SANTIS_KERNEL_BOOTED__) return;
    window.__SANTIS_KERNEL_BOOTED__ = true;

    // Safe mode fail-safe: 5sn içinde kernel hazır olmazsa
    const safeTimer = setTimeout(() => {
        if (!__SANTIS__.flags.kernelReady) {
            activateSafeMode('Boot timeout (5000ms)');
        }
    }, 5000);

    try {
        log('Boot Sequence Initiated');

        // T+0ms: Servisler
        __SANTIS__.services.scheduler = SantisScheduler;
        __SANTIS__.services.bus       = SantisEventBus;
        log('Scheduler + EventBus ✓');

        // ── SOVEREIGN WORKER FABRIC (Otonom Proxy Köprüsü) ────────────────────────────────────
        // Geliştirici arka planda Worker mı var, Comlink mi var bilmek zorunda değil.
        // Sadece "await window.SovereignAI.filterCatalog()" der ve Proxy gerisini halleder.
        
        window.SovereignAI = (() => {
            let enginePromise = null;

            // 🛑 ZIRH: Eğer tarayıcı Worker'ı engellerse (AdBlocker, CSP vb.) sistem ÇÖKMESİN diye yedek motor.
            const fallbackEngine = {
                ping: async () => 'FALLBACK_MODE (Main Thread)',
                analyzeIntent: async () => ({ score: 50, tier: 'STANDARD', intent: 'BROWSING', actions: { prefetch: [] } }),
                filterCatalog: async (catalog, categoryId = '', limit = 50) => {
                    let result = Array.isArray(catalog) ? [...catalog] : [];
                    if (categoryId) {
                        const searchCat = categoryId.toLowerCase();
                        result = result.filter(item => (item.categoryId || item.category || '').toLowerCase().includes(searchCat));
                    }
                    result.sort((a, b) => {
                        if (a.featured && !b.featured) return -1;
                        if (!a.featured && b.featured) return 1;
                        return (a.name || '').localeCompare(b.name || '', 'tr');
                    });
                    return result.slice(0, limit);
                }
            };

            const bootFabric = () => {
                if (!enginePromise) {
                    enginePromise = new Promise((resolve) => {
                        // Arka planda (idle) yükle, Ana İş Parçacığını meşgul etme
                        const scheduler = (typeof SantisScheduler !== 'undefined' && SantisScheduler.idle) 
                            ? SantisScheduler.idle 
                            : (cb) => (window.requestIdleCallback || setTimeout)(cb);

                        scheduler(async () => {
                            try {
                                const { wrap } = await import('https://unpkg.com/comlink/dist/esm/comlink.mjs');
                                const aiWorker = new Worker(
                                    new URL('../workers/santis-ai.worker.js', import.meta.url),
                                    { type: 'module' }
                                );
                                const proxyEngine = wrap(aiWorker);
                                
                                if (typeof __SANTIS__ !== 'undefined' && __SANTIS__.workers) {
                                    __SANTIS__.workers.set('ai', proxyEngine);
                                }
                                
                                const pong = await proxyEngine.ping();
                                console.log(`🌌 [Worker Fabric] Kuantum Köprüsü Kuruldu: ${pong}`);
                                
                                if (typeof SantisEventBus !== 'undefined' && SantisEventBus.emit) {
                                    SantisEventBus.emit('kernel:worker-ready', { name: 'ai' });
                                }
                                resolve(proxyEngine);
                            } catch (e) {
                                console.warn('🚨 [Worker Fabric] AI Worker başlatılamadı. Fallback devrede:', e.message);
                                resolve(fallbackEngine); // Çökmeyi engelle, Main Thread yedeğine dön
                            }
                        });
                    });
                }
                return enginePromise;
            };

            // Sayfa açılır açılmaz arka planda motoru ısıt (Pre-warm)
            bootFabric();

            // 🛡️ AKILLI PROXY MİMARİSİ: Sayfa yüklendiği 1. milisaniyede fonksiyon çağrılsa bile,
            // hata fırlatmaz. Worker'ın yüklenmesini havada bekler ve yanıtı döndürür! (Zero-Friction)
            return new Proxy({}, {
                get(target, prop) {
                    return async (...args) => {
                        const engine = await bootFabric();
                        return await engine[prop](...args);
                    };
                }
            });
        })();
        // ───────────────────────────────────────────────────────────────────

        // T+10ms: Render Engine (GPU)
        SantisScheduler.high(async () => {
            await resolveModule('render');
            log('Render Engine ✓');
        });

        // T+20ms: Data Bridge
        SantisScheduler.high(async () => {
            await resolveModule('data');
            log('Data Bridge ✓');
        });

        // T+25ms: Biometric UX Layer (Santis Soul Engine)
        SantisScheduler.high(async () => {
            try {
                await import('/assets/js/core/santis-soul.js');
                log('Soul Engine ✓');
            } catch (e) {
                console.warn('Soul Engine bypassed:', e);
            }
        });

        // T+30ms: Interaction Engine (UI efektleri, Living Card, Modal)
        SantisScheduler.high(async () => {
            await resolveModule('interaction');
            log('Interaction Engine ✓');
        });

        // T+35ms: Page Router (data load, service catalog)
        SantisScheduler.high(async () => {
            await resolveModule('router');
            log('Page Router ✓');
        });

        // T+40ms: UI Matrix (render + interaction a bağlı)
        SantisScheduler.high(async () => {
            const page = document.body?.dataset?.page || '';
            const matrixPages = ['massage', 'hamam', 'hammam', 'skincare', 'rituals', 'index'];
            if (matrixPages.includes(page)) {
                await resolveModule('ui');
                log('UI Matrix ✓');
            }
        });

        // Kernel Hazır
        clearTimeout(safeTimer);
        __SANTIS__.flags.kernelReady = true;
        document.documentElement.classList.add('app-ready');

        // 📊 Boot süresi ölçümünü kaydet
        performance.mark('santis-kernel-ready');
        performance.measure('kernel-boot', 'santis-kernel-start', 'santis-kernel-ready');
        const measured = performance.getEntriesByName('kernel-boot')[0];
        log(`✅ KERNEL READY — ${Math.round(measured.duration)}ms`);

        SantisEventBus.emit('kernel:ready', { bootMs: Math.round(measured.duration) });

        // T+100ms: Neural Runtime — Idle'da başlat
        SantisScheduler.idle(() => {
            NeuralRuntime.start();
            log('Neural Runtime ✓');
        });

        // Shadow Clusters — Scroll/Idle tetikli
        const wakeShado = async () => {
            await resolveModule('commerce');
            await resolveModule('experience');
            await resolveModule('analytics');
            log('Shadow Clusters ✓');
        };
        window.addEventListener('scroll', wakeShado, { passive: true, once: true });
        if ('requestIdleCallback' in window) {
            requestIdleCallback(wakeShado, { timeout: 3000 });
        } else {
            setTimeout(wakeShado, 3000);
        }

    } catch (error) {
        clearTimeout(safeTimer);
        activateSafeMode(error.message);
    }
}

/* ─── 10. LAUNCH ──────────────────────────────────────────────────────────── */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', kernelBoot);
} else {
    kernelBoot();
}

/* ─── 11. PUBLIC API ─────────────────────────────────────────────────────── */
export { SantisScheduler, SantisEventBus, SantisEnforcer, resilientImport, resolveModule, NeuralRuntime };

// Default export: bootloader'dan SantisKernel.boot() ile çağrılır
export default { boot: kernelBoot };


/**
 * SANTIS OS - PHASE 58: MAIN THREAD SENSOR ARRAY
 * Görev: Veri toplama, Worker yönetimi ve UI Render tetikleme
 */

class SantisSensors {
    constructor() {
        if (!window.__SANTIS_AI_WORKER__) {
            window.__SANTIS_AI_WORKER__ = new Worker('/santis-ai.worker.js');
        }
        this.aiWorker = window.__SANTIS_AI_WORKER__;
        this.lastIntent = null;

        this.initCommunication();
        this.bootAI();
        this.startSensors();
    }

    initCommunication() {
        this.aiWorker.onmessage = (e) => {
            const { type, ...data } = e.data;

            switch(type) {
                case 'INTENT_DETECTED':
                    if (this.lastIntent !== data.intent) {
                        this.lastIntent = data.intent;
                        console.log(`[Phase 58] ⚡ Kuantum Hedef Kilitlendi: ${data.intent} (Güven: %${(data.confidence*100).toFixed(1)})`);
                        window.dispatchEvent(new CustomEvent('santis:intent', { detail: data.intent }));
                    }
                    break;
                case 'WEIGHTS_UPDATED':
                    localStorage.setItem('santis_neural_weights', JSON.stringify(data.weights));
                    break;
                case 'DATASET_READY':
                    window.dispatchEvent(new CustomEvent('santis:dataset_ready', { detail: data.dataset }));
                    break;
                case 'CRITICAL_ERROR':
                    console.error("🔴 GOD'S EYE PING:", data.message);
                    break;
                case 'LOG':
                    console.log(`[AI Worker] ${data.message}`);
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
