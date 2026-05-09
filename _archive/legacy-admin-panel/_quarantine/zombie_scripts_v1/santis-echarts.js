// [SOVEREIGN SEAL: NEO-CORTEX_ECHARTS_v1]

const SovereignCharts = (function () {
    let radarChart = null;
    let pulseChart = null;

    const GOLD_HEX = '#D4AF37';
    let pulseQueue = Array(30).fill(0);
    let timeAxis = Array(30).fill('');

    function init() {
        // 1. REVENUE RADAR (Kategori Hakimiyeti)
        radarChart = echarts.init(document.getElementById('echarts-revenue-radar'));
        const radarOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'item', backgroundColor: 'rgba(5,5,5,0.9)', borderColor: GOLD_HEX, textStyle: { color: GOLD_HEX, fontFamily: 'monospace' } },
            radar: {
                indicator: [
                    { name: 'Skincare', max: 100 },
                    { name: 'Hammam', max: 100 },
                    { name: 'Massage', max: 100 },
                    { name: 'Beauty', max: 100 },
                    { name: 'Whale Intent', max: 100 }
                ],
                shape: 'polygon',
                radius: '60%',
                axisName: { color: '#888', fontWeight: 'bold', fontFamily: 'monospace', fontSize: 10 },
                splitLine: { lineStyle: { color: ['rgba(212,175,55,0.05)', 'rgba(212,175,55,0.15)'] } },
                splitArea: { show: false },
                axisLine: { lineStyle: { color: 'rgba(212,175,55,0.2)' } }
            },
            series: [{
                name: 'Kognitif Yoğunluk (SAS)',
                type: 'radar',
                data: [{
                    value: [85, 45, 90, 60, 95], // Otonom Başlangıç Durumu
                    name: 'Matrix Dominance',
                    itemStyle: { color: GOLD_HEX },
                    areaStyle: { color: 'rgba(212, 175, 55, 0.2)' },
                    lineStyle: { width: 2, shadowBlur: 15, shadowColor: GOLD_HEX }
                }]
            }]
        };

        // 2. LIVE PULSE FLOW (Sıvı MRR/SAS Çizgisi)
        pulseChart = echarts.init(document.getElementById('echarts-pulse-flow'));
        const pulseOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', borderColor: GOLD_HEX, textStyle: { color: GOLD_HEX } },
            grid: { left: '2%', right: '5%', top: '10%', bottom: '5%', containLabel: true },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: timeAxis,
                axisLine: { lineStyle: { color: 'rgba(212,175,55,0.2)' } },
                axisLabel: { show: false } // Kinetik akış hissi için yazıları gizliyoruz
            },
            yAxis: {
                type: 'value',
                min: 'dataMin', // Dalgalanmayı hissettirir
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)', type: 'dashed' } },
                axisLabel: { color: GOLD_HEX, fontFamily: 'monospace', fontSize: 10 }
            },
            series: [{
                name: 'MRR Lift (€)',
                type: 'line',
                smooth: 0.4, // Akıcı Bezier Çizgisi (Sürtünmesiz)
                symbol: 'none',
                itemStyle: { color: GOLD_HEX },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(212,175,55,0.5)' },
                        { offset: 1, color: 'rgba(212,175,55,0.0)' }
                    ])
                },
                lineStyle: { width: 3, shadowBlur: 12, shadowColor: GOLD_HEX },
                data: pulseQueue
            }]
        };

        radarChart.setOption(radarOption);
        pulseChart.setOption(pulseOption);

        // Anti-Gravity: Ekran yeniden boyutlandığında sıvı adaptasyon
        window.addEventListener('resize', () => { radarChart.resize(); pulseChart.resize(); });
    }

    // [ACTION]: Canlı veriyi sıvı gibi akıtır
    const triggerPulseSpike = (mrrValue) => {
        const now = new Date();
        timeAxis.shift();
        timeAxis.push(`${now.getSeconds()}s`);

        pulseQueue.shift();
        pulseQueue.push(mrrValue);

        pulseChart.setOption({ xAxis: { data: timeAxis }, series: [{ data: pulseQueue }] });
    };

    // [ACTION]: Kategori yoğunluğu değiştiğinde ağı otonom bük
    const mutateRadar = (skincare, hammam, massage, beauty, whale) => {
        radarChart.setOption({
            series: [{ data: [{ value: [skincare, hammam, massage, beauty, whale], name: 'Live Dominance' }] }]
        });
    };

    return { init, triggerPulseSpike, mutateRadar };
})();

document.addEventListener('DOMContentLoaded', () => SovereignCharts.init());
