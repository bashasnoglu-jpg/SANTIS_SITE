/**
 * SANTIS SENTINEL V1.0 (Autonomous Performance & Security Guardian)
 * Otonom performans izleyici (LCP/CLS) ve Güvenlik/Hata kalkanı.
 */

window.__SENTINEL_THROTTLE__ = 1.0; // Default çarpan

class SantisSentinel {
    constructor() {
        this.anomalies = {
            lcp: 0,
            cls: 0,
            security: 0
        };
        this.init();
    }

    init() {
        console.log('⚡ Santis Sentinel V1: Active and Watching');
        this.initPerformanceSentinel();
        this.initSecuritySentinel();
        this.initPredictiveFeedback();
    }

    // H1 — The Performance Sentinel (LCP/CLS Guardian)
    initPerformanceSentinel() {
        if (!('PerformanceObserver' in window)) return;

        try {
            // LCP İzleyici
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];

                // SOVEREIGN ULTRA-STRICT PROTOCOL (1.5s LCP Limit)
                if (lastEntry && lastEntry.startTime > 1500) {
                    console.warn(`⚠️ Sentinel (LCP): Slow down detected (${Math.round(lastEntry.startTime)}ms). Auto-Fix routine initiated.`);
                    this.anomalies.lcp++;
                    this.autoFixLCP();
                }
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

            // CLS İzleyici
            const clsObserver = new PerformanceObserver((entryList) => {
                let clsValue = 0;
                let culprits = [];
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        if (entry.sources) {
                            entry.sources.forEach(source => {
                                if (source.node && source.node.tagName) {
                                    const className = (typeof source.node.className === 'string') ? source.node.className : '';
                                    const nodeStr = source.node.tagName.toLowerCase() + (source.node.id ? '#' + source.node.id : '') + (className ? '.' + className.replace(/\s+/g, '.') : '');
                                    if (!culprits.includes(nodeStr)) culprits.push(nodeStr);
                                }
                            });
                        }
                    }
                }
                if (clsValue > 0.1) {
                    console.warn(`⚠️ Sentinel (CLS): Layout shift anomaly detected (${clsValue.toFixed(3)}). Elements: ${culprits.join(', ')}`);
                    this.anomalies.cls++;
                }
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });

        } catch (e) {
            console.error('Sentinel PerformanceObserver Error:', e);
        }
    }

    autoFixLCP() {
        // LCP yüksek çıkarsa ağı zorlamayı azalt, adaptif kaliteyi 'slow' moduna geçir
        document.documentElement.setAttribute('data-net', 'slow');
        document.documentElement.style.setProperty('--nq-quality', '60');

        // Varsa yavaşlatan videoları durdur
        document.querySelectorAll('video[autoplay]').forEach(v => {
            v.pause();
            v.removeAttribute('autoplay');
        });

        // Prefetch çarpanını agresif yavaşlat
        window.__SENTINEL_THROTTLE__ = 1.5;
    }

    // H2 — The Security Sentinel (Paranoid Mode Guard)
    initSecuritySentinel() {
        // Dinamik script/CSP ihlal yakalama
        document.addEventListener('securitypolicyviolation', (e) => {
            console.error(`🚨 Sentinel (Security): CSP Violation Detect! Disabling non-essential modules. [${e.violatedDirective}]`);
            this.anomalies.security++;
            this.triggerParanoidMode();
        });

        // Genel resource load error takibi
        window.addEventListener('error', (e) => {
            if (e.target.tagName === 'SCRIPT' || e.target.tagName === 'IMG' || e.target.tagName === 'LINK') {
                // Sık hata veren dış kaynak varsa karantina
                const src = e.target.src || e.target.href;
                console.warn(`🛡️ Sentinel (Resource): Failed to load asset -> ${src}`);
            }
        }, true);
    }

    triggerParanoidMode() {
        sessionStorage.setItem('santis_paranoid_mode', 'ACTIVE');
        // Kötü huylu/injection ihtimaline karşı external fetch'leri iptal etmek için API_BASE üzerine block konabilir
        // Mevcut durumda meta elementi ile strict-dynamic zorlar.
        const meta = document.createElement('meta');
        meta.httpEquiv = "Content-Security-Policy";
        meta.content = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;";
        document.head.appendChild(meta);
        console.warn('🔒 Sentinel: Paranoid Mode Activated by CSP Violation.');
    }

    // H3 — Predictive Feedback Loop (Zekâ Tahkimatı)
    initPredictiveFeedback() {
        // BFCache (Back/Forward Cache) zehrini önlemek için 'beforeunload' yerine 'pagehide' kullanıyoruz (Protocol 25)
        window.addEventListener('pagehide', () => {
            let prefetchFails = parseInt(sessionStorage.getItem('santis_prefetch_fails') || '0');
            if (prefetchFails > 10) {
                // Sistemi yoruyor, bir sonraki ziyarette prefetch'i yavaşlat
                sessionStorage.setItem('santis_throttle_multiplier', '1.5');
            }
        });

        // Başlangıçta throttle'u sessionStorage'dan oku
        const savedThrottle = sessionStorage.getItem('santis_throttle_multiplier');
        if (savedThrottle) {
            window.__SENTINEL_THROTTLE__ = parseFloat(savedThrottle);
            console.log(`🤖 Sentinel: Autonomous Throttle Adjust -> ${window.__SENTINEL_THROTTLE__}x`);
        }
    }
}

// Otonom olarak başlat
if (!window.__SANTIS_SENTINEL_BOOTED__) {
    window.__SANTIS_SENTINEL_BOOTED__ = true;
    new SantisSentinel();
}
