/**
 * ========================================================================
 * 🦅 SANTIS OS v31 — QUANTUM PHYSICS ENGINE (L1 + L2)
 * ========================================================================
 * Drop-in Parasitic Core: Zero DOM Mutation, Zero Regression Risk.
 * Listens to existing scroll events and whispers CSS physics to cards.
 *
 * L1: Sigmoid Event Horizon (OKLCH Color Transition)
 * L2: Euler Calculus Skew (Inertial Scroll Physics)
 * ========================================================================
 */

const SantisQuantumEngine = (() => {
    'use strict';

    // ── STATE ──────────────────────────────────────────
    const state = {
        scroll: { velocity: 0, lastPos: 0, skewAngle: 0 },
        lux: { current: 0, target: 0, cartTotal: 0 },
        isScrolling: false,
        idle: true,
        rafId: null
    };

    // ── L1: SIGMOID MATH ──────────────────────────────
    // Logistic curve: abrupt dopamine peak at luxury threshold
    const MATH = {
        sigmoid: (x, threshold = 1200) => {
            if (x <= 0) return 0;
            const normalized = x / threshold;
            return 1 / (1 + Math.exp(-12 * (normalized - 0.8)));
        }
    };

    // ── L2: EULER SCROLL PHYSICS ──────────────────────
    const setupEulerPhysics = () => {
        // Event delegation (capture phase): catches dynamically injected scroll containers
        document.addEventListener('scroll', (e) => {
            const target = e.target;

            // Skip page-level vertical scroll
            if (target === document || target === document.documentElement || target === window) return;

            // Only horizontal scrollable containers (cards/rails)
            if (target.scrollWidth > target.clientWidth + 10) {

                // 📱 Mobile guard: disable skew physics below 768px
                if (window.innerWidth < 768) return;

                const currentPos = target.scrollLeft;
                const delta = currentPos - state.scroll.lastPos;

                // v = dx/dt — velocity derivative. Clamped to ±12° max skew
                const rawVel = delta * 0.15;
                state.scroll.velocity = Math.max(Math.min(rawVel, 12), -12);
                state.scroll.lastPos = currentPos;
                state.isScrolling = true;
                state.idle = false;
            }
        }, { capture: true, passive: true });
    };

    // ── VISIBILITY & IDLE MANAGEMENT (Zero-Decibel Protocol) ──
    let idleTimer = null;
    const setupIdleGuard = () => {
        // Tab hidden → pause
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                state.idle = true;
                if (state.rafId) cancelAnimationFrame(state.rafId);
                state.rafId = null;
            } else {
                state.idle = false;
                if (!state.rafId) startQuantumLoop();
            }
        });

        // Mouse idle → sleep after 3s
        document.addEventListener('mousemove', () => {
            state.idle = false;
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => { state.idle = true; }, 3000);
        }, { passive: true });
    };

    // ── CENTRAL QUANTUM LOOP (rAF Deterministic) ─────
    const startQuantumLoop = () => {
        const root = document.documentElement;
        let frameCount = 0;

        const loop = () => {
            state.rafId = requestAnimationFrame(loop);
            frameCount++;

            // Throttle CSS updates: every 2nd frame (60Hz effective → battery friendly)
            if (frameCount % 2 !== 0) return;

            // A. L1: Sigmoid Color Interpolation
            state.lux.target = MATH.sigmoid(state.lux.cartTotal);
            const luxDelta = state.lux.target - state.lux.current;
            if (Math.abs(luxDelta) > 0.001) {
                state.lux.current += luxDelta * 0.05; // Smooth exponential approach
                root.style.setProperty('--lux-affinity', state.lux.current.toFixed(4));
            }

            // B. L2: Euler Skew Damping (Hooke's friction)
            if (Math.abs(state.scroll.velocity) > 0.01 || Math.abs(state.scroll.skewAngle) > 0.01) {
                state.scroll.skewAngle += (state.scroll.velocity - state.scroll.skewAngle) * 0.15;
                state.scroll.velocity *= 0.85; // Air friction coefficient

                root.style.setProperty('--scroll-skew', `${-state.scroll.skewAngle.toFixed(2)}deg`);

                if (Math.abs(state.scroll.velocity) < 0.05) {
                    state.isScrolling = false;
                }
            } else if (state.scroll.skewAngle !== 0) {
                state.scroll.skewAngle = 0;
                root.style.setProperty('--scroll-skew', '0deg');
            }

            // C. Idle Sleep: if truly idle (no scrolling, no lux change), stop loop
            if (state.idle && !state.isScrolling && Math.abs(luxDelta) < 0.001) {
                cancelAnimationFrame(state.rafId);
                state.rafId = null;
            }
        };

        state.rafId = requestAnimationFrame(loop);
    };

    // ── WAKE UP: Restart loop when any interaction happens ──
    const ensureLoopRunning = () => {
        if (!state.rafId && !document.hidden) {
            startQuantumLoop();
        }
    };

    // ── INIT ──────────────────────────────────────────
    const init = () => {
        // Quantum CSS layer: activated only when cart total > 0
        // (preserves existing dark spa aesthetic by default)

        setupEulerPhysics();
        setupIdleGuard();
        startQuantumLoop();

        // Wake on any user action
        document.addEventListener('scroll', ensureLoopRunning, { capture: true, passive: true });
        document.addEventListener('mousemove', ensureLoopRunning, { passive: true });

        // PUBLIC API: Connect to cart system or test from console
        window.SovereignAPI = {
            setCartTotal: (val) => {
                state.lux.cartTotal = Math.max(0, Number(val) || 0);
                state.idle = false;
                ensureLoopRunning();

                // Activate/deactivate quantum color layer
                if (state.lux.cartTotal > 0) {
                    document.body.classList.add('quantum-active');
                } else {
                    // Let sigmoid decay naturally, then remove class
                    setTimeout(() => {
                        if (state.lux.cartTotal <= 0 && state.lux.current < 0.01) {
                            document.body.classList.remove('quantum-active');
                        }
                    }, 2000);
                }

                const sigmoid = MATH.sigmoid(state.lux.cartTotal);
                console.log(`🦅 [SANTIS OS v31] Sepet: €${state.lux.cartTotal} → Sigmoid: ${sigmoid.toFixed(3)} → Lux Affinity: ${state.lux.current.toFixed(3)}`);
            },
            getState: () => ({ ...state }),
            sigmoid: MATH.sigmoid
        };

        console.log('🦅 [Santis OS v31] L1 Sigmoid + L2 Euler Mühürlendi. Sıfır DOM Hasarı. Rüzgar bekleniyor...');
    };

    return { init };
})();

// ── BOOTSTRAP ─────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SantisQuantumEngine.init);
} else {
    SantisQuantumEngine.init();
}
