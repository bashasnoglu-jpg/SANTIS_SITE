/**
 * SANTIS SOVEREIGN V17 - THE QUANTUM BRIDGE
 * Main Thread (Chronos Engine)
 * Role: Write-only. Feeds scroll and velocity data to Shared Memory.
 */

(function () {
    console.log("🌉 [Quantum Bridge] Initializing V17 Architecture...");

    document.addEventListener("DOMContentLoaded", () => {
        const gpuCanvas = document.querySelector('#santis-god-canvas');
        if (!gpuCanvas) {
            console.warn("⚠️ [Quantum Bridge] #santis-god-canvas not found. Bridge standby.");
            return;
        }

        // Feature Check
        if (!('OffscreenCanvas' in window) || !('SharedArrayBuffer' in window)) {
            console.error("❌ [Quantum Bridge] Browser does not support OffscreenCanvas or SharedArrayBuffer. Fatal Error in V17 Architecture.");
            return;
        }

        // 1. Transfer Canvas to Offscreen Worker
        const offscreen = gpuCanvas.transferControlToOffscreen();
        const gpuWorker = new Worker('/assets/js/workers/santis-gpu-kernel.js', { type: "module" });

        // 2. Instantiate Shared Memory (8 Bytes: Index 0 = Y Scroll, Index 1 = Velocity)
        const sharedMemory = new SharedArrayBuffer(8);
        const sensorData = new Float32Array(sharedMemory);

        // 3. Dispatch to Dark Room (Worker)
        gpuWorker.postMessage({ canvas: offscreen, bridge: sharedMemory }, [offscreen]);

        console.log("🌉 [Quantum Bridge] SharedArrayBuffer Instantiated. Zero-GC Comm-Link Established.");

        // 4. Hook into Scroll/Lenis for Kinetic Injection
        let lastScroll = window.scrollY;

        // This acts as our Chronos Native Tick
        function chronosTick() {
            const currentScroll = window.scrollY;
            const velocity = currentScroll - lastScroll;

            // ZERO-COPY MUTATION
            sensorData[0] = currentScroll;
            sensorData[1] = velocity;

            lastScroll = currentScroll;
            requestAnimationFrame(chronosTick);
        }

        // Start the engine
        requestAnimationFrame(chronosTick);
        console.log("⏱️ [Chronos] LERP Scheduler Locked to V-Sync.");
    });
})();
