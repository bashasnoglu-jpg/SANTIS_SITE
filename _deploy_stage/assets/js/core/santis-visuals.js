/**
 * SANTIS v13.0 — VISUALS MODULE
 * Telemetry Radar (FPS/MEM) + Sovereign Pulse Canvas
 * No dependencies — standalone visual layer
 */

// Sovereign Telemetry Armor (Performance Monitor)
window.initTelemetryRadar = function () {
    const fpsEl = document.getElementById('tel-fps');
    const memEl = document.getElementById('tel-mem');

    let frames = 0;
    let lastTime = performance.now();

    function loop() {
        const now = performance.now();
        frames++;

        if (now >= lastTime + 1000) {
            const fps = Math.round((frames * 1000) / (now - lastTime));
            fpsEl.innerText = fps;

            if (fps >= 55) fpsEl.className = "text-santis-emerald font-bold text-sm";
            else if (fps >= 40) fpsEl.className = "text-santis-gold font-bold text-sm";
            else fpsEl.className = "text-red-500 font-bold text-sm animate-pulse";

            if (performance.memory) {
                const usedMB = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
                memEl.innerText = `${usedMB}MB`;
                if (usedMB > 100) memEl.className = "text-red-500 font-bold text-sm animate-pulse";
                else memEl.className = "text-santis-gold font-bold text-sm";
            } else {
                memEl.innerText = "N/A";
                memEl.className = "text-santis-silver font-bold text-sm";
            }

            frames = 0;
            lastTime = now;
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
};

// Sovereign Pulse Engine (Canvas waveform)
window.initSovereignPulse = function () {
    const canvas = document.getElementById('santis-pulse-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const POINTS = 150;
    let pts = new Float32Array(POINTS).fill(30);
    let boost = 0;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Global pulse trigger
    window.triggerPulse = function (big) { boost = big ? 40 : 12; };

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(0, 255, 194, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00FFC2';
        ctx.beginPath();
        const step = canvas.width / (POINTS - 1);
        const mid = canvas.height * 0.55;
        for (let i = 0; i < POINTS; i++) {
            const noise = (Math.random() - 0.5) * 2.5;
            pts[i] = i < POINTS - 1 ? pts[i + 1] : mid + noise + (boost || 0);
            if (i === 0) ctx.moveTo(0, pts[i]);
            else ctx.lineTo(i * step, pts[i]);
        }
        ctx.stroke();
        if (boost > 0.5) boost *= 0.91; else boost = 0;
        requestAnimationFrame(draw);
    }
    draw();
};
