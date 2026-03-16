/* ==========================================================================
   🦅 SANTIS OS V8 OMEGA — DETERMINISTIC BOOTLOADER
   The Great Pruning: 51 → 15 Super-Cluster Architecture
   ========================================================================== */

// 🛡️ CRASH SHIELD (Browser): Hiçbir JS hatası sayfayı çökertemez
window.addEventListener('error', (e) => {
    console.error(`🚨 [CRASH SHIELD] JS Error yakalandı: ${e.message} (${e.filename}:${e.lineno})`);
    e.preventDefault(); // Hatanın yayılmasını engelle
});
window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 [CRASH SHIELD] Promise Rejection yakalandı:', e.reason);
    e.preventDefault();
});

async function igniteSantisOS() {
    // 🛡️ IDEMPOTENT GUARD: Çift Darbe (Double Boot) Sendromunu Engelle
    if (window.__SANTIS_BOOTED) {
        console.warn('⚠️ [V8 OMEGA] Boot zaten tamamlandı — çift çağrı engellendi.');
        return;
    }
    window.__SANTIS_BOOTED = true;

    const t0 = performance.now();
    const page = document.body?.dataset?.page || 'unknown';

    console.log(
        "%c🦅 [V8 OMEGA] Deterministic Boot Sequence Initiated...",
        "color: #d4af37; font-weight: bold; background: #050505; padding: 4px 10px; border: 1px solid #d4af37;"
    );
    console.log(`%c⏱️ [T+0ms] Cephe: [${page.toUpperCase()}]`, "color: #3b82f6");

    // ── Sovereign Global State ────────────────────────────────────────────────
    window.Santis = window.Santis || {
        State: { page, scroll: 0 },
        Workers: {},
        Engines: {},
        UI: {}
    };

    // ══════════════════════════════════════════════════════════════════════
    // 🛡️ FAIL-SAFE: 3 saniye içinde boot tamamlanmazsa perdeyi yine de aç!
    // CSS'teki html:not(.app-ready) body { visibility: hidden } kuralını
    // her halükarda kaldırır — kara ekran ASLA kalıcı olamaz.
    // ══════════════════════════════════════════════════════════════════════
    const failSafeTimer = setTimeout(() => {
        if (!document.documentElement.classList.contains('app-ready')) {
            console.warn("⚠️ [V8 OMEGA] FAIL-SAFE: Boot 3s'de tamamlanamadı — perde zorla kaldırılıyor!");
            document.documentElement.classList.add('app-ready');
        }
    }, 3000);

    try {
        // ══════════════════════════════════════════════════════════════════════
        // FAZ 0: LCP GUARD (0-300ms) — Skeleton anında görünsün
        // ══════════════════════════════════════════════════════════════════════
        await new Promise(resolve => setTimeout(resolve, 300));

        // ══════════════════════════════════════════════════════════════════════
        // FAZ 1: GPU & MATRIX CORE (300-500ms) — Görsel Çekirdek
        // ══════════════════════════════════════════════════════════════════════
        const GPU = await import('../engines/gpu-effects.js?v=V8_OMEGA').catch(() => null);
        if (GPU) window.Santis.Engines.GPU = GPU.init();

        // Kart dizilecek sayfalar için Matrix UI'ı boot et
        const matrixPages = ['massage', 'hamam', 'hammam', 'skincare', 'rituals', 'index'];
        if (matrixPages.includes(page)) {
            console.log(`%c🧠 [T+${Math.round(performance.now() - t0)}ms] Kuantum Çekirdeği Ateşleniyor...`, "color: #10b981");
            window.Santis.Workers.Kernel = new Worker(
                '/assets/js/workers/kernel.worker.js?v=V8_OMEGA',
                { type: 'module' }
            );
            window.Santis.Workers.Kernel.postMessage({
                type: 'BOOT_SEQUENCE',
                payload: { page }
            });

            const MatrixUI = await import('../ui/massage-matrix.js?v=V8_OMEGA').catch(() => null);
            if (MatrixUI) window.Santis.UI.Matrix = MatrixUI.init(window.Santis.Workers.Kernel);
        } else {
            // Statik sayfalarda opacity geçişi
            const arena = document.querySelector('.santis-matrix-container') || document.querySelector('main');
            if (arena) requestAnimationFrame(() => { arena.style.opacity = "1"; });
        }

        // ══════════════════════════════════════════════════════════════════════
        // 🎭 PERDEYİ AÇ — CSS visibility kilidini kaldır (app-ready)
        // ══════════════════════════════════════════════════════════════════════
        document.documentElement.classList.add('app-ready');
        clearTimeout(failSafeTimer);

        const bootTime = Math.round(performance.now() - t0);
        console.log(
            `%c🏆 [V8 OMEGA] BOOT COMPLETE IN ${bootTime}ms | Cephe: ${page.toUpperCase()}`,
            "color: #10b981; font-weight: bold; font-size: 12px;"
        );

        // ══════════════════════════════════════════════════════════════════════
        // FAZ 2: GÖLGE KÜMELER (Idle/Scroll tetikli — ana işlemce rahatlayınca)
        // ══════════════════════════════════════════════════════════════════════
        scheduleShadowClusters(t0);

    } catch (error) {
        console.error("🚨 [V8 OMEGA] CRITICAL BOOT FAILURE:", error);
        // 🛡️ Hata durumunda bile perdeyi aç!
        document.documentElement.classList.add('app-ready');
        clearTimeout(failSafeTimer);
    }
}

// ── SHADOW CLUSTER BOOTSTRAP ────────────────────────────────────────────────
// Fizik + Ticaret motorlarını scroll VEYA idle anında sessizce yükler.
// İlk tetikten sonra diğer tetik iptal olur (Clone Wars önlemi).
function scheduleShadowClusters(t0) {
    let fired = false;

    const wakeTheDead = async (trigger) => {
        if (fired) return;
        fired = true;

        console.log(`%c🌙 [T+${Math.round(performance.now() - t0)}ms] Gölge Kümeler Uyanıyor! Tetik: ${trigger}`, "color: #6b7280");
        try {
            // 🟣 FİZİK KÜMESİ — Parçacık efektleri & animasyonlar
            await import('../core/quantum-engine.js?v=V8_OMEGA').catch(() => {});
            await import('../core/fibonacci-swarm.js?v=V8_OMEGA').catch(() => {});

            // 🔵 TİCARET KÜMESİ — Checkout & wallet
            await import('../core/checkout-ritual.js?v=V8_OMEGA').catch(() => {});
            await import('../core/wallet-bridge.js?v=V8_OMEGA').catch(() => {});
            await import('../core/boutique-infection.js?v=V8_OMEGA').catch(() => {});

            // 🟠 DENEYİM KÜMESİ — Nöral detay & akustik
            await import('../core/neuro-detail.js?v=V8_OMEGA').catch(() => {});
            await import('../core/sovereign-acoustics.js?v=V8_OMEGA').catch(() => {});

            // 🟢 İSTİHBARAT — Piksel & skor
            await import('../santis-pixel-engine.js?v=V8_OMEGA').catch(() => {});
            await import('../santis-score-engine.js?v=V8_OMEGA').catch(() => {});

            console.log(`%c✅ [T+${Math.round(performance.now() - t0)}ms] Tüm Gölge Kümeler Çevrimiçi`, "color: #10b981");
        } catch (e) { /* Sessiz hata yakalama */ }
    };

    // 🅰️ SCROLL TETİĞİ
    window.addEventListener('scroll', () => wakeTheDead('SCROLL'), { passive: true, once: true });

    // 🅱️ IDLE TETİĞİ (2 saniye)
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => wakeTheDead('IDLE'), { timeout: 2000 });
    } else {
        setTimeout(() => wakeTheDead('IDLE_FALLBACK'), 2000);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ⚔️ SİSTEMİ ATEŞLE — DOM hazır olduğu an boot et
// ══════════════════════════════════════════════════════════════════════════════
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', igniteSantisOS);
} else {
    igniteSantisOS();
}
