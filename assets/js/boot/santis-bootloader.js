/* ==========================================================================
   🦅 SANTIS OS V8 OMEGA — DETERMINISTIC BOOTLOADER
   The Great Pruning: 51 → 15 Super-Cluster Architecture
   ========================================================================== */

(function() {
    // 🛡️ V37 EXECUTION GOVERNOR
    if (window.__SANTIS_BOOT_ACTIVE__) {
        console.warn("🛑 [BOOT BLOCKED] Duplicate boot prevented by V37.");
        return;
    }
    window.__SANTIS_BOOT_ACTIVE__ = true;

    // 🛡️ V40 APEX SURVIVAL TRIGGER (GLOBAL HALT)
    if (performance.memory?.usedJSHeapSize > 220000000) {
        console.warn("🛑 [V40] Apex Survival Triggered (Memory Breach). System Halting.");
        return;
    }

    // 🛡️ V39.1 REAL APM: Long Task Detection with Source Attribution
    if ('PerformanceObserver' in window) {
        try {
            const longTaskObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    const culprit = entry.attribution?.[0]?.name || "unknown";
                    console.warn(`🔥 [V39.1 APM] Long Task (${entry.duration.toFixed(2)}ms) →`, culprit);
                    if(window.Santis) window.Santis.APM_WARN = entry.duration;
                });
            });
            longTaskObserver.observe({ entryTypes: ["longtask"] });
        } catch(e) {}
    }

    // 🛡️ V39.1 ADAPTIVE SCHEDULER: Gradual Degradation
    let pressureLevel = 0;
    let lastFrameTime = performance.now();
    function updatePressure(now) {
        const delta = now - lastFrameTime;
        lastFrameTime = now;
        if (delta > 32) pressureLevel = 3;
        else if (delta > 24) pressureLevel = 2;
        else if (delta > 16) pressureLevel = 1;
        else pressureLevel = 0;
    }

    // 🛡️ V38 OMNI-SCHEDULER: Global Read/Write Batching
    window.SantisDOM = {
        reads: [], writes: [], scheduled: false,
        read(fn) { this.reads.push(fn); this.schedule(); },
        write(fn) { this.writes.push(fn); this.schedule(); },
        schedule() {
            if (this.scheduled) return;
            this.scheduled = true;
            requestAnimationFrame((now) => {
                updatePressure(now);
                const reads = this.reads.slice(); const writes = this.writes.slice();
                this.reads.length = 0; this.writes.length = 0; this.scheduled = false;
                
                this.phase = "read";
                reads.forEach(fn => { try { fn(); } catch(e) {} });

                this.phase = "write";
                if (pressureLevel >= 2 && writes.length > 0) {
                    this.writes.push(...writes);
                    this.schedule();
                } else {
                    writes.forEach(fn => { try { fn(); } catch(e) {} });
                }
                this.phase = "idle";
            });
        }
    };
    
    // 🛡️ V39.2 FORCE REFLOW KATİLİ (GLOBAL PATCH)
    const originalGetBounding = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function() {
        if (window.SantisDOM && window.SantisDOM.phase === "write") {
            console.warn("⚠️ [V39.2] Forced layout read blocked!");
            return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
        }
        return originalGetBounding.apply(this);
    };

    // 🛡️ V39.2 API CLIENT HARD GUARD
    window.apiClient = window.apiClient || {
        apiFetch: function() { console.warn("⚠️ [V39.2] API Client not ready, skipping apiFetch..."); return Promise.resolve(); }
    };
    window.SantisCore = window.SantisCore || window.apiClient;

    window.__SANTIS_MODULE_STATE__ = window.__SANTIS_MODULE_STATE__ || { bootloader: "loaded" };
    window.__SANTIS_PERFORMANCE_METRICS__ = window.__SANTIS_PERFORMANCE_METRICS__ || {};

    // 🛡️ CRASH SHIELD (Browser): Hiçbir JS hatası sayfayı çökertemez
    window.addEventListener('error', (e) => {
        console.error(`🚨 [CRASH SHIELD] JS Error yakalandı: ${e.message} (${e.filename}:${e.lineno})`);
        e.preventDefault(); // Hatanın yayılmasını engelle
    });
    window.addEventListener('unhandledrejection', (e) => {
        if (e.reason && e.reason.name === "AbortError") {
            e.preventDefault();
            return;
        }
        console.error('🚨 [CRASH SHIELD] Promise Rejection yakalandı:', e.reason);
        e.preventDefault();
    });

    async function igniteSantisOS() {
        if (window.__SANTIS_BOOT_COMPLETED__) {
            console.warn('⚠️ [V8 OMEGA] Boot zaten tamamlandı — çift çağrı engellendi.');
            return;
        }

        const t0 = performance.now();
        let page = document.body?.dataset?.page;
        if (!page) {
            page = location.pathname.includes("hq-dashboard") || location.pathname.includes("/admin") ? "admin" : "public";
        }
        const surface = page === "admin" ? "ADMIN_HQ" : page.toUpperCase();

    console.log(
        "%c🦅 [V8 OMEGA] Deterministic Boot Sequence Initiated...",
        "color: #d4af37; font-weight: bold; background: #050505; padding: 4px 10px; border: 1px solid #d4af37;"
    );
    console.log(`%c⏱️ [T+0ms] Cephe: ${surface}`, "color: #3b82f6");

    // ── Sovereign Global State ────────────────────────────────────────────────
    window.Santis = window.Santis || {
        State: { page, scroll: 0 },
        Workers: {},
        Engines: {},
        UI: {}
    };

    // ══════════════════════════════════════════════════════════════════════
    // 🛡️ FAIL-SAFE: 3 saniye içinde boot tamamlanmazsa perdeyi yine de aç!
    // CSS'teki html:not(.app-ready) body { visibility: hidden } kuralını
    // her halükarda kaldırır — kara ekran ASLA kalıcı olamaz.
    // ══════════════════════════════════════════════════════════════════════
    const failSafeTimer = setTimeout(() => {
        if (!document.documentElement.classList.contains('app-ready')) {
            console.warn("⚠️ [V8 OMEGA] FAIL-SAFE: Boot 3s'de tamamlanamadı — perde zorla kaldırılıyor!");
            document.documentElement.classList.add('app-ready');
        }
    }, 3000);

    // ── waitForPaint: Tarayıcının ilk pikseli çizdiği ana kadar bekle ─────────
    function waitForPaint() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') return requestAnimationFrame(resolve);
            let resolved = false;
            const done = () => { if (!resolved) { resolved = true; resolve(); } };
            if ('PerformanceObserver' in window) {
                try {
                    const po = new PerformanceObserver((list) => {
                        if (list.getEntries().length > 0) { po.disconnect(); done(); }
                    });
                    po.observe({ type: 'paint', buffered: true });
                    setTimeout(() => { po.disconnect(); done(); }, 250); // Güvenlik ağı
                } catch { done(); }
            } else {
                requestAnimationFrame(() => requestAnimationFrame(done)); // Eski tarayıcı fallback
            }
        });
    }

    try {
        // ══════════════════════════════════════════════════════════════════════
        // FAZ 0: SANTIS OS v3 KERNEL BOOT (Non-blocking, paralel)
        // ══════════════════════════════════════════════════════════════════════
        import('/assets/js/core/santis-core.js?v=V3')
            .then(m => m.default?.boot?.())
            .catch(e => console.error('[V8 OMEGA] Kernel import failed (non-fatal):', e));

        // ══════════════════════════════════════════════════════════════════════
        // FAZ 0.6: GLOBAL MODULE AUTONOMY REGISTRY (V36 GOVERNANCE)
        // ══════════════════════════════════════════════════════════════════════
        window.__SANTIS_VERSION__ = window.__SANTIS_VERSION__ || 'v36.0';

        const SOVEREIGN_REGISTRY = [
            {
                id: 'api',
                selectors: ['body'], // Her zaman yükle
                dependencies: ['/assets/js/api-client.js'],
                loaded: !!window.SantisApi
            },
            {
                id: 'nav',
                selectors: ['#navbar-container', '#santis-main-nav'],
                dependencies: ['/assets/js/loader.js', '/assets/js/santis-nav.js'],
                loaded: window.__SANTIS_NAV_READY__ || false
            },
            {
                id: 'bento',
                selectors: ['#santis-bento-universe'],
                dependencies: ['/assets/js/core/bento-orchestrator.js'],
                loaded: false
            },
            {
                id: 'checkout',
                selectors: ['#checkout-ritual', '.santis-checkout'],
                dependencies: ['/assets/js/core/checkout-ritual.js'],
                loaded: false
            },
            {
                id: 'interaction',
                selectors: ['video.santis-player', '[data-santis-modal]', '.santis-magnetic'],
                dependencies: ['/assets/js/modules/interaction-engine.js?v=V51_GHOST14'],
                loaded: false
            },
            {
                id: 'concierge',
                selectors: ['#santis-concierge', '#concierge-trigger'],
                dependencies: ['/assets/js/core/sovereign-concierge.js'],
                loaded: false
            },
            {
                id: 'cognitive',
                selectors: ['body'],
                dependencies: ['/assets/js/core/santis-cognitive-governor.js'],
                loaded: false
            },
            {
                id: 'aurelia',
                selectors: ['body'],
                dependencies: ['/assets/js/modules/aurelia/orb.ts'],
                isModule: true,
                loaded: false
            },
            {
                id: 'reveal',
                selectors: ['.sovereign-reveal-item'],
                dependencies: ['/assets/js/modules/santis-reveal-engine.js'],
                loaded: false
            },
            {
                id: 'atmosphere',
                selectors: ['body'],
                dependencies: ['/assets/js/modules/santis-atmosphere.js'],
                loaded: false
            },
            {
                id: 'vault',
                selectors: ['body'],
                dependencies: ['/assets/js/modules/santis-sovereign-vault.js'],
                isModule: true,
                loaded: false
            },
            {
                id: 'checkout-ceremony',
                selectors: ['body'],
                dependencies: ['/assets/js/modules/santis-checkout-ceremony.js'],
                isModule: true,
                loaded: false
            },
            {
                id: 'booking-modal',
                selectors: ['body'],
                dependencies: ['/assets/js/modules/santis-booking-modal.js'],
                isModule: true,
                loaded: false
            },
            {
                id: 'booking-availability',
                selectors: ['body'],
                dependencies: ['/assets/js/modules/santis-booking-availability.js'],
                isModule: true,
                loaded: false
            },
            {
                id: 'journey',
                selectors: ['body'],
                dependencies: ['/assets/js/modules/santis-journey-orchestrator.js'],
                loaded: false
            }
        ];

        const getBackendUrl = () => {
            const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
            return isLocal ? "http://127.0.0.1:3030/api/v1" : "/api/v1";
        };

        function dispatchTelemetry(level, message) {
            // Background telemetry dispatch (fire and forget)
            const endpoint = `${getBackendUrl()}/telemetry/beacon`;
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    event: 'BOOTLOADER_EVENT',
                    ts: new Date().toISOString(),
                    context: { tenantId: 'santis-club', sessionId: 'boot', source: window.location.pathname },
                    meta: { level, message }
                }),
                keepalive: true
            }).catch(() => {});
        }

        function loadScriptV36(src, isModule = false) {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src*="${src}"]`)) {
                    resolve();
                    return;
                }
                const s = document.createElement('script');
                s.src = src;
                if (isModule || src.endsWith('.ts')) s.type = 'module';
                s.defer = true;
                s.onload = resolve;
                s.onerror = reject;
                document.head.appendChild(s);
            });
        }

        // 🧬 V40 DECISION MATRIX (SAFE VERSION)
        window.__SANTIS_DECISION_MATRIX__ ??= {
            reveal: { priority: 110, critical: true },
            vault: { priority: 109, critical: true },
            "checkout-ceremony": { priority: 108, critical: true },
            "booking-modal": { priority: 107, critical: true },
            "booking-availability": { priority: 106, critical: true },
            journey: { priority: 105, critical: true },
            atmosphere: { priority: 104, critical: true },
            nav: { priority: 100, critical: true },
            checkout: { priority: 90, critical: true },
            bento: { priority: 70, critical: true },
            interaction: { priority: 60 },
            concierge: { priority: 50 },
            cognitive: { priority: 40 }
        };

        // ⚖️ V40.1 POLICY REGISTRY (ANAYASA)
        window.__SANTIS_POLICIES__ = [
            {
                name: "EU_AI_ACT_2026_COMPLIANCE",
                priority: 2000,
                condition: (ctx) => {
                    try {
                        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                        const isEU = tz && tz.includes('Europe');
                        const isDashboard = window.location.pathname.includes('/admin');
                        return isEU || isDashboard;
                    } catch(e) { return false; }
                },
                action: "enforce_fatigue_mode_only"
            },
            {
                name: "VIP_OVERRIDE",
                priority: 1000,
                condition: (ctx) => ctx.user?.vip === true,
                action: "force_load"
            },
            {
                name: "HIGH_MEMORY_PROTECTION",
                priority: 900,
                condition: (ctx) => ctx.memory > 220000000,
                action: "defer_non_critical"
            },
            {
                name: "LOW_CPU_MODE",
                priority: 500,
                condition: (ctx) => ctx.cpuPressure > 2,
                action: "defer_non_critical"
            }
        ];
        
        // 🛡️ Seal Attack Surface
        Object.freeze(window.__SANTIS_POLICIES__);

        // ⚙️ V40 SYSTEM CONTEXT
        function getSystemContext() {
            return {
                memory: performance.memory?.usedJSHeapSize || 0,
                cpuPressure: pressureLevel || 0,
                fpsDrop: pressureLevel >= 2,
                hidden: document.hidden
            };
        }

        // 🧾 V41 GOVERNANCE & OBSERVABILITY CORE
        window.__SANTIS_DECISION_LOG__ ??= [];
        window.__SANTIS_POLICY_STATS__ ??= {};
        window.__SANTIS_POLICY_SANDBOX__ = false;

        function logDecision(name, decision, meta) {
            const entry = { module: name, decision, meta, time: performance.now() };
            window.__SANTIS_DECISION_LOG__.push(entry);
            if (window.__SANTIS_DECISION_LOG__.length > 200) {
                window.__SANTIS_DECISION_LOG__.shift();
            }
            
            // 📡 V42 Telemetry Bridge (Fire & Forget)
            if (navigator.sendBeacon) {
                const endpoint = typeof getBackendUrl !== "undefined" ? `${getBackendUrl()}/telemetry/decision` : '/api/v1/telemetry/decision';
                navigator.sendBeacon(endpoint, JSON.stringify({
                    module: name, decision: decision, meta: meta, time: Date.now()
                }));
            }
        }

        function trackPolicy(name) {
            const stats = window.__SANTIS_POLICY_STATS__;
            stats[name] = (stats[name] || 0) + 1;
        }

        // 🧠 V41 POLICY RESOLVER (TRACE ENABLED)
        function resolvePolicy(ctx, moduleName) {
            const policies = window.__SANTIS_POLICIES__
                .filter(p => p.condition(ctx))
                .sort((a, b) => b.priority - a.priority);
            
            const winner = policies[0] || null;
            const mod = window.__SANTIS_DECISION_MATRIX__[moduleName];

            if (winner) {
                if (!mod || mod.lastPolicy !== winner.name) {
                    console.info(`⚖️ [Policy Trace] [${winner.name}] applied to -> [${moduleName}]`);
                    trackPolicy(winner.name);
                    if (mod) mod.lastPolicy = winner.name;
                }
            } else {
                if (mod && mod.lastPolicy) mod.lastPolicy = null;
            }
            return winner;
        }

        // ⚖️ V41 SHOULD LOAD HOOK (GOVERNED)
        function shouldLoadModule(name) {
            const matrix = window.__SANTIS_DECISION_MATRIX__;
            const mod = matrix[name];
            if (!mod) return true;
            
            // 1. Generate Omni-Context
            const ctx = {
                ...getSystemContext(),
                user: window.__SANTIS_USER__ || { vip: sessionStorage.getItem('santis_vip') === 'true' }
            };

            // 2. Apex Survival (Absolute Layer 0 Override - Bumped to 300MB for Rich Experience)
            if (ctx.memory > 300000000) {
                if (!mod.critical) {
                    console.warn(`🛑 [V41.1] System Halt (Apex Memory Breach) deferring: ${name}`);
                    logDecision(name, "apex_halt", { memory: ctx.memory });
                    return false;
                } else {
                    console.warn(`🛡️ [V41.1] Graceful Degradation: Apex Shield bypassed for critical core node [${name}]`);
                    logDecision(name, "apex_bypassed_critical", { memory: ctx.memory });
                }
            }

            let score = mod.priority;

            // 3. V41 Policy Resolution (Constitutional Logic & Sandbox)
            const policy = resolvePolicy(ctx, name);
            if (policy) {
                if (window.__SANTIS_POLICY_SANDBOX__) {
                    console.warn(`🧪 [Sandbox] Policy simulated: [${policy.name}] for [${name}]`);
                    logDecision(name, "sandbox_simulated", { policy: policy.name });
                } else {
                    switch (policy.action) {
                        case "force_load":
                            logDecision(name, "policy_override", { policy: policy.name, action: "force_load" });
                            return true;
                        case "block_all":
                            logDecision(name, "policy_override", { policy: policy.name, action: "block_all" });
                            return false;
                        case "defer_non_critical":
                            if (!mod.critical) {
                                logDecision(name, "policy_override", { policy: policy.name, action: "defer_non_critical" });
                                return false;
                            }
                            break;
                    }
                }
            }

            // 4. Fallback Decision Engine (Scoring Logic)
            if (ctx.cpuPressure > 2) score -= 40;
            if (ctx.memory > 180000000) score -= 30;
            if (ctx.fpsDrop) score -= 50;
            if (ctx.hidden) score -= 20;

            if (mod.critical) score += 50;
            score += mod.__tempBoost || 0;

            // 5. Decision Debug & Return
            const finalDecision = score > 50;

            if (mod.lastScore !== score || mod.lastDecision !== finalDecision || mod.__tempBoost) {
                console.debug(`🧠 [Score Trace] [${name}] Final: ${score} | CPU: ${ctx.cpuPressure} | Mem: ${(ctx.memory/1e6).toFixed(1)}MB | Hidden: ${ctx.hidden}`);
                logDecision(name, finalDecision ? "load" : "skip", { score, ctx });
            }
            
            mod.lastScore = score;
            mod.lastDecision = finalDecision;
            
            return finalDecision;
        }

        // 📈 V40 LEARNING LAYER (STABLE)
        window.__SANTIS_MODULE_STATS__ ??= {};
        function trackModulePerformance(name, duration) {
            const stats = window.__SANTIS_MODULE_STATS__;
            if (!stats[name]) {
                stats[name] = { count: 0, avg: 0 };
            }
            
            const s = stats[name];
            s.count++;
            s.avg = ((s.avg * (s.count - 1)) + duration) / s.count;

            if (s.count > 3 && s.avg > 200) {
                const mod = window.__SANTIS_DECISION_MATRIX__[name];
                if (mod && !mod.__degraded) {
                    mod.priority -= 20;
                    mod.__degraded = true;
                    console.warn("🧠 [V40] Module degraded iteratively:", name);
                }
            }
        }

        // ⏱️ V40 LOAD HOOK (EN KRİTİK PARÇA)
        async function loadModuleOnce(name, loader) {
            window.__SANTIS_MODULE_STATE__ = window.__SANTIS_MODULE_STATE__ || {};
            const state = window.__SANTIS_MODULE_STATE__;

            // V3 Kernel Sync - If kernel already loaded it, stop phantom retries
            if (window.__SANTIS__ && window.__SANTIS__.modules && window.__SANTIS__.modules.has(name)) {
                state[name] = "loaded";
            }

            if (state[name] === "loaded" || state[name] === "loading") return;

            if (!shouldLoadModule(name)) {
                if (state[name] !== "skipped") {
                    if (window.SANTIS && window.SANTIS.debug) console.warn("🧠 [V40] Module skipped natively:", name);
                    state[name] = "skipped";
                }
                return;
            }

            state[name] = "loading";
            const t0 = performance.now();
            try {
                await loader();
                const t1 = performance.now();
                trackModulePerformance(name, t1 - t0);
                
                state[name] = "loaded";
                if(name === 'nav') window.__SANTIS_NAV_READY__ = true;
                
                console.log(`%c🛡️ [V40] Autonomous Injection: [${name}] (${(t1 - t0).toFixed(1)}ms)`, "color: #eab308; font-weight: bold;");
                dispatchTelemetry('HEAL', `Autonomy Injection: [${name}]`);
            } catch (e) {
                state[name] = "error";
                console.error("❌ [V40] Module failed:", name, e);
                dispatchTelemetry('WARN', `Failed to inject: [${name}]`);
            }
        }

        async function enforceSovereignModules() {
            for (const module of SOVEREIGN_REGISTRY) {
                let isPresent = false;
                for (const selector of module.selectors) {
                    if (document.querySelector(selector)) { 
                        isPresent = true; 
                        break; 
                    }
                }
                
                if (isPresent) {
                    await loadModuleOnce(module.id, async () => {
                        for (const src of module.dependencies) {
                            await loadScriptV36(src, module.isModule);
                        }
                    });
                }
            }
        }

        // 1. Initial Organ Scan
        enforceSovereignModules();

        // 2. Continuous Health Check (V38 Runtime Governance Loop)
        setInterval(() => {
            const navContainer = document.getElementById('navbar-container');
            const mainNav = document.getElementById('santis-main-nav');
            if (navContainer && !navContainer.hasChildNodes() && !mainNav) {
                console.warn('⚠️ [V38] Critical Organ Loss (Nav) → healing...');
                dispatchTelemetry('CRIT', 'Critical Organ Loss Detected');
                window.__SANTIS_MODULE_STATE__['nav'] = "error";
                window.__SANTIS_NAV_READY__ = false;
            }
            if (performance.memory && performance.memory.usedJSHeapSize > 200000000) {
                console.warn(`⚠️ [V38] Memory pressure detected: ${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
                dispatchTelemetry('WARN', 'Memory pressure detected');
            }
            enforceSovereignModules();
        }, 5000);

        // 🛡️ V39.1 PREDICTIVE HEAL QUEUE
        const healQueue = new Set();
        function schedulePreHeal(moduleId) {
            if (healQueue.has(moduleId)) return;
            console.log(`%c🚀 [V39.1] Pre-Heal Scheduled via Vector Prediction: [${moduleId}]`, "color: #06b6d4");
            healQueue.add(moduleId);
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    enforceSovereignModules();
                    healQueue.delete(moduleId);
                });
            } else {
                setTimeout(() => { enforceSovereignModules(); healQueue.delete(moduleId); }, 150);
            }
        }

        // 3. SPA Mutation Observer (Watch for new organs)
        let observerTimer = null;
        const v36Observer = new MutationObserver((mutations) => {
            if (pressureLevel === 3) return; // V39.1 Adaptive Throttle: CPU Stressed
            if (observerTimer) return;

            // Kinetik animasyonların (Carousel vb.) 60FPS tarama tetiklemesini engelle (Debounce 1s)
            observerTimer = setTimeout(() => {
                enforceSovereignModules();
                observerTimer = null;
            }, 1000);
        });
        v36Observer.observe(document.body, { childList: true, subtree: true });

        // ══════════════════════════════════════════════════════════════════════
        // FAZ 0.7: ADAPTIVE PREFETCH ENGINE (V36 COGNITION)
        // ══════════════════════════════════════════════════════════════════════
        const PREFETCH_REGISTRY = [
            { trigger: '.santis-checkout-btn, a[href*="checkout"]', script: '/assets/js/core/checkout-ritual.js' },
            { trigger: '[data-santis-modal]', script: '/assets/js/modules/interaction-engine.js?v=V51_GHOST14' },
            { trigger: '.santis-bento-link, #santis-bento-universe', script: '/assets/js/core/bento-orchestrator.js' },
            { trigger: 'a[href*="rezervasyon"]', script: '/assets/js/modules/reservation-engine.js' }
        ];

        // 🎯 V40 VECTOR INTENT FUSION
        function applyIntentBoost(name, confidence) {
            if (confidence < 0.7) return;
            const mod = window.__SANTIS_DECISION_MATRIX__[name];
            if (!mod) return;
            
            mod.__tempBoost = 30;
            setTimeout(() => { mod.__tempBoost = 0; }, 2000);
        }

        let prefetchedScripts = new Set();
        let lastMoves = [];
        
        function getDirectionConfidence(moves) {
            if (moves.length < 3) return 0;
            const dx1 = moves[1].x - moves[0].x;
            const dx2 = moves[2].x - moves[1].x;
            return (Math.sign(dx1) === Math.sign(dx2) && dx1!==0) ? 1 : 0.5;
        }

        function cognitivePrefetch(e) {
            if(e.type === 'mousemove') {
                lastMoves.push({ x: e.clientX, y: e.clientY, t: performance.now() });
                if (lastMoves.length > 5) lastMoves.shift();
            }

            const target = e.target.closest('a, button, [data-santis-modal], .santis-checkout-btn');
            if (!target) return;

            const confidence = getDirectionConfidence(lastMoves);
            if (e.type === 'mousemove' && confidence < 0.8) return; // Shield against jitter

            for (const item of PREFETCH_REGISTRY) {
                if (target.matches(item.trigger) && !prefetchedScripts.has(item.script)) {
                    // V40 Vector Fusion Matrix Boost
                    let targetMod = item.script.includes('checkout') ? 'checkout' : 
                                    item.script.includes('rezervasyon') ? 'interaction' : null;
                    if (targetMod) applyIntentBoost(targetMod, confidence);

                    // V39.1 Vector Pre-Healing Alignment
                    if (item.script.includes('checkout')) schedulePreHeal('checkout');
                    if (item.script.includes('rezervasyon')) schedulePreHeal('interaction');
                    
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = item.script;
                    link.as = 'script';
                    document.head.appendChild(link);
                    prefetchedScripts.add(item.script);
                    console.log(`%c🧠 [V40 Intent] Confidence: ${confidence.toFixed(1)} → Prefetching & Boosting: ${item.script.split('/').pop()}`, "color: #a855f7; font-style: italic;");
                    dispatchTelemetry('INFO', `Cognitive Prefetch: ${item.script.split('/').pop()}`);
                }
            }
        }

        document.body.addEventListener('mousemove', cognitivePrefetch, { passive: true });

        // ══════════════════════════════════════════════════════════════════════
        // FAZ 0.8: AUTONOMOUS SECURITY LAYER (V36 SHIELD)
        // ══════════════════════════════════════════════════════════════════════
        const TRUSTED_DOMAINS = [
            window.location.origin, 
            'chrome-extension:', 
            'https://js.stripe.com', 
            'https://www.googletagmanager.com',
            'https://connect.facebook.net'
        ];
        const shieldObserver = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.tagName === 'SCRIPT' || node.tagName === 'IFRAME') {
                        const src = node.src || '';
                        if (src && !src.startsWith('/') && !TRUSTED_DOMAINS.some(d => src.startsWith(d))) {
                            console.error(`🚨 [V36 Shield] Intrusion Quarantined: ${src}`);
                            node.remove();
                            dispatchTelemetry('CRIT', `Intrusion Quarantined: [${src.substring(0, 50)}]`);
                        }
                    }
                    if (node.tagName === 'SCRIPT' && !node.src) {
                        const txt = node.innerText || '';
                        if (txt.includes('eval(') || txt.includes('document.write')) {
                            console.error(`🚨 [V36 Shield] Malicious Inline Script Quarantined.`);
                            node.remove();
                            dispatchTelemetry('CRIT', `Inline Security Quarantine: eval/write detected`);
                        }
                    }
                }
            }
        });
        shieldObserver.observe(document.documentElement, { childList: true, subtree: true });

        // LCP GUARD — Sabit 300ms YOK. Tarayıcı paint edince devam et.
        await waitForPaint();

        // ══════════════════════════════════════════════════════════════════════
        // FAZ 1: GPU & MATRIX CORE — Görsel Çekirdek (Paralel Yükleme)
        // ══════════════════════════════════════════════════════════════════════
        const matrixPages = ['massage', 'hamam', 'hammam', 'skincare', 'rituals', 'index'];
        const isMatrixPage = matrixPages.includes(page);

        if (isMatrixPage) {
            console.log(`%c🧠 [T+${Math.round(performance.now() - t0)}ms] Kuantum Çekirdeği Ateşleniyor...`, "color: #10b981");
            window.Santis.Workers.Kernel = new Worker(
                '/assets/js/workers/kernel.worker.js?v=V8_OMEGA',
                { type: 'module' }
            );
            window.Santis.Workers.Kernel.postMessage({
                type: 'BOOT_SEQUENCE',
                payload: { page }
            });
        }

        // Modülleri aynı anda indir/işlet (Boot time optimizasyonu)
        const [GPU, CursorMode, MatrixUI] = await Promise.all([
            import('../engines/gpu-effects.js?v=V8_OMEGA').catch(() => null),
            import('../core/santis-cursor.js?v=V30_OMEGA').catch(() => null),
            isMatrixPage ? import('../ui/massage-matrix.js?v=V51_GHOST14').catch(() => null) : Promise.resolve(null)
        ]);

        if (GPU) window.Santis.Engines.GPU = GPU.init();

        // 👁️🗨️ [Phase 30] Sovereign Quantum Cursor Engine
        if (CursorMode && typeof CursorMode.SovereignCursor === 'function') {
            if (!document.querySelector('link[href*="santis.cursor.css"]')) {
                const styleLink = document.createElement('link');
                styleLink.rel = 'stylesheet';
                styleLink.href = '/assets/css/santis-v6/santis.cursor.css';
                document.head.appendChild(styleLink);
            }
            window.Santis.Engines.Cursor = new CursorMode.SovereignCursor();
        }

        // Kart dizilecek sayfalar için Matrix UI'ı boot et
        if (isMatrixPage && MatrixUI) {
            window.Santis.UI.Matrix = MatrixUI.init(window.Santis.Workers.Kernel);
        } else {
            // Statik sayfalarda opacity geçişi
            const arena = document.querySelector('.santis-matrix-container') || document.querySelector('main');
            if (arena) requestAnimationFrame(() => { arena.style.opacity = "1"; });
        }

        // ══════════════════════════════════════════════════════════════════════
        // 🎭 PERDEYİ AÇ — CSS visibility kilidini kaldır (app-ready)
        // ══════════════════════════════════════════════════════════════════════
        document.documentElement.classList.add('app-ready');
        clearTimeout(failSafeTimer);

        const bootTime = Math.round(performance.now() - t0);
        console.log(
            `%c🏆 [V8 OMEGA] BOOT COMPLETE IN ${bootTime}ms | Cephe: ${page.toUpperCase()}`,
            "color: #10b981; font-weight: bold; font-size: 12px;"
        );
        window.__SANTIS_BOOT_COMPLETED__ = true; // V37 Governor Flag

        // ══════════════════════════════════════════════════════════════════════
        // FAZ 2: GÖLGE KÜMELER (Idle/Scroll tetikli — ana işlemce rahatlayınca)
        // ══════════════════════════════════════════════════════════════════════
        scheduleShadowClusters(t0);

    } catch (error) {
        console.error("🚨 [V8 OMEGA] CRITICAL BOOT FAILURE:", error);
        // 🛡️ Hata durumunda bile perdeyi aç!
        document.documentElement.classList.add('app-ready');
        clearTimeout(failSafeTimer);
    }
}

// ── SHADOW CLUSTER BOOTSTRAP ────────────────────────────────────────────────
// Fizik + Ticaret motorlarını scroll VEYA idle anında sessizce yükler.
// İlk tetikten sonra diğer tetik iptal olur (Clone Wars önlemi).
function scheduleShadowClusters(t0) {
    let fired = false;

    // V37 SPAM INIT PREVENTION (Registry Lock)
    window.__SANTIS_MODULES__ = window.__SANTIS_MODULES__ || {};
    const loadModuleOnce = async (name, loader) => {
        if (window.__SANTIS_MODULES__[name]) return;
        window.__SANTIS_MODULES__[name] = true;
        await loader().catch(e => console.warn(`[V37 Governor] Failed to load module ${name}:`, e));
    };

    const wakeTheDead = async (trigger) => {
        if (fired) return;
        fired = true;

        console.log(`%c🌙 [T+${Math.round(performance.now() - t0)}ms] Gölge Kümeler Uyanıyor! Tetik: ${trigger}`, "color: #6b7280");
        
        const loadClusters = async () => {
            try {
                // 🟣 FİZİK KÜMESİ — Parçacık efektleri & animasyonlar
                await loadModuleOnce('quantum-engine', () => import('../core/quantum-engine.js?v=V8_OMEGA'));
                await loadModuleOnce('fibonacci-swarm', () => import('../core/fibonacci-swarm.js?v=V8_OMEGA'));

                // 🔵 TİCARET KÜMESİ — Checkout & wallet
                await loadModuleOnce('checkout-ritual', () => import('../core/checkout-ritual.js?v=V8_OMEGA'));
                await loadModuleOnce('wallet-bridge', () => import('../core/wallet-bridge.js?v=V8_OMEGA'));
                await loadModuleOnce('boutique-infection', () => import('../core/boutique-infection.js?v=V8_OMEGA'));

                // 🟠 DENEYİM KÜMESİ — Nöral detay & akustik
                await loadModuleOnce('neuro-detail', () => import('../core/neuro-detail.js?v=V8_OMEGA'));
                await loadModuleOnce('sovereign-acoustics', () => import('../core/sovereign-acoustics.js?v=V8_OMEGA'));

                // 🟢 İSTİHBARAT — Piksel & skor
                await loadModuleOnce('santis-pixel-engine', () => import('../santis-pixel-engine.js?v=V8_OMEGA'));
                await loadModuleOnce('santis-score-engine', () => import('../santis-score-engine.js?v=V8_OMEGA'));

                // 🛡️ SANTIS OS V34 KÜMESİ — Otonom Runtime & Adaptive Gelişmeler
                await loadModuleOnce('santis-self-healing', () => import('../core/santis-self-healing.js?v=V34_OMEGA'));
                await loadModuleOnce('santis-adaptive-ui', () => import('../core/santis-adaptive-ui.js?v=V34_OMEGA'));
                await loadModuleOnce('santis-quantum-jump', () => import('../core/santis-quantum-jump.js?v=V34_OMEGA'));

                // 🌐 SANTIS OS V35 SENSORY RESONANCE (T+3500ms)
                setTimeout(async () => {
                    await loadModuleOnce('santis-eco-zen', () => import('../core/santis-eco-zen.js?v=V35_OMEGA'));
                    await loadModuleOnce('santis-haptic-resonance', () => import('../core/santis-haptic-resonance.js?v=V35_OMEGA'));
                    await loadModuleOnce('santis-hypnagogic-protocol', () => import('../core/santis-hypnagogic-protocol.js?v=V35_OMEGA'));
                    console.log(`%c✨ [T+${Math.round(performance.now() - t0)}ms] V35 Duyusal Rezonans Çevrimiçi (Organik Boyutlar)`, "color: #d4af37");
                }, 1000);

                console.log(`%c✅ [T+${Math.round(performance.now() - t0)}ms] Tüm Gölge Kümeler Çevrimiçi`, "color: #10b981");
            } catch (e) { /* Sessiz hata yakalama */ }
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(loadClusters);
        } else {
            setTimeout(loadClusters, 1500);
        }
    };

    // 🅰️ SCROLL TETİĞİ
    window.addEventListener('scroll', () => wakeTheDead('SCROLL'), { passive: true, once: true });

    // 🅱️ IDLE TETİĞİ (2 saniye)
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => wakeTheDead('IDLE'), { timeout: 2000 });
    } else {
        setTimeout(() => wakeTheDead('IDLE_FALLBACK'), 2000);
    }
}

// 🌑 [V26] SOVEREIGN PWA INJECTION (Hayalet İşçi Uyanışı)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/santis-sw.js')
            .then((registration) => {
                console.log('🛡️ [PWA Zırhı] Shadow Worker devrede! Sovereign Kapsamı:', registration.scope);
            })
            .catch((error) => {
                console.error('🚨 [PWA Hatası] Gölge İşçi uyanamadı:', error);
            });
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// ⚔️ SİSTEMİ ATEŞLE — DOM hazır olduğu an boot et
// ══════════════════════════════════════════════════════════════════════════════
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', igniteSantisOS);
} else {
    igniteSantisOS();
}

})(); // End of V37 Execution Governor
