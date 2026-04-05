/* ========================================================================
   🦅 SANTIS L10 SINGULARITY | THE SOVEREIGN CORE (WEB WORKER)
   ======================================================================== */

let ctx = null;
let sharedTelemetry = null; 
let isCryoSleep = false;
let width = 0;
let height = 0;

let currentScroll = 0;
let targetScroll = 0;
let velocity = 0;

let targetFocusX = 0;
let targetFocusY = 0;
let currentFocusX = 0;
let currentFocusY = 0;

let particles = [];
let particleCount = 0;
let lastFpsTime = 0;
let frameCount = 0;
let degradationApplied = false;
let currentDpr = 1;
let _canvas = null;

self.onmessage = function(event) {
    const data = event.data;

    if (data.directive === 'IGNITE_SINGULARITY') {
        _canvas = data.canvas;
        width = data.width;
        height = data.height;
        currentDpr = data.dpr;

        // Hafıza paylaşımı varsa bağla; yoksa Fallback(postMessage) kullanılır
        if (data.memory) {
            sharedTelemetry = new Float32Array(data.memory);
        }

        // V18 GPU Core (Desynchronized -> V-Sync engeli yok, sıfır gecikme)
        ctx = _canvas.getContext('2d', { alpha: true, desynchronized: true });
        
        _canvas.width = width * currentDpr;
        _canvas.height = height * currentDpr;
        ctx.scale(currentDpr, currentDpr);

        targetFocusX = width / 2;
        targetFocusY = height / 2;
        currentFocusX = width / 2;
        currentFocusY = height / 2;

        particleCount = width < 768 ? 30 : 80;
        particles = Array.from({ length: particleCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2.5 + 0.5,
            speedY: Math.random() * 0.5 + 0.1,
            alpha: Math.random() * 0.5 + 0.1
        }));

        lastFpsTime = performance.now();
        self.requestAnimationFrame(render);
    }
    
    if (data.directive === 'RESIZE_MATRIX') {
        width = data.width;
        height = data.height;
        _canvas.width = width * currentDpr;
        _canvas.height = height * currentDpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.scale(currentDpr, currentDpr);
    }

    if (data.directive === 'TELEMETRY_FALLBACK') {
        // SharedArrayBuffer olmayan cihazlar için Event-Driven okuma
        if (!sharedTelemetry) {
            targetFocusX = data.mouseX;
            targetFocusY = data.mouseY;
            targetScroll = data.scrollY;
        }
    }

    if (data.directive === 'VISIBILITY_CHANGE') {
        isCryoSleep = !data.isVisible;
        if (!isCryoSleep) {
            lastFpsTime = performance.now();
            frameCount = 0;
            self.requestAnimationFrame(render);
        }
    }
};

function render(now) {
    if (isCryoSleep || !ctx) return;

    // --- GRACEFUL DEGRADATION ---
    frameCount++;
    if (now - lastFpsTime >= 1000) {
        const fps = frameCount;
        if (fps < 45 && !degradationApplied && currentDpr > 1) {
            console.warn(`⚠️ [Sovereign Core] FPS Drop (${fps} FPS). Graceful Degradation Devrede.`);
            currentDpr = currentDpr * 0.7; // DPR'ı düşür, VRAM'i rahatlat
            _canvas.width = width * currentDpr;
            _canvas.height = height * currentDpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0); 
            ctx.scale(currentDpr, currentDpr);
            degradationApplied = true;
        }
        frameCount = 0;
        lastFpsTime = now;
    }

    // --- 1. KOORDİNAT OKUMA (ZERO-LATENCY) ---
    if (sharedTelemetry) {
        targetFocusX = sharedTelemetry[0];
        targetFocusY = sharedTelemetry[1];
        targetScroll = sharedTelemetry[2];
    }

    // --- 2. KİNETİK & FLUID LERP ---
    currentScroll += (targetScroll - currentScroll) * 0.08;
    velocity = targetScroll - currentScroll;

    ctx.clearRect(0, 0, width, height);

    const isScrolling = Math.abs(velocity) > 2.0;
    ctx.fillStyle = '#D4AF37';

    particles.forEach(p => {
        // Hıza göre bükülme (Parallax Momentum)
        p.y -= p.speedY + (velocity * 0.15);

        // Uzay Döngüsü (Toroid yapı)
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // Scroll varsa partiküller asimile olur (Parlama efekti)
        ctx.globalAlpha = isScrolling ? Math.min(0.9, p.alpha + 0.4) : p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isScrolling ? p.size + (Math.abs(velocity) * 0.02) : p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // --- 3. FOCUS ILLUSIONS (Spotlight) ---
    currentFocusX += (targetFocusX - currentFocusX) * 0.06;
    currentFocusY += (targetFocusY - currentFocusY) * 0.06;

    const maxRadius = Math.max(width, height) * 0.6;
    const gradient = ctx.createRadialGradient(
        currentFocusX, currentFocusY, 0,
        currentFocusX, currentFocusY, maxRadius
    );
    
    gradient.addColorStop(0, 'rgba(10, 10, 10, 0.0)'); 
    gradient.addColorStop(0.4, 'rgba(10, 10, 10, 0.4)'); 
    gradient.addColorStop(1, 'rgba(10, 10, 10, 0.95)'); 

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over'; 

    // Ölümsüz Döngü!
    self.requestAnimationFrame(render);
}
