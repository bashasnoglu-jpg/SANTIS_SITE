/**
 * SANTIS v13.3 — SCORE RADAR (Intent Velocity Engine)
 * Visualizes visitor intent scores in real-time on the Boardroom.
 * Dependencies: ECharts (already loaded in boardroom)
 *
 * Data flow:
 *   WebSocket SCORE_SYNC → ScoreRadar.onData() → Chart + Timeline + Persona
 *   Simulation mode for demo/offline
 */
window.ScoreRadar = {
    _chart: null,
    _data: [],           // velocity data points [{time, value}]
    _maxPoints: 30,      // sliding window
    _rescueLog: [],      // rescue events [{time, city, score, persona}]
    _personas: {},       // {persona: count}
    _totalEvents: 0,
    _rescueCount: 0,
    _peakScore: 0,
    _simInterval: null,

    init() {
        const container = document.getElementById('score-velocity-chart');
        if (!container) return;

        // Intent Velocity sparkline (ECharts)
        this._chart = echarts.init(container);
        this._chart.setOption({
            grid: { top: 8, bottom: 20, left: 30, right: 8 },
            xAxis: {
                type: 'category', data: [],
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
                axisLabel: { show: false }
            },
            yAxis: {
                type: 'value', min: 0, max: 100,
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
                axisLabel: { fontSize: 8, color: 'rgba(255,255,255,0.3)' }
            },
            series: [{
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: { width: 2, color: '#00FFC2' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(0, 255, 194, 0.25)' },
                        { offset: 1, color: 'rgba(0, 255, 194, 0)' }
                    ])
                },
                markLine: {
                    silent: true,
                    symbol: 'none',
                    data: [{ yAxis: 85, lineStyle: { color: '#D4AF37', type: 'dashed', width: 1 } }],
                    label: { formatter: 'RESCUE', fontSize: 7, color: '#D4AF37', position: 'insideEndTop' }
                },
                data: []
            }]
        });

        // Start simulation (will be replaced by real WS data)
        this._startSimulation();

        console.log('📊 ScoreRadar v13.3: Intent Velocity Engine online.');
    },

    /** Process incoming score data */
    onData(payload) {
        const { score, city, action, persona } = payload;
        const now = new Date();
        const ts = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Track
        this._totalEvents++;
        if (score > this._peakScore) this._peakScore = score;

        // Velocity data
        this._data.push({ time: ts, value: score });
        if (this._data.length > this._maxPoints) this._data.shift();

        // Update chart
        this._chart.setOption({
            xAxis: { data: this._data.map(d => d.time) },
            series: [{ data: this._data.map(d => d.value) }]
        });

        // Persona tracking
        const p = persona || 'default';
        this._personas[p] = (this._personas[p] || 0) + 1;

        // Rescue detection (85+)
        if (score >= 85) {
            this._rescueCount++;
            this._rescueLog.unshift({ time: ts, city: city || '—', score, persona: p });
            if (this._rescueLog.length > 8) this._rescueLog.pop();

            // Update rescue timeline UI
            this._renderTimeline();

            // Trigger heatmap flare
            if (window.triggerNodePulse) {
                window.triggerNodePulse(city, '#00FFC2');
            }
        }

        // Update KPI counters
        this._updateKPIs();
    },

    /** Render rescue timeline */
    _renderTimeline() {
        const el = document.getElementById('score-rescue-timeline');
        if (!el) return;

        el.innerHTML = this._rescueLog.map(r => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:3px;background:rgba(212,175,55,0.06);border-left:2px solid #D4AF37;border-radius:0 4px 4px 0;font-size:9px;">
                <span style="color:rgba(255,255,255,0.5);font-family:monospace;">${r.time}</span>
                <span style="color:#fff;font-weight:600;">${r.city}</span>
                <span style="color:#D4AF37;font-family:monospace;">${r.score}</span>
                <span style="color:rgba(255,255,255,0.3);font-size:8px;">${r.persona}</span>
            </div>
        `).join('');
    },

    /** Update dashboard KPIs */
    _updateKPIs() {
        const eventsEl = document.getElementById('score-total-events');
        const rescueEl = document.getElementById('score-rescue-count');
        const peakEl = document.getElementById('score-peak');

        if (eventsEl) eventsEl.textContent = this._totalEvents;
        if (rescueEl) rescueEl.textContent = this._rescueCount;
        if (peakEl) peakEl.textContent = this._peakScore;
    },

    /** Simulation mode — generates realistic score patterns */
    _startSimulation() {
        const cities = ['London', 'Istanbul', 'Antalya', 'Dubai', 'Zurich'];
        const personas = ['luxury', 'fast-track', 'wellness', 'default', 'romantic'];
        const actions = ['card_view', 'scroll_75', 'cta_click', 'hover_deep', 'modal_open'];

        this._simInterval = setInterval(() => {
            // Simulate realistic score oscillation
            const baseScore = 55 + Math.random() * 40; // 55-95 range
            const score = Math.round(Math.min(100, baseScore));
            const city = cities[Math.floor(Math.random() * cities.length)];
            const persona = personas[Math.floor(Math.random() * personas.length)];
            const action = actions[Math.floor(Math.random() * actions.length)];

            this.onData({ score, city, action, persona });
        }, 3000);
    },

    /** Stop simulation (call when real WS data flows) */
    stopSimulation() {
        if (this._simInterval) {
            clearInterval(this._simInterval);
            this._simInterval = null;
            console.log('📊 ScoreRadar: Simulation stopped, switching to live data.');
        }
    },

    /** Cleanup */
    destroy() {
        this.stopSimulation();
        if (this._chart) {
            this._chart.dispose();
            this._chart = null;
        }
    }
};
