// assets/js/core/santis-route-controller.js
// VNEXT: Sovereign Route Controller (The Awakener)

window.SovereignRouteController = (() => {
    // Sayfa bazlı özel uyandırma fonksiyonlarının kayıt defteri
    const RouteRegistry = {
        // Hamam Sayfası
        '/hamam.html': () => {
            console.log("🛁 [Route Controller] Hamam boyutu tespit edildi. Oracle Grid uyanıyor...");
            // Eğer daha önce yazdığımız massage-matrix varsa onu tekrar tetikle
            if (window.SantisMassageMatrix && window.SantisMassageMatrix.init) {
                // Kernel üzerinden çalıştır ki Main Thread boğulmasın
                window.SantisKernel.enqueue(() => window.SantisMassageMatrix.init(window.SantisWorker), 1, 'Init_Hammam_Matrix');
            }
        },
        
        // Masaj Sayfası
        '/massages.html': () => {
            console.log("💆 [Route Controller] Masaj boyutu tespit edildi. Kuantum Kartlar uyanıyor...");
            // Masajlara özel spesifik bir kod varsa buraya...
        },

        // Ana Sayfa (Index)
        '/': () => {
            console.log("🦅 [Route Controller] Ana Üs tespit edildi. Hero Carousel ateşleniyor...");
            // Örneğin ana sayfadaki 3D Cover Flow'u yeniden başlat
            if (window.initCoverFlowCarousel) {
                window.SantisKernel.enqueue(window.initCoverFlowCarousel, 1, 'Init_Hero_Carousel');
            }
        }
    };

    const init = () => {
        if (!window.SovereignBus || !window.SovereignBus.subscribe) {
            console.log("⏳ [Route Controller] SovereignBus henüz belleğe inemedi. Event-Driven senkronizasyon bekleniyor...");
            // Mimarî Direktif: Asenkron yarış durumunu (Race Condition) önlemek için polling yerine Event-Driven Strict Graph kuruyoruz.
            window.addEventListener('sovereignBus:mounted', () => window.SovereignRouteController.init(), { once: true });
            return;
        }

        // Kuantum sıçraması bittiğinde Gümrükten gelen sinyali dinle
        window.SovereignBus.subscribe('router:navigation-complete', (payload) => {
            const path = payload.path || window.location.pathname;
            console.log(`⚡ [Route Controller] Sıçrama tamamlandı. Uyanış Protokolü başlatılıyor: ${path}`);

            // 1. GLOBAL UYANIŞ (Her sayfada çalışması gerekenler)
            window.SantisKernel.enqueue(() => {
                // Sayfanın en üstüne pürüzsüzce çık
                window.scrollTo({ top: 0, behavior: 'instant' }); 
                
                // Sıvı İmleç (Liquid Cursor) gibi global elementleri yeni DOM'a tekrar bağla
                if (window.SantisCursor && window.SantisCursor.rebind) {
                    window.SantisCursor.rebind();
                }
            }, 0, 'Global_Rebind'); // CRITICAL öncelik

            // 2. SPESİFİK UYANIŞ (Sadece bu sayfaya özel fonksiyonlar)
            // Exact match (Tam eşleşme) veya Includes (İçerme) mantığıyla çalıştırabiliriz
            let matched = false;
            for (const [routePattern, wakeUpFunction] of Object.entries(RouteRegistry)) {
                if (path === routePattern || (routePattern !== '/' && path.includes(routePattern))) {
                    wakeUpFunction();
                    matched = true;
                    break; // İlk eşleşmede dur
                }
            }

            if (!matched) {
                console.log(`👽 [Route Controller] Bu boyut için (${path}) özel bir uyanış kuralı bulunamadı.`);
            }
        });

        console.log("🧠 [Route Controller] Uyanış Motoru Online. SPA Laneti Kırıldı.");
    };

    return { init, register: (path, fn) => RouteRegistry[path] = fn };
})();

// Auto-start
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.SovereignRouteController.init();
} else {
    window.addEventListener('DOMContentLoaded', window.SovereignRouteController.init);
}
