/**
 * SANTIS OS - GOD'S EYE TELEMETRY (PHASE 32)
 * Real-Time Behavioral EKG Radar via Apache ECharts.
 * Transforms High-Cardinality Interaction signals into visual pulse waves.
 */

class SantisGodsEye {
    constructor() {
        this.canvasId = 'gods-eye-ekg-canvas';
        this.chart = null;
        this.dataStream = [];
        this.maxDataPoints = 60; // 60 seconds of EKG data
        this.pulseInterval = null;

        // ECharts Configs
        this.colors = {
            gold: '#D4AF37',
            blue: '#3b82f6',
            purple: '#a855f7',
            emerald: '#10b981',
            darkPulse: 'rgba(212,175,55,0.05)',
            grid: 'rgba(255,255,255,0.05)',
            text: '#6b7280'
        };

        this.sankeyChart = null;
        this.rationaleChart = null;

        this.init();
    }

    init() {
        if (!document.getElementById(this.canvasId)) {
            console.warn("👁️ [God's Eye] Canvas element not found. Waiting for DOM.");
            setTimeout(() => this.init(), 1000);
            return;
        }

        if (typeof echarts === 'undefined') {
            console.warn("👁️ [God's Eye] ECharts library not loaded. Retrying...");
            setTimeout(() => this.init(), 1000);
            return;
        }

        console.log("👁️ [God's Eye] Sovereign EKG Telemetry Engine Onlining...");

        // Pre-fill dummy zero baseline
        let now = +new Date();
        for (let i = 0; i < this.maxDataPoints; i++) {
            this.dataStream.push(this.randomData(now - (this.maxDataPoints - i) * 1000));
        }

        // Initialize Phase 32.1 Charts
        const sankeyEl = document.getElementById('gods-eye-sankey-canvas');
        if(sankeyEl) {
            this.sankeyChart = echarts.init(sankeyEl, 'dark');
            this.renderSankeyChart();
        }

        const rationaleEl = document.getElementById('gods-eye-rationale-canvas');
        if(rationaleEl) {
            this.rationaleChart = echarts.init(rationaleEl, 'dark');
            this.renderRationaleChart();
        }

        this.chart = echarts.init(document.getElementById(this.canvasId), 'dark');
        this.renderChart();
        this.startPulse();

        // Responsive Resizing
        window.addEventListener('resize', () => {
            if (this.chart) this.chart.resize();
            if (this.sankeyChart) this.sankeyChart.resize();
            if (this.rationaleChart) this.rationaleChart.resize();
        });
    }

    randomData(time) {
        // Base sine wave representing system breathing + random jitter (friction)
        const basePulse = Math.sin(time / 1000) * 10;
        const frictionJitter = Math.random() < 0.1 ? (Math.random() * 50) : (Math.random() * 5); // Sudden spikes
        return {
            name: new Date(time).toISOString(),
            value: [
                time,
                Math.round(20 + basePulse + frictionJitter)
            ]
        };
    }

    renderChart() {
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0,0,0,0.8)',
                borderColor: this.colors.gold,
                textStyle: { color: '#fff', fontSize: 10, fontFamily: 'monospace' },
                axisPointer: { animation: false }
            },
            grid: {
                top: 20,
                bottom: 20,
                left: 30,
                right: 10
            },
            xAxis: {
                type: 'time',
                splitLine: { show: true, lineStyle: { color: this.colors.grid, type: 'dashed' } },
                axisLabel: { color: this.colors.text, fontSize: 9, fontFamily: 'monospace' },
                axisLine: { lineStyle: { color: '#333' } }
            },
            yAxis: {
                type: 'value',
                boundaryGap: [0, '100%'],
                splitLine: { show: true, lineStyle: { color: this.colors.grid } },
                axisLabel: { color: this.colors.text, fontSize: 9, fontFamily: 'monospace' },
                max: 100
            },
            series: [
                {
                    name: 'Friction EKG',
                    type: 'line',
                    showSymbol: false,
                    hoverAnimation: false,
                    data: this.dataStream,
                    itemStyle: { color: this.colors.gold },
                    lineStyle: { width: 2, shadowColor: this.colors.gold, shadowBlur: 10 },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(212,175,55,0.4)' },
                            { offset: 1, color: 'rgba(212,175,55,0.0)' }
                        ])
                    }
                }
            ]
        };

        this.chart.setOption(option);
    }

    startPulse() {
        // In a real Phase 32 implementation, this receives WebSocket OTLP streams.
        // Here we simulate the OTLP stream ingestion.
        this.pulseInterval = setInterval(() => {
            const now = new Date();
            
            // Check if Interaction Engine is feeding live friction score via EventBus (if available)
            let liveFriction = 0;
            if (window.SantisFrictionEngine && typeof window.SantisFrictionEngine.getScore === 'function') {
                liveFriction = window.SantisFrictionEngine.getScore();
            }

            // Generate synthetic pulse + inject live interaction friction
            const time = +now;
            const baseValue = this.randomData(time).value[1];
            const finalValue = Math.min(100, baseValue + (liveFriction / 2));

            this.dataStream.shift();
            this.dataStream.push({
                name: now.toISOString(),
                value: [time, finalValue]
            });

            this.chart.setOption({
                series: [{ data: this.dataStream }]
            });
            
            // Sankey & Logic Dynamic Ticks
            this.updatePhase32Charts();
            
        }, 1000); // 1Hz telemetry stream update
    }

    renderSankeyChart() {
        const option = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'item', triggerOn: 'mousemove', backgroundColor: 'rgba(0,0,0,0.8)', borderColor: this.colors.blue, textStyle: { fontFamily: 'monospace', fontSize: 10 } },
            series: {
                type: 'sankey',
                layout: 'none',
                emphasis: { focus: 'adjacency' },
                nodeAlign: 'right',
                top: 10, bottom: 10, left: 10, right: 30,
                data: [
                    { name: 'Home_Page' }, { name: 'Voice_Command' }, { name: 'Rituals' },
                    { name: 'Bronze_Massage' }, { name: 'Skincare' }, { name: 'Booking_Conversion' }, { name: 'Bounce' }
                ],
                links: [
                    { source: 'Home_Page', target: 'Rituals', value: 45 },
                    { source: 'Voice_Command', target: 'Bronze_Massage', value: 20 },
                    { source: 'Voice_Command', target: 'Skincare', value: 8 },
                    { source: 'Rituals', target: 'Bronze_Massage', value: 30 },
                    { source: 'Rituals', target: 'Skincare', value: 10 },
                    { source: 'Rituals', target: 'Bounce', value: 5 },
                    { source: 'Bronze_Massage', target: 'Booking_Conversion', value: 40 },
                    { source: 'Bronze_Massage', target: 'Bounce', value: 10 },
                    { source: 'Skincare', target: 'Booking_Conversion', value: 12 },
                    { source: 'Skincare', target: 'Bounce', value: 6 }
                ],
                itemStyle: { borderWidth: 1, borderColor: '#aaa' },
                lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.3 }
            }
        };
        this.sankeyChart.setOption(option);
    }

    renderRationaleChart() {
        const option = {
            backgroundColor: 'transparent',
            tooltip: { formatter: '{b} ({c})', backgroundColor: 'rgba(0,0,0,0.8)', borderColor: this.colors.purple, textStyle: { fontFamily: 'monospace', fontSize: 10 } },
            radar: {
                indicator: [
                    { name: 'Confidence', max: 100 },
                    { name: 'Context Match', max: 100 },
                    { name: 'Session Friction', max: 100 },
                    { name: 'Conversion Prob.', max: 100 },
                    { name: 'Biometric Sync', max: 100 }
                ],
                radius: 60,
                center: ['50%', '50%'],
                splitArea: { areaStyle: { color: ['rgba(168,85,247,0.1)', 'rgba(168,85,247,0.05)', 'transparent'] } },
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } }
            },
            series: [{
                name: 'Aurelia Logic Matrix',
                type: 'radar',
                data: [{
                    value: [92, 85, 12, 78, 95],
                    name: 'Latest Decision',
                    areaStyle: { color: 'rgba(168,85,247,0.3)' },
                    lineStyle: { color: this.colors.purple, width: 2 },
                    symbol: 'circle',
                    itemStyle: { color: this.colors.purple }
                }]
            }]
        };
        this.rationaleChart.setOption(option);
    }

    updatePhase32Charts() {
        if (!this.rationaleChart) return;
        // Mikro-animasyon (Aurelia düşünme dalgalanması)
        const radarData = [
            Math.min(100, Math.max(80, 92 + (Math.random() * 10 - 5))),
            Math.min(100, Math.max(70, 85 + (Math.random() * 10 - 5))),
            Math.max(0, 12 + (Math.random() * 10 - 5)),
            Math.min(100, Math.max(60, 78 + (Math.random() * 10 - 5))),
            Math.min(100, Math.max(90, 95 + (Math.random() * 4 - 2)))
        ];
        this.rationaleChart.setOption({
            series: [{
                data: [{
                    value: radarData.map(v => Math.round(v)),
                    name: 'Latest Decision'
                }]
            }]
        });
    }
}

// Auto-Mount to Sovereign OS Hub
document.addEventListener('DOMContentLoaded', () => {
    window.GodsEyeCore = new SantisGodsEye();
});
