/**
 * ========================================================================
 * 🦅 SANTIS OS v33 — L4 FIBONACCI SWARM (Production Module) + L5 MORPH
 * ========================================================================
 * Drop-in GPU particle overlay. Zero DOM mutation. Zero regression risk.
 *
 * Architecture:
 *   - Creates <canvas> overlay (fixed, z-index:0, pointer-events:none)
 *   - Spawns Blob Web Worker with embedded Three.js
 *   - Transfers OffscreenCanvas to Worker → Main Thread never renders 3D
 *   - GPU Governor: Dynamic LOD (2500 ↔ 800) based on frame delta
 *   - Zero-Decibel Protocol: PAUSE on tab hidden / idle > 3s
 *   - Intent Bridge: CTA button proximity → swarm accelerates
 *   - L5 Morph: SEAL_RITUAL → sphere morphs into Living Ticket
 *
 * Mobile: Completely disabled below 768px (battery preservation)
 * ========================================================================
 */

const SantisFibonacciSwarm = (() => {
    'use strict';

    // ── Mobile guard ──
    if (window.innerWidth < 768) {
        console.log('🦅 [L4] Fibonacci Swarm: Mobil — devre dışı.');
        return { init: () => {}, sendCommand: () => {}, getCanvas: () => null };
    }

    let worker = null;
    let canvas = null;
    let idleTimer = null;
    let isPaused = false;

    // ── WORKER SOURCE (Blob Kernel with L5 Morph Support) ──
    const WORKER_SOURCE = `
        importScripts('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');

        let scene, camera, renderer, swarmMesh;
        let posSphere, posTicket;
        let STATE = {
            lod: 2500, lastTime: 0, frameCount: 0,
            intentActive: false, paused: false,
            mode: 'SWARM', morphProgress: 0
        };

        self.onmessage = function(e) {
            const d = e.data;
            switch(d.type) {
                case 'INIT':
                    initThreeJS(d.canvas, d.width, d.height, d.pixelRatio);
                    STATE.lastTime = performance.now();
                    masterLoop();
                    break;
                case 'TELEMETRY':
                    STATE.intentActive = d.intentActive || false;
                    break;
                case 'RESIZE':
                    if (camera && renderer) {
                        camera.aspect = d.width / d.height;
                        camera.updateProjectionMatrix();
                        renderer.setSize(d.width, d.height, false);
                    }
                    break;
                case 'PAUSE':
                    STATE.paused = true;
                    break;
                case 'RESUME':
                    if (STATE.paused) {
                        STATE.paused = false;
                        STATE.lastTime = performance.now();
                        STATE.frameCount = 0;
                        masterLoop();
                    }
                    break;
                case 'SEAL_RITUAL':
                    STATE.mode = 'TICKET';
                    STATE.paused = false;
                    break;
                case 'UNSEAL':
                    STATE.mode = 'SWARM';
                    STATE.morphProgress = 0;
                    if (swarmMesh) {
                        swarmMesh.material.size = 0.06;
                        swarmMesh.material.opacity = 0.35;
                    }
                    break;
            }
        };

        function initThreeJS(canvas, w, h, pr) {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
            camera.position.z = 35;
            renderer = new THREE.WebGLRenderer({
                canvas: canvas, alpha: true, antialias: false,
                powerPreference: 'high-performance'
            });
            renderer.setSize(w, h, false);
            renderer.setPixelRatio(pr);
            buildMorphableSwarm(STATE.lod);
        }

        function buildMorphableSwarm(count) {
            if (swarmMesh) scene.remove(swarmMesh);

            const geo = new THREE.BufferGeometry();
            const currentPos = new Float32Array(count * 3);
            posSphere = new Float32Array(count * 3);
            posTicket = new Float32Array(count * 3);

            const phi = Math.PI * (3 - Math.sqrt(5));

            // Ticket grid: golden ratio rectangle
            const ratio = 1.618;
            const rows = Math.floor(Math.sqrt(count / ratio));
            const cols = Math.floor(count / rows);
            const spacing = 0.45;

            for (let i = 0; i < count; i++) {
                // Form A: Fibonacci Sphere
                const y = 1 - (i / (count - 1)) * 2;
                const r = Math.sqrt(1 - y * y);
                const theta = phi * i;
                posSphere[i*3]     = Math.cos(theta) * r * 14;
                posSphere[i*3 + 1] = y * 14;
                posSphere[i*3 + 2] = Math.sin(theta) * r * 14;

                // Form B: Living Ticket (flat golden-ratio rectangle)
                const c = i % cols;
                const row = Math.floor(i / cols);
                posTicket[i*3]     = (c - cols / 2) * spacing;
                posTicket[i*3 + 1] = (row - rows / 2) * spacing;
                posTicket[i*3 + 2] = (Math.random() - 0.5) * 0.3;

                // Start as sphere
                currentPos[i*3]     = posSphere[i*3];
                currentPos[i*3 + 1] = posSphere[i*3 + 1];
                currentPos[i*3 + 2] = posSphere[i*3 + 2];
            }

            geo.setAttribute('position', new THREE.BufferAttribute(currentPos, 3));

            const mat = new THREE.PointsMaterial({
                color: 0xc5a059, size: 0.06, transparent: true,
                opacity: 0.35, blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            swarmMesh = new THREE.Points(geo, mat);
            scene.add(swarmMesh);
        }

        // GPU Governor
        function checkThermal(now) {
            STATE.frameCount++;
            if (now - STATE.lastTime >= 1000) {
                const avg = 1000 / STATE.frameCount;
                if (STATE.mode === 'SWARM') {
                    if (avg > 20 && STATE.lod === 2500) {
                        STATE.lod = 800; buildMorphableSwarm(800);
                    } else if (avg < 12 && STATE.lod === 800) {
                        STATE.lod = 2500; buildMorphableSwarm(2500);
                    }
                }
                self.postMessage({ type: 'LOD', lod: STATE.lod, delta: avg.toFixed(1) });
                STATE.frameCount = 0;
                STATE.lastTime = now;
            }
        }

        function masterLoop() {
            if (STATE.paused) return;
            const now = performance.now();
            checkThermal(now);

            if (STATE.mode === 'SWARM') {
                // Idle sphere rotation
                const speed = STATE.intentActive ? 0.015 : 0.0015;
                const pulse = STATE.intentActive ? 1.15 + Math.sin(now * 0.008) * 0.08 : 1.0;
                swarmMesh.rotation.y += speed;
                swarmMesh.rotation.x += speed * 0.4;
                swarmMesh.scale.lerp(new THREE.Vector3(pulse, pulse, pulse), 0.08);

            } else if (STATE.mode === 'TICKET') {
                // L5: MORPH — sphere → ticket
                STATE.morphProgress += (1.0 - STATE.morphProgress) * 0.03;
                const pos = swarmMesh.geometry.attributes.position.array;

                for (let i = 0; i < pos.length; i++) {
                    pos[i] = posSphere[i] + (posTicket[i] - posSphere[i]) * STATE.morphProgress;
                }
                swarmMesh.geometry.attributes.position.needsUpdate = true;

                // Ticket aristocratic pose: center + gentle sway
                swarmMesh.rotation.y += (Math.sin(now * 0.001) * 0.12 - swarmMesh.rotation.y) * 0.05;
                swarmMesh.rotation.x += (0 - swarmMesh.rotation.x) * 0.05;
                swarmMesh.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.05);

                // Intensify particles
                swarmMesh.material.size = 0.06 + STATE.morphProgress * 0.09;
                swarmMesh.material.opacity = 0.35 + STATE.morphProgress * 0.55;

                // Signal morph complete
                if (STATE.morphProgress > 0.95) {
                    self.postMessage({ type: 'MORPH_COMPLETE' });
                }
            }

            renderer.render(scene, camera);
            requestAnimationFrame(masterLoop);
        }
    `;

    const init = () => {
        // 1. Create overlay canvas
        canvas = document.createElement('canvas');
        canvas.id = 'santis-fibonacci-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none;mix-blend-mode:screen;opacity:0;transition:opacity 2s ease;';
        document.body.prepend(canvas);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => { canvas.style.opacity = '0.7'; });
        });

        // 2. Create Blob Worker
        const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
        worker = new Worker(URL.createObjectURL(blob));

        // 3. Transfer OffscreenCanvas
        const offscreen = canvas.transferControlToOffscreen();
        worker.postMessage({
            type: 'INIT',
            canvas: offscreen,
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: Math.min(window.devicePixelRatio, 1.5)
        }, [offscreen]);

        // 4. Event Bus
        setupEventBus();

        console.log('🦅 [Santis OS v33] L4 Fibonacci Swarm Mühürlendi. Morph desteği aktif.');
    };

    const setupEventBus = () => {
        worker.onmessage = (e) => {
            if (e.data.type === 'LOD' && e.data.lod !== 2500) {
                console.log(`⚡ [L4 Governor] Termal koruma: LOD ${e.data.lod}`);
            }
            // Dispatch morph complete event for L5
            if (e.data.type === 'MORPH_COMPLETE') {
                document.dispatchEvent(new CustomEvent('santis:morph-complete'));
            }
        };

        // Resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth < 768) {
                    worker.postMessage({ type: 'PAUSE' });
                    canvas.style.opacity = '0';
                } else {
                    worker.postMessage({ type: 'RESIZE', width: window.innerWidth, height: window.innerHeight });
                    canvas.style.opacity = '0.7';
                    if (isPaused) { worker.postMessage({ type: 'RESUME' }); isPaused = false; }
                }
            }, 200);
        });

        // Zero-Decibel
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) { worker.postMessage({ type: 'PAUSE' }); isPaused = true; }
            else { worker.postMessage({ type: 'RESUME' }); isPaused = false; }
        });

        document.addEventListener('mousemove', () => {
            if (isPaused) { worker.postMessage({ type: 'RESUME' }); isPaused = false; }
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => { worker.postMessage({ type: 'PAUSE' }); isPaused = true; }, 4000);
        }, { passive: true });

        // Intent bridge
        document.addEventListener('mousemove', (() => {
            let lastCheck = 0;
            return (e) => {
                const now = performance.now();
                if (now - lastCheck < 100) return;
                lastCheck = now;
                const btns = document.querySelectorAll('.buy-btn, #main-buy-btn, .btn-rezervasyon, .sovereign-rituals-cta, #apex-btn');
                let intentActive = false;
                btns.forEach(btn => {
                    if (btn.offsetParent === null) return;
                    const r = btn.getBoundingClientRect();
                    const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
                    if (d < 250) intentActive = true;
                });
                worker.postMessage({ type: 'TELEMETRY', intentActive });
            };
        })(), { passive: true });
    };

    // ── PUBLIC API (for L5 checkout-ritual.js) ──
    const sendCommand = (cmd) => { if (worker) worker.postMessage(cmd); };
    const getCanvas = () => canvas;

    return { init, sendCommand, getCanvas };
})();

// ── GLOBAL BRIDGE for L5 ──
window.SantisSwarm = SantisFibonacciSwarm;

// ── BOOTSTRAP ──
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SantisFibonacciSwarm.init);
} else {
    SantisFibonacciSwarm.init();
}
