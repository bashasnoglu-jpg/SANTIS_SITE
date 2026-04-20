/**
 * ========================================================================
 * 🌌 SANTIS OMNIVERSE CONSOLE — OMNI ENGINE v1.0
 * ========================================================================
 * Master game loop, tick orchestration, global state.
 * Pattern: gpu-effects.js (desynchronized rAF) + quantum-engine.js (idle guard)
 * ========================================================================
 */

import { OmniScene } from './omni-scene.js';
import { OmniRenderer } from './omni-renderer.js';
import { OmniUI } from './omni-ui.js';

export const OmniEngine = (() => {
    'use strict';

    // ── GLOBAL STATE ──
    const state = {
        running: false,
        rafId: null,
        fps: 0,
        frameCount: 0,
        lastFpsTime: 0,
        lastFrameTime: 0,
        deltaTime: 0,
        canvas: null,
        ctx: null,
        width: 0,
        height: 0,
        mouse: { x: 0, y: 0, down: false, dragId: null, offsetX: 0, offsetY: 0 },
        camera: { x: 0, y: 0, zoom: 1 }
    };

    // ── INIT ──
    function init() {
        state.canvas = document.getElementById('omni-canvas');
        if (!state.canvas) {
            console.error('🚨 [Omni Engine] Canvas not found');
            return;
        }

        state.ctx = state.canvas.getContext('2d', { alpha: false, desynchronized: true });
        resize();
        window.addEventListener('resize', resize, { passive: true });

        // Mouse events
        state.canvas.addEventListener('mousedown', onMouseDown);
        state.canvas.addEventListener('mousemove', onMouseMove);
        state.canvas.addEventListener('mouseup', onMouseUp);
        state.canvas.addEventListener('dblclick', onDblClick);
        state.canvas.addEventListener('wheel', onWheel, { passive: false });

        // Init subsystems
        OmniScene.init();
        OmniRenderer.init(state.ctx);
        OmniUI.init();

        // Start loop
        state.running = true;
        state.lastFrameTime = performance.now();
        state.lastFpsTime = performance.now();
        tick();

        console.log('%c🌌 [Omniverse Engine v1.0] Genesis Active', 'color:#d4af37;font-weight:bold;background:#050505;padding:4px 10px');
    }

    // ── RESIZE ──
    function resize() {
        const container = state.canvas.parentElement;
        state.width = container.clientWidth;
        state.height = container.clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        state.canvas.width = state.width * dpr;
        state.canvas.height = state.height * dpr;
        state.canvas.style.width = state.width + 'px';
        state.canvas.style.height = state.height + 'px';
        state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ── MASTER TICK ──
    function tick() {
        if (!state.running) return;
        state.rafId = requestAnimationFrame(tick);

        const now = performance.now();
        state.deltaTime = (now - state.lastFrameTime) / 1000; // seconds
        state.lastFrameTime = now;

        // FPS counter
        state.frameCount++;
        if (now - state.lastFpsTime >= 1000) {
            state.fps = state.frameCount;
            state.frameCount = 0;
            state.lastFpsTime = now;
            OmniUI.updateFPS(state.fps);
        }

        // Update
        OmniScene.update(state.deltaTime);

        // Render
        OmniRenderer.render(state, OmniScene.getEntities(), OmniScene.getSelected());
    }

    // ── MOUSE: Screen → World coordinates ──
    function screenToWorld(sx, sy) {
        return {
            x: (sx - state.width / 2) / state.camera.zoom + state.camera.x + state.width / 2,
            y: (sy - state.height / 2) / state.camera.zoom + state.camera.y + state.height / 2
        };
    }

    // ── MOUSE EVENTS ──
    function onMouseDown(e) {
        const rect = state.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const world = screenToWorld(sx, sy);

        state.mouse.down = true;
        state.mouse.x = world.x;
        state.mouse.y = world.y;

        // Hit test: find topmost entity under cursor
        const hit = OmniScene.hitTest(world.x, world.y);
        if (hit) {
            state.mouse.dragId = hit.id;
            state.mouse.offsetX = world.x - hit.transform.x;
            state.mouse.offsetY = world.y - hit.transform.y;
            OmniScene.select(hit.id);
            OmniUI.showEntityPanel(hit);
        } else {
            OmniScene.select(null);
            OmniUI.hideEntityPanel();
        }
    }

    function onMouseMove(e) {
        const rect = state.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const world = screenToWorld(sx, sy);

        state.mouse.x = world.x;
        state.mouse.y = world.y;

        if (state.mouse.down && state.mouse.dragId) {
            const ent = OmniScene.getById(state.mouse.dragId);
            if (ent && !ent.locked) {
                ent.transform.x = world.x - state.mouse.offsetX;
                ent.transform.y = world.y - state.mouse.offsetY;
                OmniUI.updateDNA();
            }
        } else if (state.mouse.down && !state.mouse.dragId) {
            // Pan camera
            state.camera.x -= (world.x - state.mouse.x) * 0.5;
            state.camera.y -= (world.y - state.mouse.y) * 0.5;
        }
    }

    function onMouseUp() {
        state.mouse.down = false;
        state.mouse.dragId = null;
    }

    function onDblClick(e) {
        const rect = state.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const world = screenToWorld(sx, sy);

        // Double-click on empty space → create entity at position
        const hit = OmniScene.hitTest(world.x, world.y);
        if (!hit) {
            const ent = OmniScene.createEntity({
                transform: { x: world.x, y: world.y }
            });
            OmniScene.select(ent.id);
            OmniUI.showEntityPanel(ent);
            OmniUI.updateDNA();
        }
    }

    function onWheel(e) {
        e.preventDefault();
        const zoomSpeed = 0.001;
        state.camera.zoom = Math.max(0.2, Math.min(3, state.camera.zoom - e.deltaY * zoomSpeed));
    }

    // ── PUBLIC API ──
    return {
        init,
        getState: () => state,
        getCamera: () => state.camera
    };
})();
