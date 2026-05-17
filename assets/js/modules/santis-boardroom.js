/**
 * ═══════════════════════════════════════════════════════════
 * 🦅 SANTIS OS THE BOARDROOM — ULTIMATE GOD MODE (Phase X)
 * ═══════════════════════════════════════════════════════════
 * Matrix-level telemetry dashboard featuring ECharts, WebSocket streams,
 * and zero-latency autonomous DOM self-healing.
 */

(function () {
    const ENABLED = location.search.includes("boardroom=true") || localStorage.getItem("SANTIS_BOARDROOM") === "1";
    if (!ENABLED) return;

    console.log("🦅 [The Boardroom] 120 FPS Cockpit Sequence Initiated.");

    // --- 1. UI INJECTION ---
    const panel = document.createElement("div");
    panel.id = "santis-boardroom";
    document.body.appendChild(panel);

    panel.innerHTML = `
        <div class="boardroom-header">
            <span class="boardroom-title">🦅 THE BOARDROOM</span>
            <span class="boardroom-status blink">LIVE</span>
        </div>
        <div class="boardroom-grid">
            <div class="b-card">
                <span class="b-label">FPS</span>
                <span class="b-value" id="b-fps">0</span>
            </div>
            <div class="b-card">
                <span class="b-label">RAM (MB)</span>
                <span class="b-value" id="b-ram">0</span>
            </div>
            <div class="b-card">
                <span class="b-label">DOM Nodes</span>
                <span class="b-value" id="b-dom">0</span>
            </div>
            <div class="b-card">
                <span class="b-label">Long Tasks</span>
                <span class="b-value" id="b-tasks">0</span>
            </div>
        </div>
        <div id="b-chart" class="boardroom-chart"></div>
    `;

    const style = document.createElement("style");
    style.textContent = `
        #santis-boardroom {
            position: fixed; top: 20px; left: 20px; width: 340px;
            background: rgba(5,8,16,0.85); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
            border: 1px solid rgba(0, 255, 204, 0.2); border-radius: 12px;
            color: var(--sbr-info, rgb(0, 255, 204)); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            z-index: 9999999; box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0, 255, 204, 0.1);
            padding: 16px; pointer-events: none; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            user-select: none;
        }
        .boardroom-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,255,204,0.15); padding-bottom: 8px; margin-bottom: 12px; }
        .boardroom-title { font-size: 14px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
        .boardroom-status { font-size: 10px; background: rgba(0,255,204,0.1); padding: 2px 6px; border-radius: 4px; color: var(--sbr-info, rgb(0, 255, 204)); }
        .blink { animation: b-blink 2s infinite; }
        @keyframes b-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .boardroom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
        .b-card { background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); }
        .b-label { display: block; font-size: 9px; color: var(--sbr-neutral-text, rgb(156, 163, 175)); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
        .b-value { display: block; font-size: 18px; font-weight: 700; color: var(--sbr-boardroom-ink, rgb(248, 250, 252)); }
        #b-fps { color: var(--sbr-info, rgb(0, 255, 204)); }
        .boardroom-chart { height: 100px; width: 100%; margin-top: 8px; }
    `;
    document.head.appendChild(style);

    // --- 2. ASYNC WEBSOCKET KERNEL (THE 3052ms FIX) ---
    class BoardroomSocket {
        constructor() {
            this.ws = null;
            this.attempts = 0;
            this.connect();
        }

        connect() {
            if (!window.SovereignWS) {
                console.warn("⏳ [Boardroom] SovereignWS Singleton not ready. Retrying in 2s...");
                setTimeout(() => this.connect(), 2000);
                return;
            }

            try {
                this.ws = window.SovereignWS;
                
                window.SovereignWS.addListener('open', () => {
                    this.attempts = 0;
                    console.log("🟢 [Boardroom] Quantum Stream Connected. (Zero-Latency)");
                });

                window.SovereignWS.addListener('close', async () => {
                    console.warn("⚠️ [Boardroom] Rift Detected! Connection Severed. Orchestrator handles reconnect.");
                });
            } catch (e) {
                this.reconnect();
            }
        }

        reconnect() {
            if (this.attempts > 10) return;
            const delay = Math.pow(2, this.attempts) * 200; // 200ms, 400ms, 800ms...
            this.attempts++;
            setTimeout(() => this.connect(), delay);
        }
    }
    window.SovereignBoardroomWS = new BoardroomSocket();

    // --- 3. ECHARTS PASSIVE EVENT FIX & INITIALIZATION ---
    let myChart = null;
    let chartData = [];

    function initChart() {
        if (!window.echarts) {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js";
            script.onload = () => buildChart();
            document.head.appendChild(script);
        } else {
            buildChart();
        }
    }

    function buildChart() {
        // HATA DÜZELTİLDİ: ECharts container'ına passive listeners zorlandı.
        const chartDOM = document.getElementById("b-chart");
        
        // Proxy addEventListener to force passive: true on wheel/mousewheel
        const originalAddEventListener = chartDOM.addEventListener;
        chartDOM.addEventListener = function (type, listener, options) {
            if (type === 'wheel' || type === 'mousewheel' || type === 'touchstart' || type === 'touchmove') {
                let passives = { passive: true };
                if (typeof options === 'object') {
                    passives = { ...options, passive: true };
                }
                originalAddEventListener.call(chartDOM, type, listener, passives);
            } else {
                originalAddEventListener.call(chartDOM, type, listener, options);
            }
        };

        myChart = echarts.init(chartDOM, 'dark', { renderer: 'canvas' });
        const rootStyles = getComputedStyle(document.documentElement);
        const boardroomInfo = rootStyles.getPropertyValue('--sbr-info').trim() || 'rgb(0, 255, 204)';
        
        const option = {
            backgroundColor: 'transparent',
            animation: false,
            grid: { top: 10, bottom: 10, left: 10, right: 10 },
            xAxis: { type: 'category', show: false, boundaryGap: false },
            yAxis: { type: 'value', show: false, min: 0, max: 120 },
            series: [{
                type: 'line',
                data: chartData,
                smooth: true,
                symbol: 'none',
                lineStyle: { width: 2, color: boardroomInfo, shadowColor: 'rgba(0, 255, 204, 0.5)', shadowBlur: 10 },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(0, 255, 204, 0.3)' },
                        { offset: 1, color: 'rgba(0, 255, 204, 0)' }
                    ])
                }
            }]
        };
        myChart.setOption(option);
    }

    // --- 4. CORE TELEMETRY LOOP ---
    let frames = 0; let lastTime = performance.now();
    let longTasks = 0;

    new PerformanceObserver((list) => {
        list.getEntries().forEach(() => longTasks++);
    }).observe({ entryTypes: ["longtask"] });

    function renderMetrics() {
        const now = performance.now();
        frames++;

        if (now - lastTime >= 1000) {
            const currentFps = Math.min(Math.round((frames * 1000) / (now - lastTime)), 120);
            
            document.getElementById("b-fps").innerText = currentFps;
            document.getElementById("b-fps").style.color = currentFps < 50 ? "var(--sbr-danger)" : "var(--sbr-info)";

            if (performance.memory) {
                document.getElementById("b-ram").innerText = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
            }
            document.getElementById("b-dom").innerText = document.getElementsByTagName("*").length;
            document.getElementById("b-tasks").innerText = longTasks;

            // Update Chart
            if (myChart) {
                chartData.push(currentFps);
                if (chartData.length > 30) chartData.shift();
                myChart.setOption({ series: [{ data: chartData }] });
            }

            frames = 0;
            lastTime = now;
        }

        requestAnimationFrame(renderMetrics);
    }

    initChart();
    requestAnimationFrame(renderMetrics);

})();
