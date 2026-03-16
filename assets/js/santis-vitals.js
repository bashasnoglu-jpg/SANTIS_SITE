/**
 * ═══════════════════════════════════════════════════════════════
 * SANTIS CORE WEB VITALS RUM (Real User Monitoring) v1.0
 * ═══════════════════════════════════════════════════════════════
 * 
 * Amaç: Gerçek kullanıcı bazlı LCP, CLS ve INP metriklerini ölçmek.
 * Eğer değerler Google standart eşiklerini geçerse (örneğin CLS > 0.1),
 * geliştirici konsoluna (dev tools) uyarı olarak basar.
 */

(function () {
    /* Native PerformanceObserver desteklenmiyorsa iptal */
    if (!('PerformanceObserver' in window)) return;

    const _isDebug = location.hostname === 'localhost' || new URLSearchParams(location.search).has('debug');

    // Thresholds (Google Core Web Vitals eşikleri)
    const THRESHOLDS = {
        LCP: 2500, // 2.5 sn altı Good
        CLS: 0.1,  // 0.1 altı Good
        INP: 200   // 200 ms altı Good
    };

    /** METRİK 1: Cumulative Layout Shift (CLS) */
    let clsValue = 0;
    let clsEntries = [];
    let sessionValue = 0;
    let sessionEntries = [];

    const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
                const firstSessionEntry = sessionEntries[0];
                const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

                if (sessionValue &&
                    entry.startTime - lastSessionEntry.startTime < 1000 &&
                    entry.startTime - firstSessionEntry.startTime < 5000) {
                    sessionValue += entry.value;
                    sessionEntries.push(entry);
                } else {
                    sessionValue = entry.value;
                    sessionEntries = [entry];
                }

                if (sessionValue > clsValue) {
                    clsValue = sessionValue;
                    clsEntries = sessionEntries;
                    clsReport();
                }
            }
        }
    });

    try {
        clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) { }

    const clsReport = () => {
        if (_isDebug && clsValue > THRESHOLDS.CLS) {
            console.warn(`🚨 [Santis Vitals] CLS İhlali: Değer ${clsValue.toFixed(3)} (Sınır: ${THRESHOLDS.CLS})`);
            // Opsiyonel: İzole edilen Shift hedeflerini logla
            // console.table(clsEntries);
        } else if (_isDebug && clsValue > 0) {
            console.info(`📊 [Santis Vitals] CLS: ${clsValue.toFixed(3)} (Good)`);
        }
    };

    /** METRİK 2: Largest Contentful Paint (LCP) */
    const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        if (_isDebug) {
            const lcpTime = lastEntry.renderTime || lastEntry.loadTime;
            if (lcpTime > THRESHOLDS.LCP) {
                 console.warn(`🚨 [Santis Vitals] LCP Yavaş: ${(lcpTime / 1000).toFixed(2)}s (Sınır: 2.5s)`);
            } else {
                 console.info(`📊 [Santis Vitals] LCP: ${(lcpTime / 1000).toFixed(2)}s (Good)`, lastEntry.element);
            }
        }
    });

    try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) { }


    /** METRİK 3: Interaction to Next Paint (INP) */
    // Native API INP ölçümü her tarayıcıda doğrudan buffered gelmeyebilir.
    // Ancak Event Timing API yardımıyla kabaca TBT/INP tahminlemesi:
    const inpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
            // INP, temelde etkileşimin (pointerdown, click vs) süresidir.
            if (entry.interactionId) {
                // Etkileşim süresi
                if (_isDebug && entry.duration > THRESHOLDS.INP) {
                     console.warn(`🚨 [Santis Vitals] INP Yavaş: ${entry.name} etkileşimi ${entry.duration}ms sürdü (Sınır: 200ms)`);
                }
            }
        }
    });

    try {
        inpObserver.observe({ type: 'event', durationThreshold: 40, buffered: true }); 
    } catch (e) { }

    
    if (_isDebug) {
        console.log(`⏱️ [Santis Vitals] Performance Observers (RUM) Active.`);
    }

})();
