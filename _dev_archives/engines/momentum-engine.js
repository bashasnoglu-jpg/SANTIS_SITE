/**
 * SANTIS v13.0 — MOMENTUM ENGINE (TREND PREDICTOR)
 * ECharts Trend Wave + Rising Star + Predictive Mirror
 * Dependencies: ECharts, SovereignMirror
 */
window.MomentumEngine = {
    _history: {},  // { city: [{ts, revenue}, ...] }
    _chart: null,
    _mode: 'momentum', // 'score' or 'momentum'
    _simInterval: null,

    record(city, revenue) {
        if (!this._history[city]) this._history[city] = [];
        this._history[city].push({ ts: Date.now(), revenue });
        // Keep last 20 entries per city
        if (this._history[city].length > 20) this._history[city].shift();
    },

    getMomentum(city) {
        const h = this._history[city];
        if (!h || h.length < 2) return 0;
        const recent = h.slice(-5);
        const old = h.slice(0, Math.max(1, h.length - 5));
        const avgRecent = recent.length / Math.max(1, (recent[recent.length - 1].ts - recent[0].ts) / 1000);
        const avgOld = old.length / Math.max(1, (old[old.length - 1].ts - old[0].ts) / 1000);
        return avgOld > 0 ? (avgRecent / avgOld) : avgRecent;
    },

    getRisingStar() {
        let best = { city: '—', momentum: 0 };
        for (const city in this._history) {
            const m = this.getMomentum(city);
            if (m > best.momentum) best = { city, momentum: m };
        }
        return best;
    },

    initChart() {
        const dom = document.getElementById('santis-trend-chart');
        if (!dom || typeof echarts === 'undefined') return;
        this._chart = echarts.init(dom, null, { renderer: 'canvas' });
        this._chart.setOption({
            grid: { top: 5, right: 5, bottom: 20, left: 30 },
            xAxis: { type: 'category', data: [], axisLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#555', fontSize: 8 } },
            yAxis: { type: 'value', splitLine: { lineStyle: { color: '#1a1a1a' } }, axisLabel: { color: '#555', fontSize: 8 } },
            series: [{
                type: 'line',
                smooth: true,
                symbol: 'none',
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(0, 209, 255, 0.4)' },
                        { offset: 1, color: 'rgba(0, 209, 255, 0)' }
                    ])
                },
                lineStyle: { color: '#00D1FF', width: 2 },
                data: []
            }],
            tooltip: { trigger: 'axis', backgroundColor: '#111', borderColor: '#333', textStyle: { color: '#fff', fontSize: 10 } }
        });
    },

    updateChart() {
        if (!this._chart) return;
        const cities = Object.keys(this._history);
        const values = cities.map(c => ({
            name: c,
            value: this._mode === 'momentum' ? this.getMomentum(c).toFixed(2) : (this._history[c].slice(-1)[0]?.revenue || 0)
        }));
        values.sort((a, b) => b.value - a.value);

        this._chart.setOption({
            xAxis: { data: values.map(v => v.name) },
            series: [{ data: values.map(v => parseFloat(v.value)) }]
        });

        // Update Rising Star
        const star = this.getRisingStar();
        const cityEl = document.getElementById('santis-rising-city');
        const valEl = document.getElementById('santis-rising-value');
        if (cityEl) cityEl.textContent = star.city;
        if (valEl) valEl.textContent = `×${star.momentum.toFixed(1)}`;
    },

    toggleMode() {
        this._mode = this._mode === 'momentum' ? 'score' : 'momentum';
        const btn = document.getElementById('santis-mode-btn');
        if (btn) {
            btn.textContent = this._mode.toUpperCase();
            btn.classList.toggle('active', this._mode === 'momentum');
        }
        this.updateChart();

        // Predictive Mirror: switch VIP Mirror logic
        if (this._mode === 'momentum') {
            this.predictiveMirrorSync();
        } else if (window.SovereignMirror) {
            SovereignMirror.syncVIP();
        }
    },

    predictiveMirrorSync() {
        const star = this.getRisingStar();
        if (star.city === '—') return;
        const slide = document.querySelector(`.swiper-slide[data-city="${star.city}"]`);
        if (slide && window.SovereignMirror) SovereignMirror.updateFocus(slide);
    },

    startSimulation() {
        const mockCities = ['Dubai', 'Istanbul', 'Monaco', 'London', 'Bodrum', 'Zurich', 'Antalya'];
        const mockRevenues = { Dubai: 248000, Istanbul: 185000, Monaco: 312000, London: 142000, Bodrum: 96000, Zurich: 175000, Antalya: 88000 };

        // Seed initial data
        mockCities.forEach(c => this.record(c, mockRevenues[c]));

        this._simInterval = setInterval(() => {
            const hotCity = mockCities[Math.floor(Math.random() * mockCities.length)];
            const hypeBoost = Math.random() > 0.6 ? 3 : 1;
            for (let i = 0; i < hypeBoost; i++) {
                this.record(hotCity, mockRevenues[hotCity] * (0.9 + Math.random() * 0.2));
            }
            this.updateChart();
        }, 2000);
    },

    init() {
        this.initChart();
        this.startSimulation();

        const btn = document.getElementById('santis-mode-btn');
        if (btn) {
            btn.addEventListener('click', () => this.toggleMode());
            btn.classList.add('active');
        }

        console.log('🦅 MomentumEngine: Online. Tracking trend waves...');
    }
};
