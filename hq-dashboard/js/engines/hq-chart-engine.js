import { hqStore } from '../core/hq-store.js';

export class HQChartEngine {
    constructor() {
        this.chartInstance = null;
        this.ctx = document.getElementById('revenueForecastChart')?.getContext('2d');
        if (this.ctx) {
            this.init();
        }
    }

    init() {
        hqStore.subscribe(state => this.render(state));
    }

    render(state) {
        if (!state.forecast || !this.ctx) return;
        const { historical, ai } = state.forecast;
        
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const combinedLabels = [...historical.labels, ...ai.labels];
        const lastHistVal = historical.data.length > 0 ? historical.data[historical.data.length - 1] : null;
        
        const historicalPad = [...historical.data, ...Array(Math.max(0, ai.labels.length)).fill(null)];
        const aiPad = [...Array(Math.max(0, historical.labels.length - 1)).fill(null), lastHistVal, ...ai.data];

        this.chartInstance = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: combinedLabels,
                datasets: [
                    {
                        label: 'Gerçekleşen Ciro',
                        data: historicalPad,
                        borderColor: '#10b981', 
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#10b981',
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'YZ Projeksiyonu',
                        data: aiPad,
                        borderColor: '#a855f7', 
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointBackgroundColor: '#a855f7',
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#94a3b8',
                        bodyColor: '#e2e8f0',
                        borderColor: 'rgba(168, 85, 247, 0.3)',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#64748b', maxTicksLimit: 10 }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: '#64748b',
                            callback: function(value) { return '€' + (value/1000).toFixed(0) + 'K'; }
                        }
                    }
                }
            }
        });
    }
}
