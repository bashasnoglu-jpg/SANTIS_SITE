/**
 * ═══════════════════════════════════════════════════════════
 * SANTIS OS - Art Director Dashboard Engine (Phase 43)
 * ═══════════════════════════════════════════════════════════
 */

async function bootDashboard() {
    try {
        console.log("🦅 [Art Director UI] Bilişsel arayüz uyanıyor...");
        const [metricsRes, feedRes] = await Promise.all([
            fetch('/api/v1/art-director/metrics'),
            fetch('/api/v1/art-director/feed')
        ]);
        
        if (!metricsRes.ok || !feedRes.ok) throw new Error("API Gateway Unreachable");

        const metrics = await metricsRes.json();
        const feed = await feedRes.json();

        renderKPIs(metrics);
        renderRadar(metrics.scoreBreakdown);
        renderFeed(feed);
        renderAnalytics(metrics);
        
    } catch (e) {
        console.error("☠️ [Art Director UI] Çekirdek Bağlantı Hatası:", e);
        document.getElementById('kpi-grid').innerHTML = `<div style="color: #f87171; font-family: monospace;">Sistem Çevrimdışı. Node sunucusunu kontrol edin.</div>`;
    }
}

function renderKPIs(metrics) {
    const grid = document.getElementById('kpi-grid');
    grid.innerHTML = `
        <div class="card"><span class="kicker">ORTALAMA SKOR</span><p class="text-[#d4af37] value">${metrics.avgScore}</p></div>
        <div class="card"><span class="kicker">RED ORANI (REJECT)</span><p class="value">${(metrics.rejectRate*100).toFixed(0)}%</p></div>
        <div class="card"><span class="kicker">REGENERATION AVG</span><p class="value">${metrics.regenerationAvg}</p></div>
        <div class="card"><span class="kicker">ORT. RENDER SÜRESİ</span><p class="value">${metrics.avgRenderTime}</p></div>
    `;
}

function renderRadar(scores) {
    const chart = echarts.init(document.getElementById('scoreRadar'), 'dark');
    
    const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        radar: {
            indicator: [
                { name: 'Luxury Aesthetic', max: 1 },
                { name: 'Minimalism', max: 1 },
                { name: 'Lighting Integrity', max: 1 },
                { name: 'Brand Fit', max: 1 }
            ],
            axisName: { color: '#D4AF37', fontSize: 13, fontFamily: 'Cinzel' },
            splitNumber: 4,
            splitArea: { areaStyle: { color: ['rgba(212,175,55,0.01)', 'rgba(212,175,55,0.03)', 'transparent', 'transparent'] } },
            axisLine: { lineStyle: { color: 'rgba(212,175,55,0.2)' } },
            splitLine: { lineStyle: { color: 'rgba(212,175,55,0.2)' } }
        },
        series: [{
            name: 'Aesthetic Alignment',
            type: 'radar',
            data: [{
                value: [scores.luxury, scores.minimalism, scores.lighting, scores.brandFit],
                name: 'Gemini 2.5 Pro Scoring',
                areaStyle: { color: 'rgba(212,175,55, 0.2)' },
                lineStyle: { width: 2, color: '#D4AF37' },
                itemStyle: { color: '#D4AF37' },
                symbol: 'circle',
                symbolSize: 6
            }]
        }]
    };
    
    chart.setOption(option);
    
    // Auto Resize
    window.addEventListener('resize', () => chart.resize());
}

function renderFeed(feed) {
    const container = document.getElementById('liveFeed');
    container.innerHTML = feed.map(item => `
        <div class="feed-item">
            <div>
                <span style="font-size:0.65rem; color:#555; font-family: monospace;">[${new Date(item.timestamp).toLocaleTimeString()}]</span><br>
                <span style="font-family:monospace; font-size:0.85rem; color:#bbb;">"${item.prompt.substring(0,35)}..."</span>
            </div>
            <div style="text-align:right;">
                <span class="${item.status === 'accepted' ? 'status-accepted' : 'status-rejected'}">${item.status.toUpperCase()}</span><br>
                <span style="font-size:0.75rem; color:#888;">Score: ${item.score} | Lvl: ${item.iterations}</span>
            </div>
        </div>
    `).join('');
}

function renderAnalytics(metrics) {
    // 1. Reject Reasons
    const rejectHtml = Object.entries(metrics.rejectReasons)
        .sort((a,b) => b[1] - a[1]) // highest first
        .map(([key, val]) => `
            <div class="flex" style="justify-content:space-between; margin-bottom:12px; font-size: 0.9rem;">
                <span style="text-transform: capitalize;">${key.replace('_',' ')}</span>
                <span style="color:#f87171; background: rgba(248, 113, 113, 0.1); padding: 2px 8px; border-radius: 4px;">${val} İhlal</span>
            </div>
        `).join('');
    document.getElementById('rejectAnalytics').innerHTML = rejectHtml;
    
    // 2. Top Performers
    const topHtml = metrics.topPerformers
        .map(p => `
            <div class="flex" style="justify-content:space-between; margin-bottom:12px; font-size: 0.9rem;">
                <span style="font-family:monospace; color:#ccc;">${p.id}</span>
                <span style="color:#60a5fa; background: rgba(96, 165, 250, 0.1); padding: 2px 8px; border-radius: 4px;">Score: ${p.score}</span>
            </div>
        `).join('');
    document.getElementById('topPerformers').innerHTML = topHtml;
        
    // 3. User Impact
    const impactColor = '#4ade80';
    document.getElementById('userImpact').innerHTML = `
        <div class="flex" style="justify-content:space-between; margin-bottom:12px; font-size: 0.9rem; align-items:center;">
            <span>Etkileşim Süresi (Dwell)</span>
            <span style="color:${impactColor}; font-weight:600; font-size:1.1rem;">${metrics.userImpact.dwellTime}</span>
        </div>
        <div class="flex" style="justify-content:space-between; margin-bottom:12px; font-size: 0.9rem; align-items:center;">
            <span>Kaydırma Derinliği (Depth)</span>
            <span style="color:${impactColor}; font-weight:600; font-size:1.1rem;">${metrics.userImpact.scrollDepth}</span>
        </div>
        <div class="flex" style="justify-content:space-between; margin-bottom:12px; font-size: 0.9rem; align-items:center;">
            <span>Dönüşüm Artışı (Conv)</span>
            <span style="color:${impactColor}; font-weight:600; font-size:1.1rem;">${metrics.userImpact.conversionLift}</span>
        </div>
    `;
}

// Global Boot Sequence
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootDashboard);
} else {
    bootDashboard();
}
