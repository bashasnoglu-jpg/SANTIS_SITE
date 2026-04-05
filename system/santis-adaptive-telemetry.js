// santis-adaptive-telemetry.js
// SDCR V54 OMEGA - ADAPTIVE + PREDICTIVE TELEMETRY CORE

class SantisAdaptiveTelemetry {
  constructor(baseTelemetry) {
    this.base = baseTelemetry;

    this.weights = { longTask: 0.5, fps: 0.3, memory: 0.2 };
    this.history = [];
    this.predictedSSS = 0;
    this.velocity = 0;

    this.profile = this.detectHardware();
    this.adaptWeights();

    this.start();
  }

  // -----------------------------
  // 1. HARDWARE PROFILING
  // -----------------------------
  detectHardware() {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    return { cores, memory, isMobile };
  }

  // -----------------------------
  // 2. ADAPTIVE WEIGHTS
  // -----------------------------
  adaptWeights() {
    let { cores, memory, isMobile } = this.profile;

    let w = {
      longTask: 0.5,
      fps: 0.3,
      memory: 0.2
    };

    // CPU zayıfsa
    if (cores <= 4) {
      w.longTask += 0.2;
      w.fps -= 0.05;
      w.memory -= 0.05;
    }

    // RAM zayıfsa
    if (memory <= 4) {
      w.memory += 0.4;
      w.longTask -= 0.1;
    }

    // Mobil cihaz
    if (isMobile) {
      w.fps += 0.2;
    }

    // normalize
    const total = w.longTask + w.fps + w.memory;

    this.weights = {
      longTask: w.longTask / total,
      fps: w.fps / total,
      memory: w.memory / total
    };

    console.log('[SDCR V54] Adaptive Weights:', this.weights);
  }

  // -----------------------------
  // 3. VELOCITY (ΔSSS)
  // -----------------------------
  calculateVelocity() {
    if (this.history.length < 2) return 0;

    const last = this.history[this.history.length - 1];
    const prev = this.history[this.history.length - 2];

    this.velocity = last - prev;

    return this.velocity;
  }

  // -----------------------------
  // 4. SMOOTHING (NOISE FILTER)
  // -----------------------------
  smooth(value) {
    const alpha = 0.6;
    const prev = this.history[this.history.length - 1] || value;

    return alpha * value + (1 - alpha) * prev;
  }

  // -----------------------------
  // 5. PREDICTION ENGINE
  // -----------------------------
  predictSSS() {
    const velocity = this.calculateVelocity();

    // 2 saniye ileri projeksiyon
    let predicted = this.base.state.sss + velocity * 4;

    // smoothing ile jitter azalt
    predicted = this.smooth(predicted);

    // clamp
    this.predictedSSS = Math.max(0, Math.min(1000, predicted));

    window.__SANTIS_PREDICTED_SSS__ = this.predictedSSS;
    window.__SANTIS_VELOCITY__ = this.velocity;
  }

  // -----------------------------
  // 6. DYNAMIC WEIGHT SHIFT (LIVE)
  // -----------------------------
  dynamicAdjustment() {
    const sss = this.base.state.sss;

    // sistem çok stresliyse CPU öncelik artar
    if (sss > 700) {
      this.weights.longTask += 0.1;
      this.weights.fps -= 0.05;
      this.weights.memory -= 0.05;
    }

    // normalize tekrar
    const total =
      this.weights.longTask +
      this.weights.fps +
      this.weights.memory;

    this.weights.longTask /= total;
    this.weights.fps /= total;
    this.weights.memory /= total;
  }

  // -----------------------------
  // 7. MAIN LOOP
  // -----------------------------
  start() {
    setInterval(() => {
      const current = this.base.state.sss;

      this.history.push(current);

      if (this.history.length > 30) {
        this.history.shift();
      }

      this.predictSSS();
      this.dynamicAdjustment();

    }, 500);
  }
}

// FACTORY
export function createAdaptiveTelemetry(baseTelemetry) {
  return new SantisAdaptiveTelemetry(baseTelemetry);
}
