/**
 * ========================================================================
 * OMNIVERSE BRIDGE — Main Thread ↔ Oracle Worker Relay
 * ========================================================================
 * Santis Admin panelinden Oracle Worker'a veri gönderir
 * ve sonuçları UI'a yansıtır.
 * 
 * Usage:
 *   const bridge = new OmniverseBridge();
 *   bridge.simulate(cards, config).then(result => { ... });
 */

class OmniverseBridge {
    constructor(workerPath = 'oracle-worker.js') {
        this.worker = null;
        this.workerPath = workerPath;
        this.isRunning = false;
        this.onProgress = null;  // (percent) => {}
        this.onResult = null;    // (result) => {}
        this._resolvePromise = null;
    }

    /**
     * Worker'ı başlat (lazy initialization)
     */
    _ensureWorker() {
        if (this.worker) return;
        this.worker = new Worker(this.workerPath);
        this.worker.onmessage = (e) => this._handleMessage(e.data);
        this.worker.onerror = (err) => {
            console.error('🔴 [Oracle Worker] Hata:', err.message);
            this.isRunning = false;
        };
    }

    /**
     * Worker'dan gelen mesajları yönet
     */
    _handleMessage(data) {
        switch (data.cmd) {
            case 'progress':
                if (this.onProgress) this.onProgress(data.percent);
                break;

            case 'result':
                this.isRunning = false;
                const result = { heatmap: data.heatmap, stats: data.stats };
                if (this.onResult) this.onResult(result);
                if (this._resolvePromise) {
                    this._resolvePromise(result);
                    this._resolvePromise = null;
                }
                break;

            case 'pong':
                console.log('🟢 [Oracle Worker] Online:', data.version);
                break;
        }
    }

    /**
     * Simülasyonu başlat
     * @param {Array} cards — [{ id, name, x, y, mass, price }]
     * @param {Object} config — { botCount, distribution, fatigueThreshold, ... }
     * @returns {Promise} — { heatmap, stats }
     */
    simulate(cards, config = {}) {
        this._ensureWorker();

        if (this.isRunning) {
            console.warn('⚠️ [Bridge] Simülasyon zaten çalışıyor.');
            return Promise.reject('Already running');
        }

        this.isRunning = true;
        this.worker.postMessage({ cmd: 'simulate', cards, config });

        return new Promise((resolve) => {
            this._resolvePromise = resolve;
        });
    }

    /**
     * Sonuçları Santis runtime formatına dönüştür
     * @param {Object} result — simulate() sonucu
     * @returns {Object} — universe.runtime.json formatı
     */
    compileToRuntime(result, sceneName = 'default') {
        const { heatmap, stats } = result;

        // Sort cards by CVR descending for optimal layout order
        const sorted = [...heatmap].sort((a, b) => b.conversions - a.conversions);

        return {
            version: 'universe-runtime-v3',
            scene: sceneName,
            timestamp: new Date().toISOString(),
            engine: 'oracle-worker-v3.0',
            stats: {
                cvr: stats.cvr + '%',
                revenue: '€' + stats.totalRevenue.toLocaleString(),
                botCount: stats.botCount,
                energyCost: stats.totalEnergyCost
            },
            layout: sorted.map((card, priority) => ({
                id: card.cardId,
                name: card.name,
                position: { x: card.x, y: card.y },
                mass: card.mass,
                priority: priority + 1,
                cvr: card.cvr + '%',
                revenue: '€' + card.revenue.toLocaleString(),
                heatIntensity: card.heatIntensity.toFixed(3)
            })),
            seal: {
                hash: this._generateHash(),
                grade: parseFloat(stats.cvr) > 15 ? 'S+' : parseFloat(stats.cvr) > 10 ? 'A' : 'B',
                certified: true
            }
        };
    }

    /**
     * Runtime JSON'ı indir
     */
    downloadRuntime(runtime) {
        const blob = new Blob([JSON.stringify(runtime, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `universe-runtime-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Worker'ı sonlandır
     */
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.isRunning = false;
    }

    _generateHash() {
        const chars = 'abcdef0123456789';
        let hash = '0x';
        for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * chars.length)];
        return hash;
    }
}

// Global export for script tag usage
window.OmniverseBridge = OmniverseBridge;
