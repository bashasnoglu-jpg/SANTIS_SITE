/**
 * SANTIS ADMIN ANALYTICS DASHBOARD (Phase 28.5 - Ultra Mega)
 * Visualizes Oracle Data in Real-Time with Cyber AI Aesthetic
 */

if (typeof AdminAnalytics === 'undefined') {
    class AdminAnalytics {
        constructor() {
            this.init();
        }

        init() {
            this.injectContainer();
            this.fetchData();
            setInterval(() => this.fetchData(), 15000); // Faster update (15s)
        }

        injectContainer() {
            const target = document.querySelector('main') || document.body;

            if (!document.getElementById('santis-analytics-board')) {
                const container = document.createElement('div');
                container.id = 'santis-analytics-board';
                container.className = 'analytics-dashboard ultra-mode';
                container.innerHTML = `
                <div class="analytics-header">
                    <h2>🧠 ORACLE INTELLIGENCE</h2>
                    <div class="live-indicator"><span class="pulse"></span> LIVE</div>
                </div>
                
                <div class="analytics-grid">
                    <!-- Card 1: Citizens -->
                    <div class="analytics-card card-cyan">
                        <h3>👥 Active Citizens</h3>
                        <div class="analytics-metric" id="metric-citizens">--</div>
                        <small>Total Profiles</small>
                        <div class="mini-chart" id="chart-citizens"></div>
                    </div>

                    <!-- Card 2: Dynamic Views -->
                    <div class="analytics-card card-purple">
                        <h3>🏠 Dynamic Views</h3>
                        <div class="analytics-metric" id="metric-dynamic">--</div>
                        <small>Today's Personalized Layouts</small>
                        <div class="mini-chart" id="chart-dynamic"></div>
                    </div>

                    <!-- Card 3: Interest Radar -->
                    <div class="analytics-card card-gold span-2">
                        <h3>👁️ Interest Radar</h3>
                        <div id="metric-interests" class="bar-chart-container"></div>
                    </div>
                </div>
            `;

                // Inject Advanced Styles
                const style = document.createElement('style');
                style.textContent = `
                .analytics-dashboard.ultra-mode {
                    margin: 20px;
                    padding: 25px;
                    background: linear-gradient(145deg, #0a0a0a, #111);
                    border: 1px solid #333;
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    font-family: 'Segoe UI', sans-serif;
                }
                .analytics-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 15px;
                }
                .analytics-header h2 {
                    margin: 0; color: #fff; font-size: 18px; letter-spacing: 2px;
                    background: linear-gradient(90deg, #fff, #666); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .live-indicator {
                    color: #00ff88; font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 8px;
                }
                .pulse {
                    width: 8px; height: 8px; background: #00ff88; border-radius: 50%;
                    box-shadow: 0 0 10px #00ff88;
                    animation: pulse 1.5s infinite;
                }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }

                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 20px;
                }
                .analytics-card {
                    background: rgba(255,255,255,0.03);
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.05);
                    transition: transform 0.3s, box-shadow 0.3s;
                }
                .analytics-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    border-color: rgba(255,255,255,0.1);
                }
                .analytics-card.span-2 { grid-column: span 2; }
                @media (max-width: 768px) { .analytics-card.span-2 { grid-column: span 1; } }

                .analytics-card h3 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #888; }
                .analytics-metric { font-size: 36px; font-weight: 700; color: #eee; line-height: 1; margin-bottom: 5px; }
                .analytics-card small { color: #555; font-size: 11px; }

                /* Colors */
                .card-cyan h3 { color: #00ffff; }
                .card-purple h3 { color: #d600ff; }
                .card-gold h3 { color: #ffd700; }

                /* Interest Bars */
                .bar-chart-row { display: flex; align-items: center; margin-bottom: 8px; font-size: 13px; color: #ccc; }
                .bar-label { width: 90px; text-transform: capitalize; }
                .bar-track { flex: 1; background: #222; height: 6px; border-radius: 3px; overflow: hidden; margin: 0 10px; }
                .bar-fill { height: 100%; border-radius: 3px; width: 0; transition: width 1s ease-out; }
                .bar-value { width: 30px; text-align: right; color: #fff; font-weight: bold; }

                .fill-cyan { background: #00ffff; box-shadow: 0 0 10px rgba(0,255,255,0.3); }
                .fill-purple { background: #d600ff; box-shadow: 0 0 10px rgba(214,0,255,0.3); }
                .fill-gold { background: #ffd700; box-shadow: 0 0 10px rgba(255,215,0,0.3); }
                .fill-def { background: #444; }
            `;
                document.head.appendChild(style);

                target.insertBefore(container, target.firstChild);
            }
        }

        async fetchData() {
            try {
                const res = await fetch('/api/admin/analytics/dashboard');
                if (res.ok) {
                    const data = await res.json();
                    this.render(data);
                }
            } catch (e) {
                console.error("Analytics Error:", e);
            }
        }

        render(data) {
            if (!data) return;

            // 1. Citizens
            const citizenEl = document.getElementById('metric-citizens');
            if (citizenEl) citizenEl.innerText = data.total_users || 0;

            // 2. Dynamic Views
            const dynamicEl = document.getElementById('metric-dynamic');
            if (dynamicEl) dynamicEl.innerText = data.dynamic_homepage_views || 0;

            // 3. Interest Chart
            const interestContainer = document.getElementById('metric-interests');
            if (interestContainer && data.interest_stats) {
                const stats = data.interest_stats;
                // Filter out 'def' if we want cleaner look, or keep it.
                // Let's remove 'def' for radar if it dominates? No, show it as 'General'.

                let total = 0;
                for (let k in stats) total += stats[k];

                let html = '';
                const sorted = Object.keys(stats).sort((a, b) => stats[b] - stats[a]);

                const colors = ['fill-gold', 'fill-cyan', 'fill-purple', 'fill-def'];

                sorted.forEach((key, idx) => {
                    const count = stats[key];
                    const pct = total > 0 ? (count / total * 100).toFixed(0) : 0;
                    const label = key === 'def' ? 'General' : key;
                    const colorClass = colors[idx % colors.length];

                    html += `
                    <div class="bar-chart-row">
                        <div class="bar-label">${label}</div>
                        <div class="bar-track">
                            <div class="bar-fill ${colorClass}" style="width: ${pct}%"></div>
                        </div>
                        <div class="bar-value">${count}</div>
                    </div>
                `;
                });
                interestContainer.innerHTML = html;
            }
        }
    }
    window.AdminAnalytics = AdminAnalytics;
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminAnalytics();
});
