/**
 * =======================================================
 * SANTIS OS - V6.2 ANTICIPATION ENGINE
 * Core Module: The Risk Profiler (Sensör Ağı)
 * =======================================================
 * Bu modül; ekrandaki FPS dalgalanmalarını, cihaz ısınmasını
 * (LongTask) ve RAM darboğazını ölçerek, Load Balancer
 * veya NeuralBus için bir "Risk Skoru (0-100)" üretir.
 */

export const RiskProfiler = (function() {
    let riskScore = 0; // 0: Kusursuz, 100: Kritik Çöküş Tehlikesi
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fps = 60;
    let isActive = false;
    let _neuralBus = null;

    // Sensör Verileri
    const metrics = {
        longTasksCount: 0,
        memoryUsage: 0, // MB
        downlink: 10,   // Mbps
    };

    // 1. FPS Ölçüm Sensörü (Görsel Akıcılık Kalkanı)
    function trackFPS(now) {
        if (!isActive) return;
        frameCount++;
        if (now - lastFrameTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFrameTime = now;
            evaluateRisk(); // Saniyede bir skoru güncelle
        }
        requestAnimationFrame(trackFPS);
    }

    // 2. LongTask (Ekran Donması / Cihaz Isınması) Sensörü
    function initPerformanceObserver() {
        if (!('PerformanceObserver' in window)) return;
        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    // Ana Threade'i 50ms'den fazla kilitleyen görevler (Micro-Freezes)
                    if (entry.duration > 50) {
                        metrics.longTasksCount++;
                        console.warn(`🔥 [RISK PROFILER] Ana İşlemci Takılması (LongTask): ${entry.duration.toFixed(0)}ms`);
                        
                        // Acil Risk Enjeksiyonu
                        riskScore = Math.min(100, riskScore + 15);
                        broadcastWarningIfCritical();
                    }
                });
            });
            observer.observe({ type: 'longtask', buffered: true });
        } catch (e) {
            console.error("Risk Profiler PerformanceObserver hatası:", e);
        }
    }

    // 3. Ağ (Network) ve RAM Sensörü
    function pollHardwareMetrics() {
        // Bellek (Chrome/Edge Only)
        if (performance.memory) {
            metrics.memoryUsage = performance.memory.usedJSHeapSize / (1024 * 1024);
        }
        // Ağ Hızı
        if (navigator.connection && navigator.connection.downlink) {
            metrics.downlink = navigator.connection.downlink;
        }
    }

    // 4. Sentetik Karar Motoru (Risk Scorunu Belirler)
    function evaluateRisk() {
        pollHardwareMetrics();
        let newScore = 0;

        // A. FPS Cezası (60 altına inildikçe asimptotik olarak artar)
        if (fps < 50) newScore += (50 - fps) * 2; 
        if (fps < 30) newScore += 40; // Çok kritik FPS düşüşü

        // B. Görev Bloğu Cezası (Zamanla soğur / Decay)
        if (metrics.longTasksCount > 0) {
            newScore += Math.min(50, metrics.longTasksCount * 10);
            metrics.longTasksCount = Math.max(0, metrics.longTasksCount - 0.5); // Soğuma (Decay)
        }

        // C. Bellek Cezası (500MB üstü risklidir)
        if (metrics.memoryUsage > 500) {
            newScore += Math.min(30, (metrics.memoryUsage - 500) / 10);
        }

        // D. Zayıf Ağ Cezası (Sovereign Ghosting için tehlike)
        if (metrics.downlink < 2) newScore += 20;

        // Otonom Düzleştirme (Smoothening)
        // Yeni skor ile eski skoru yumuşak bir şekilde harmanlar (Ani sıçramaları önler)
        riskScore = (riskScore * 0.7) + (newScore * 0.3);
        riskScore = Math.min(100, Math.max(0, riskScore));

        // Skor 60'ı geçerse NeuralBus aracılığıyla God's Eye paneline kriptolu uyarı gönder
        broadcastWarningIfCritical();
    }

    function broadcastWarningIfCritical() {
        // 60 ve üstü skor LÜKS algısını (UX) tehdit eder. Load Balancer'dan müdahale istenir.
        if (riskScore >= 60 && _neuralBus) {
            try {
                // Merkezi sinir sisteminden merkeze raporla
                _neuralBus.send('SOVEREIGN_TELEMETRY', {
                    module: 'RiskProfiler',
                    riskScore: riskScore.toFixed(1),
                    fps: fps,
                    memory: metrics.memoryUsage.toFixed(1)
                });

                // UI Katmanına "Efektleri Kıs" Sinyali (Global Event)
                document.dispatchEvent(new CustomEvent('SantisRiskElevated', {
                    detail: { riskScore, fps }
                }));

                console.log(`%c⚠️ [RISK PROFILER] Sistem Stres Seviyesi Yüksek: %${riskScore.toFixed(0)} - Zarafet Moduna Geçiliyor.`, 'color: #f59e0b; font-weight:bold;');
            } catch (err) {}
        }
    }

    let _history = [];

    return {
        init: function(neuralBusInstance) {
            if (isActive) return;
            isActive = true;
            _neuralBus = neuralBusInstance;
            
            initPerformanceObserver();
            requestAnimationFrame(trackFPS);
            
            console.log("👁️ [RISK PROFILER] V6.2 Uyanış Tamamlandı. Performans pikselleri izleniyor.");
            return this;
        },
        getRiskScore: () => {
            _history.push(riskScore);
            if (_history.length > 5) _history.shift();
            // smoothing (anti-spike)
            return _history.reduce((a,b)=>a+b,0) / _history.length;
        },
        getMetrics: () => ({ ...metrics, fps, rawRisk: riskScore })
    };
})();
