// santis-telemetry-core.js
// SDCR V53 - REAL TELEMETRY ENGINE (PRODUCTION GRADE)

class SantisTelemetryEngine {
  constructor() {
    this.state = {
      fps: 60,
      longTask: 0,
      memoryPressure: 0,
      sss: 0
    };

    this.frames = 0;
    this.lastFrameTime = performance.now();

    this.longTaskScore = 0;
    this.fpsScore = 0;
    this.memoryScore = 0;

    this.init();
    window.__SANTIS_SSS__ = 0;
  }

  // -----------------------------
  // 1. LONG TASK OBSERVER (CPU PAIN)
  // -----------------------------
  initLongTaskObserver() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = entry.duration;

          // 50ms üstü kritik
          if (duration > 50) {
            this.longTaskScore += Math.min(duration, 200); // cap
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.warn('[SSS] LongTask observer unsupported');
    }
  }

  // -----------------------------
  // 2. FPS TRACKER (UI PAIN)
  // -----------------------------
  initFPSMonitor() {
    const loop = (time) => {
      this.frames++;

      if (time - this.lastFrameTime >= 1000) {
        const fps = this.frames;

        this.state.fps = fps;

        // 60 FPS ideal → düşüş penalize edilir
        this.fpsScore = Math.max(0, (60 - fps) * 10);

        this.frames = 0;
        this.lastFrameTime = time;
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  // -----------------------------
  // 3. MEMORY PRESSURE (RAM PAIN)
  // -----------------------------
  initMemoryMonitor() {
    if (!performance.memory) return;

    setInterval(() => {
      const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;

      const usage = usedJSHeapSize / jsHeapSizeLimit;

      this.state.memoryPressure = usage;

      // %70 sonrası agresif artış
      if (usage > 0.7) {
        this.memoryScore = (usage - 0.7) * 1000;
      } else {
        this.memoryScore = 0;
      }

    }, 1000);
  }

  // -----------------------------
  // 4. SSS CALCULATION (FUSION CORE)
  // -----------------------------
  calculateSSS() {
    // ağırlıklar (kritik tuning noktası)
    const WEIGHTS = {
      longTask: 0.5,   // CPU en kritik
      fps: 0.3,
      memory: 0.2
    };

    // normalize
    const longTaskNorm = Math.min(this.longTaskScore / 200, 1);
    const fpsNorm = Math.min(this.fpsScore / 600, 1);
    const memoryNorm = Math.min(this.memoryScore / 300, 1);

    const sss =
      (longTaskNorm * WEIGHTS.longTask +
       fpsNorm * WEIGHTS.fps +
       memoryNorm * WEIGHTS.memory) * 1000;

    this.state.sss = Math.round(sss);

    // decay (çok kritik → yoksa spike kalıcı olur)
    this.longTaskScore *= 0.7;
    this.fpsScore *= 0.8;
    this.memoryScore *= 0.9;

    window.__SANTIS_SSS__ = this.state.sss;
  }

  // -----------------------------
  // 5. MAIN LOOP
  // -----------------------------
  start() {
    setInterval(() => {
      this.calculateSSS();
    }, 500);
  }

  // -----------------------------
  // INIT
  // -----------------------------
  init() {
    this.initLongTaskObserver();
    this.initFPSMonitor();
    this.initMemoryMonitor();
    this.start();

    console.log('%c[SDCR] Real Telemetry Engine Active', 'color: lime');
  }
}

// SINGLETON
export const telemetry = new SantisTelemetryEngine();
