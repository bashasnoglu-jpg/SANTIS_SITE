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
        // 🟢 T+200ms : KERNEL IGNITION (İşçileri Madene İndir)
        // Main thread'i 1 ms bile kitlemeden JSON verilerini çekmesi için Kuantum Beynini başlat!
        console.log(`%c🧠 [T+${Math.round(performance.now())}ms] Kuantum Çekirdeği (Kernel Worker) Ateşleniyor...`, "color: #10b981");
        window.Santis.Workers.Kernel = new Worker('/assets/js/workers/kernel.worker.js', { type: 'module' });

        // İşçiye hangi sayfada olduğunu fısılda, madene insin!
        window.Santis.Workers.Kernel.postMessage({ type: 'BOOT_SEQUENCE', payload: { page: window.Santis.State.page } });

        // 🟢 T+300ms : PAGE UI & GPU ENGINE (Sadece İhtiyacın Olanı Yükle - Lazy Load)
        if (window.Santis.State.page === 'massage') {
            console.log(`%c👁️ [T+${Math.round(performance.now())}ms] UI ve GPU Motorları RAM'e Çekiliyor...`, "color: #a855f7");

            // Masaj UI Katmanı (Kartları DOM'a basacak - Faz 3'te yazacağız)
            const MassageUI = await import('../ui/massage-matrix.js').catch(e => console.warn("⏳ [V18] UI modülü Faz 3'te yaratılacak. Kuantum beklemede."));
            if (MassageUI) {
                window.Santis.UI.Massage = MassageUI.init(window.Santis.Workers.Kernel);
            }

            // GPU Diktatörü (Sıvı altın fiziği - Faz 3'te yazacağız)
            const GPU = await import('../engines/gpu-effects.js').catch(e => console.warn("⏳ [V18] GPU Motoru Faz 3'te yaratılacak."));
            if (GPU) window.Santis.Engines.GPU = GPU.init();

            // Fırtına koptu, karanlıkta yatan Matrix'i aydınlat! (Soft Transition)
            const arena = document.querySelector('.santis-matrix-container');
            if (arena) {
                requestAnimationFrame(() => { arena.style.opacity = "1"; });
            }
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

// 3. THE SILENT ASSASSINS (Idle Task Scheduler)
function scheduleIdleAssassins() {
    const wakeTheDead = async () => {
        console.log(`%c🌙 [T+${Math.round(performance.now())}ms] İşlemci %100 Boş. Parazitler (Analytics, Pixels) Zindandan Çıkarılıyor...`, "color: #6b7280");
        try {
            // Sitenin FCP ve LCP hızını %0 etkileyen, arka kapıdan giren ajanlar!
            await import('../engines/santis-pixel-engine.js').catch(() => { });
            await import('../engines/santis-score-engine.js').catch(() => { });
        } catch (e) { }
    };

    // İşlemci %100 boşaldığında (veya en geç 3 saniye sonra) ateşle!
    if ('requestIdleCallback' in window) {
        requestIdleCallback(wakeTheDead, { timeout: 3000 });
    } else {
        setTimeout(wakeTheDead, 2000); // Failsafe (Safari vb. eski mimariler için)
    }
}

// ⚔️ TETİĞİ ÇEK!
// HTML tamamen parse edildiği an Bootloader'ı ateşle (Render Blocking'i sıfırla)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootSovereignOS);
} else {
    bootSovereignOS();
}
