document.addEventListener('DOMContentLoaded', () => {
    console.log("🦅 [God Mode] Fırlatma Rampası Hazırlanıyor...");

    // 1. Kuantum Motorunu Uyandır
    // Not: SiteNeuralMapEngine god-mode.html içinde 'neural-container' hedefiyle window.brainEngine olarak başlatıldı
    // setTimeout ile haritanın hazır olmasını bekliyoruz.
    setTimeout(() => {
        const brainEngine = window.brainEngine;
        if (!brainEngine) return;

        // 2. Galaksinin Merkezini (Çekirdeği) Yarat
        // Fırlatılacak tüm düğümler bu ana kütlenin etrafında dönecek
        brainEngine.nodes.add({
            id: 'core_homepage',
            label: 'SANTIS CORE\n(Ana Yörünge)',
            shape: 'hexagon',
            mass: 15, // Dev çekim gücü (Diğer her şeyi etrafında döndürecek)
            size: 40,
            color: { background: '#050505', border: '#FFFFFF', highlight: { border: '#FFD700', background: '#261a00' } },
            font: { color: '#FFFFFF', face: 'Inter, sans-serif', size: 16, bold: true },
            shadow: { enabled: true, color: '#FFFFFF', size: 40 }
        });

        const injectBtn = document.getElementById('btn-inject-masaf');
        const purgeBtn = document.getElementById('btn-purge-masaf');

        // 🚀 MASAF ENJEKSİYONU (Ateşleme Sinyali)
        if (injectBtn) {
            injectBtn.addEventListener('click', async () => {
                console.log("⚡ [Komuta] Masaf Koleksiyonları uzaya fırlatılıyor...");

                // Buton animasyonu ve kilitleme
                injectBtn.querySelector('span:first-child').innerText = "⏳ Yörüngeye Oturuyor...";
                injectBtn.disabled = true;

                // [KURAL 1 & 4] Yeni Yamayı Yarat (brainEngine referansını veriyoruz)
                // Not: SovereignCollectionPatch sınıfı export edilmediğinden global scoptadır.
                const activePatch = new SovereignCollectionPatch('lux_spa_collection', brainEngine);
                
                // [KURAL 3] Ateşle! (Task Chunking devreye girecek)
                await activePatch.ignite();

                // İşlem bittiğinde butonları güncelle
                injectBtn.querySelector('span:first-child').innerText = "✅ Yörünge Stabil!";
                purgeBtn.disabled = false;
                purgeBtn.style.opacity = "1";
                purgeBtn.style.boxShadow = "0 0 15px rgba(255,59,48,0.2)";
            });
        }

        // 🧹 İMHA DÖNGÜSÜ (Garbage Collector Testi)
        if (purgeBtn) {
            purgeBtn.addEventListener('click', () => {
                console.log("🔥 [Komuta] İmha döngüsü başlatıldı. Uzay temizleniyor...");
                
                // [KURAL 2] Global Registry'den aktif yamayı bul ve yok et
                // Bu sayede SPA'yı çökerten referanslardan (Memory Leak) kurtuluyoruz!
                const activePatch = window.__GLOBAL_ENGINE_REGISTRY__['lux_spa_collection'];
                if (activePatch && typeof activePatch.destroy === 'function') {
                    activePatch.destroy();
                }

                // Butonları başlangıç haline çevir
                purgeBtn.disabled = true;
                purgeBtn.style.opacity = "0.4";
                purgeBtn.style.boxShadow = "none";
                injectBtn.disabled = false;
                injectBtn.querySelector('span:first-child').innerText = "🌌 Neon Masaf Fırlat";
            });
        }
    }, 500);
});
