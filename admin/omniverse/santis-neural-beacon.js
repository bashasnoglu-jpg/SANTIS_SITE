/**
 * ========================================================================
 * SOVEREIGN NEURAL BEACON v1.0
 * ========================================================================
 * Anonim davranışsal telemetri toplayıcı.
 * GDPR-Safe: İsim, e-posta, çerez, IP veya PII ALMAZ.
 * Sadece vektörler toplar: tıklama koordinatları, scroll ivmesi,
 * hover tereddüdü (hesitation), ve dönüşüm sinyalleri.
 *
 * Size: <2 KB minified | Main Thread Impact: ~0ms (rAF batched)
 *
 * Usage:
 *   <script src="admin/omniverse/santis-neural-beacon.js" defer></script>
 *   Otomatik aktifleşir. Veri localStorage'a yazılır.
 *   Darwinian Traffic Router tarafından okunur.
 */

const SovereignBeacon = (() => {
    const SESSION_KEY = 'sv_beacon_' + Date.now();
    const BATCH_INTERVAL = 5000; // 5 saniyede bir flush
    const MAX_EVENTS = 200;

    let buffer = [];
    let scrollY = 0;
    let lastScrollTime = 0;
    let sessionStart = performance.now();
    let variantId = null; // Hangi layout varyantını gördüğü

    // ── EVENT COLLECTORS ──

    // 1. Tıklama Vektörü: {x, y, target_gravity_id, timestamp}
    const trackClick = (e) => {
        const gravityEl = e.target.closest('[data-gravity-id]');
        push({
            type: 'click',
            x: (e.clientX / window.innerWidth).toFixed(3),
            y: (e.clientY / window.innerHeight).toFixed(3),
            gid: gravityEl ? gravityEl.getAttribute('data-gravity-id') : null,
            t: elapsed()
        });
    };

    // 2. Scroll İvmesi: Hızlı kaydırma = kaçış, yavaş = ilgi
    const trackScroll = () => {
        const now = performance.now();
        const dt = now - lastScrollTime;
        const dy = Math.abs(window.scrollY - scrollY);
        const velocity = dt > 0 ? (dy / dt * 1000).toFixed(1) : 0;

        scrollY = window.scrollY;
        lastScrollTime = now;

        // Sadece anlamlı kaydırmalarda kaydet
        if (dy > 20) {
            push({
                type: 'scroll',
                v: parseFloat(velocity),
                depth: (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)).toFixed(3),
                t: elapsed()
            });
        }
    };

    // 3. Hover Tereddüdü (Hesitation): Kart üzerinde >800ms bekleme = ilgi
    let hoverTimer = null;
    let hoverTarget = null;

    const trackHoverIn = (e) => {
        const gravityEl = e.target.closest('[data-gravity-id]');
        if (!gravityEl) return;

        hoverTarget = gravityEl.getAttribute('data-gravity-id');
        hoverTimer = setTimeout(() => {
            push({
                type: 'hesitation',
                gid: hoverTarget,
                dur: 800,
                t: elapsed()
            });
        }, 800);
    };

    const trackHoverOut = () => {
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = null;
        hoverTarget = null;
    };

    // 4. Viewport Zaman — Hangi kartlar ekranda ne kadar kaldı
    let visibilityMap = new Map();
    let observer = null;

    const setupVisibilityTracker = () => {
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const gid = entry.target.getAttribute('data-gravity-id');
                if (!gid) return;

                if (entry.isIntersecting) {
                    visibilityMap.set(gid, performance.now());
                } else {
                    const start = visibilityMap.get(gid);
                    if (start) {
                        const duration = Math.round(performance.now() - start);
                        if (duration > 500) { // 500ms'den uzun görüntüleme
                            push({
                                type: 'viewtime',
                                gid,
                                dur: duration,
                                t: elapsed()
                            });
                        }
                        visibilityMap.delete(gid);
                    }
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('[data-gravity-id]').forEach(el => observer.observe(el));
    };

    // 5. Dönüşüm Sinyali — CTA tıklama veya sepete ekleme
    const trackConversion = (gravityId, action = 'cta_click') => {
        push({
            type: 'conversion',
            gid: gravityId,
            action,
            t: elapsed()
        });
    };

    // 6. Çıkış Sinyali — Sayfa terk edilirken
    const trackExit = () => {
        push({
            type: 'exit',
            duration: Math.round(elapsed()),
            scrollDepth: (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100).toFixed(0),
            events: buffer.length,
            variant: variantId
        });
        flush(true); // Sync flush on exit
    };

    // ── BUFFER MANAGEMENT ──

    function push(event) {
        if (buffer.length >= MAX_EVENTS) return;
        event.sid = SESSION_KEY;
        event.vid = variantId;
        buffer.push(event);
    }

    function elapsed() {
        return Math.round(performance.now() - sessionStart);
    }

    function flush(sync = false) {
        if (buffer.length === 0) return;

        const payload = {
            version: 'beacon-v1.0',
            timestamp: new Date().toISOString(),
            variant: variantId,
            events: [...buffer]
        };

        buffer = [];

        // localStorage'a yaz (Darwinian Router okuyacak)
        try {
            const existing = JSON.parse(localStorage.getItem('sv_telemetry') || '[]');
            existing.push(payload);
            // Son 50 batch'i tut
            if (existing.length > 50) existing.splice(0, existing.length - 50);
            localStorage.setItem('sv_telemetry', JSON.stringify(existing));
        } catch (e) { /* quota exceeded — silently drop */ }

        // Beacon API ile sunucuya gönder (opsiyonel, sunucu varsa)
        if (navigator.sendBeacon && !sync) {
            try {
                navigator.sendBeacon('/api/v1/telemetry/beacon', JSON.stringify(payload));
            } catch (e) { /* sunucu yoksa sessizce geç */ }
        }
    }

    // ── INITIALIZATION ──

    function ignite(variant = 'apex') {
        variantId = variant;

        // Pasif event listener'lar (sıfır performans etkisi)
        document.addEventListener('click', trackClick, { passive: true });
        window.addEventListener('scroll', trackScroll, { passive: true });
        document.addEventListener('mouseover', trackHoverIn, { passive: true });
        document.addEventListener('mouseout', trackHoverOut, { passive: true });
        window.addEventListener('beforeunload', trackExit);

        // Visibility tracker
        requestAnimationFrame(setupVisibilityTracker);

        // Periyodik flush
        setInterval(flush, BATCH_INTERVAL);

        console.log(
            '%c[NEURAL BEACON] %cv1.0 Aktif | Varyant: ' + variant + ' | GDPR-Safe (Zero PII)',
            'color:#c5a059; font-weight:bold;', 'color:#888;'
        );
    }

    // Public API
    return {
        ignite,
        trackConversion,
        getBuffer: () => [...buffer],
        getTelemetry: () => JSON.parse(localStorage.getItem('sv_telemetry') || '[]'),
        clearTelemetry: () => localStorage.removeItem('sv_telemetry')
    };
})();

// Auto-start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SovereignBeacon.ignite());
} else {
    SovereignBeacon.ignite();
}

window.SovereignBeacon = SovereignBeacon;
