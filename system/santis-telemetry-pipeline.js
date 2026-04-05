// santis-telemetry-pipeline.js (Adaptive Version)
// SDCR V52.0 OMEGA - PREDICTIVE STRESS ENGINE

class AdaptiveTelemetry {
  constructor() {
    this.tier = this._identifyTier();
    this.history = []; // Sliding window for Z-score calculation
    this.baselineSpeed = 0;
    this.currentSSS = 0;
    
    this.init();
  }

  // 1. HARDWARE IDENTIFICATION
  _identifyTier() {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4; // GiB
    if (cores <= 2 || memory <= 2) return 'LOW_END';
    if (cores >= 8 && memory >= 8) return 'HIGH_END';
    return 'MID_RANGE';
  }

  // 2. 1-SECOND STRESS CALIBRATION
  async calibrate() {
    const start = performance.now();
    for (let i = 0; i < 1e6; i++) { Math.sqrt(i); }
    this.baselineSpeed = performance.now() - start;
    console.log(`[SDCR] Device Calibrated. Baseline: ${this.baselineSpeed.toFixed(2)}ms (${this.tier})`);
  }

  // 3. ADAPTIVE SCORING LOGIC
  _calculateZScore(val) {
    if (this.history.length < 10) return 0;
    const mean = this.history.reduce((a, b) => a + b) / this.history.length;
    const stdDev = Math.sqrt(this.history.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / this.history.length);
    return stdDev === 0 ? 0 : (val - mean) / stdDev;
  }

  // 4. MAIN TELEMETRY LOOP
  init() {
    this.calibrate();

    // Long Task Observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = entry.duration;
          this.history.push(duration);
          if (this.history.length > 50) this.history.shift();

          const z = this._calculateZScore(duration);
          
          // Cihaza göre hassasiyet: 
          // Yüksek segmentte 3*stdDev krizdir, düşük segmentte 5*stdDev.
          const threshold = this.tier === 'HIGH_END' ? 3 : 5;

          if (z > threshold) {
            this._injectStress(Math.min(1000, this.currentSSS + (z * 10)));
          }
        }
      });

      try {
        observer.observe({ type: 'longtask', buffered: true });
      } catch (e) {}
    }

    // SSS Pulse Logic
    setInterval(() => {
      // Pasif soğuma (Cooling mechanism)
      this.currentSSS = Math.max(0, this.currentSSS - 5);
      window.__SANTIS_SSS__ = Math.round(this.currentSSS);
    }, 1000);
  }

  _injectStress(val) {
    this.currentSSS = val;
    if (this.currentSSS > 600) {
      console.warn(`[SDCR] SSS Critical Spike: ${Math.round(this.currentSSS)}`);
    }
  }
}

export const telemetry = new AdaptiveTelemetry();
