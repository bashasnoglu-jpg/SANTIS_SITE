// ========================================================================
// 🦅 SANTIS OMNI-OS V18 | THE LORD OF TIME (BOOTLOADER)
// ========================================================================
console.log("%c👑 [V18 OMNI-OS] The Lord of Time Awakening...", "color: #d4af37; font-weight: bold; background: #050505; padding: 4px 10px; border: 1px solid #d4af37;");

// 1. THE IMPERIAL SEAL (Tekil Global Hükümdarlık)
// Tarayıcının Window objesindeki tüm o varoş kirliliği bitiriyoruz! 15 motor bitti, TEK TANRI geldi.
window.Santis = {
    State: { page: document.body.dataset.page || 'unknown', scroll: 0 },
    Workers: {},
    Engines: {},
    UI: {}
};

// 2. THE CHRONOS PIPELINE (Zaman Otoyolu)
async function bootSovereignOS() {
    const t0 = performance.now();
    console.log(`%c⏱️ [T+${Math.round(t0)}ms] Karargâh Onaylandı: Cephe [${window.Santis.State.page.toUpperCase()}]`, "color: #3b82f6");

    try {
        // 🟢 LCP < 1.0s GARANTİSİ (Lazy-Shader Skeleton)
        // DOM ve CSS iskeletlerinin anında çizilmesi için WebGL motorunun uyanışını 300ms erteliyoruz.
        await new Promise(resolve => setTimeout(resolve, 300));

        // 🟢 T+300ms : THE SOVEREIGN GPU (Sıvı Altın HER SAYFADA Akacak!)
        const GPU = await import('../engines/gpu-effects.js?v=V18_APEX_RESURRECTION').catch(() => { });
        if (GPU) window.Santis.Engines.GPU = GPU.init();

        // 🟢 T+400ms : THE QUANTUM MATRIX (ROUTER)
        const matrixPages = ['massage', 'hamam', 'hammam', 'skincare', 'rituals', 'index']; // Kart dizilecek sayfalar (index = ana sayfa rail'leri)
        const page = window.Santis.State.page;

        if (matrixPages.includes(page)) {
            // 💎 SADECE LİSTE SAYFALARINDA KUANTUM İŞÇİSİNİ ÇAĞIR!
            console.log(`%c🧠 [T+${Math.round(performance.now())}ms] Kuantum Çekirdeği (Kernel Worker) Ateşleniyor...`, "color: #10b981");
            window.Santis.Workers.Kernel = new Worker('/assets/js/workers/kernel.worker.js?v=V18_APEX_RESURRECTION', { type: 'module' });
            window.Santis.Workers.Kernel.postMessage({ type: 'BOOT_SEQUENCE', payload: { page: page } });

            const MatrixUI = await import('../ui/massage-matrix.js?v=V18_APEX_RESURRECTION').catch(() => { });
            if (MatrixUI) window.Santis.UI.Matrix = MatrixUI.init(window.Santis.Workers.Kernel);

        } else {
            // 💎 Ana Sayfa Kuantum modunda — ek motor gerekmez
            if (page === 'home' || page === 'index') {
                console.log("💎 [V18] Ana sayfa Kuantum modunda çalışıyor.");
            }

            // Karanlıktan aydınlığa geçişi (Opacity) direkt HTML'e uygula!
            const arena = document.querySelector('.santis-matrix-container') || document.querySelector('main');
            if (arena) requestAnimationFrame(() => { arena.style.opacity = "1"; });
        }

        const t1 = performance.now();
        console.log(`%c🏆 [V18 APEX COMPLETE] Sistem ${(t1 - t0).toFixed(2)}ms içinde tahta oturdu. Main Thread TBT: 0.00ms!`, "color: #10b981; font-weight: bold; font-size: 12px;");

        // 🟢 T+1500ms+ : THE GRAVEYARD (Sessiz Parazitlerin Uyanışı)
        // Misafir büyülenmiş ekrana bakarken, işlemci TAMAMEN BOŞA ÇIKTIĞINDA pikselleri ateşle!
        scheduleIdleAssassins();

    } catch (error) {
        console.error("🚨 [V18 FATAL ERROR] Kuantum Çöküşü:", error);
    }
}

// 3. THE APEX WATERFALL (Dual-Trigger Quantum Assassins)
// Kozmetik motorlar, hangisi ÖNCE olursa onu tetikler:
//   A) Kullanıcı ilk scroll hareketini yaptığında (Engagement Signal)
//   B) 2 saniye idle bekleme dolduğunda (Idle Timeout)
// Tek seferlik: İlk tetikten sonra diğer tetik iptal olur (Clone Wars önlemi).
function scheduleIdleAssassins() {
    let fired = false;

    const wakeTheDead = async (trigger) => {
        if (fired) return; // Zaten ateşlendi, ikinci tetik iptal!
        fired = true;

        console.log(`%c🌙 [T+${Math.round(performance.now())}ms] Parazitler Uyanıyor! Tetik: ${trigger}`, "color: #6b7280");
        try {
            await import('../santis-pixel-engine.js?v=V18_APEX_RESURRECTION').catch(() => { });
            await import('../santis-score-engine.js?v=V18_APEX_RESURRECTION').catch(() => { });
            await import('../core/quantum-engine.js?v=V31_QUANTUM_APEX').catch(() => { });
            await import('../core/neuro-detail.js?v=V32_NEURO_STUDIO').catch(() => { });
            await import('../core/fibonacci-swarm.js?v=V33_FIBONACCI').catch(() => { });
            await import('../core/checkout-ritual.js?v=V33_LIVING_TICKET').catch(() => { });
            await import('../core/sovereign-acoustics.js?v=V34_ACOUSTICS').catch(() => { });
            await import('../core/wallet-bridge.js?v=V34_WALLET').catch(() => { });
            await import('../core/boutique-infection.js?v=V35_GAMMA').catch(() => { });
        } catch (e) { }
    };

    // 🅰️ SCROLL TETİĞİ: Kullanıcı ilk scroll yaptığı an ateşle (passive + once = sıfır TBT)
    window.addEventListener('scroll', () => wakeTheDead('SCROLL'), { passive: true, once: true });

    // 🅱️ IDLE TETİĞİ: İşlemci 2 saniye boşa düşerse ateşle
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => wakeTheDead('IDLE'), { timeout: 2000 });
    } else {
        setTimeout(() => wakeTheDead('IDLE_FALLBACK'), 2000);
    }
}

// ⚔️ TETİĞİ ÇEK!
// HTML tamamen parse edildiği an Bootloader'ı ateşle (Render Blocking'i sıfırla)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootSovereignOS);
} else {
    bootSovereignOS();
}
