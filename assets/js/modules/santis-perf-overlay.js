/**
 * 🎬 [SANTIS PERF OVERLAY] - Phase H: Cinematic Performance Monitoring
 * Veri akışı: FPS, Memory (JS Heap), Layout Shifts, Long Tasks
 */

const PerformanceOverlay = (() => {
    let stats = { fps: 0, mem: 0, nodes: 0, latency: 0 };
    let frameCount = 0;
    let lastTime = performance.now();
    let container;
    let fpsValue;
    let memValue;
    let nodesValue;
    let stressValue;
    let fpsBar;

    const createHUD = () => {
        const style = document.createElement('style');
        style.textContent = `
            #santis-perf-hud {
                position: fixed; top: 10px; right: 10px; z-index: 99999;
                background: rgba(0, 0, 0, 0.85); border: 1px solid var(--sbr-gold, rgb(197, 160, 89));
                color: var(--sbr-gold, rgb(197, 160, 89)); font-family: 'JetBrains Mono', monospace;
                padding: 10px; font-size: 10px; border-radius: 4px;
                backdrop-filter: blur(10px); pointer-events: none;
                display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
                min-width: 180px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }
            .santis-perf-fps[data-health="ok"] { color: var(--sbr-success, rgb(76, 175, 80)); }
            .santis-perf-fps[data-health="warn"] { color: var(--sbr-warn, rgb(255, 193, 7)); }
            .santis-perf-fps[data-health="error"] { color: var(--sbr-danger, rgb(244, 67, 54)); }
            .santis-perf-meter {
                grid-column: span 2; height: 2px; background: var(--sbr-neutral, rgb(51, 51, 51)); margin-top: 5px;
            }
            .santis-perf-meter__bar {
                height: 100%; transition: width 0.3s; background: var(--sbr-success, rgb(76, 175, 80));
            }
            .santis-perf-meter__bar[data-health="warn"] { background: var(--sbr-warn, rgb(255, 193, 7)); }
            .santis-perf-meter__bar[data-health="error"] { background: var(--sbr-danger, rgb(244, 67, 54)); }
        `;
        document.head.appendChild(style);

        container = document.createElement('div');
        container.id = 'santis-perf-hud';

        fpsValue = document.createElement('span');
        fpsValue.className = 'santis-perf-fps';
        memValue = document.createElement('span');
        nodesValue = document.createElement('span');
        stressValue = document.createElement('span');
        fpsBar = document.createElement('div');
        fpsBar.className = 'santis-perf-meter__bar';

        const fpsCell = document.createElement('div');
        fpsCell.append('FPS: ', fpsValue);
        const memCell = document.createElement('div');
        memCell.append('MEM: ', memValue);
        const nodesCell = document.createElement('div');
        nodesCell.append('DOM: ', nodesValue);
        const stressCell = document.createElement('div');
        stressCell.append('STRESS: ', stressValue);
        const meter = document.createElement('div');
        meter.className = 'santis-perf-meter';
        meter.appendChild(fpsBar);

        container.append(fpsCell, memCell, nodesCell, stressCell, meter);
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
        const fpsHealth = stats.fps > 55 ? 'ok' : stats.fps > 30 ? 'warn' : 'error';

        fpsValue.dataset.health = fpsHealth;
        fpsValue.textContent = String(stats.fps);
        memValue.textContent = `${stats.mem}MB`;
        nodesValue.textContent = String(stats.nodes);
        stressValue.textContent = stats.nodes > 3000 ? 'HIGH' : 'LOW';
        fpsBar.dataset.health = fpsHealth;
        fpsBar.style.width = `${Math.min((stats.fps / 60) * 100, 100)}%`;
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
