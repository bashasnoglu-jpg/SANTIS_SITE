/**
 * 🎬 [SANTIS PERF OVERLAY] - Phase H: Cinematic Performance Monitoring
 * Veri akışı: FPS, Memory (JS Heap), Layout Shifts, Long Tasks
 */

const PerformanceOverlay = (() => {
    let stats = { fps: 0, mem: 0, nodes: 0, latency: 0 };
    let frameCount = 0;
    let lastTime = performance.now();
    let container;

    const createHUD = () => {
        container = document.createElement('div');
        container.id = 'santis-perf-hud';
        container.style = `
            position: fixed; top: 10px; right: 10px; z-index: 99999;
            background: rgba(0, 0, 0, 0.85); border: 1px solid #c5a059;
            color: #c5a059; font-family: 'JetBrains Mono', monospace;
            padding: 10px; font-size: 10px; border-radius: 4px;
            backdrop-filter: blur(10px); pointer-events: none;
            display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
            min-width: 180px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;
        document.body.appendChild(container);
    };

    const updateStats = () => {
        const now = performance.now();
        frameCount++;

        if (now >= lastTime + 1000) {
            stats.fps = frameCount;
            stats.mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 'N/A';
            stats.nodes = document.querySelectorAll('*').length;
            
            render();
            frameCount = 0;
            lastTime = now;
        }
        requestAnimationFrame(updateStats);
    };

    const render = () => {
        if (!container) return;
        const fpsColor = stats.fps > 55 ? '#4CAF50' : stats.fps > 30 ? '#FFC107' : '#F44336';
        
        container.innerHTML = `
            <div>FPS: <span style="color:${fpsColor}">${stats.fps}</span></div>
            <div>MEM: ${stats.mem}MB</div>
            <div>DOM: ${stats.nodes}</div>
            <div>STRESS: ${stats.nodes > 3000 ? 'HIGH' : 'LOW'}</div>
            <div style="grid-column: span 2; height: 2px; background: #333; margin-top: 5px;">
                <div style="width: ${Math.min((stats.fps / 60) * 100, 100)}%; height: 100%; background: ${fpsColor}; transition: width 0.3s;"></div>
            </div>
        `;
    };

    return {
        init: () => {
            console.log("📊 [Performance Overlay] UI Matrix'e sızılıyor...");
            createHUD();
            updateStats();
        }
    };
})();

// Santis Bootloader üzerinden dinamik olarak çağrılabilir
export default PerformanceOverlay;
