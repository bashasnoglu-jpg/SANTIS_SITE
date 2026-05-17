/**
 * 🦅 SANTIS OS v100 - THE OMNI-BRIDGE (LIVE PRODUCTION INJECTOR)
 * Oracle Console'dan çıkan 'universe-runtime.json' DNA'sını okur
 * ve Santis'in canlı sitesindeki DOM elementlerini kuantum fiziğiyle yeniden dizer.
 *
 * Usage: HTML'de kartlara data-gravity-id="sultan-hamam" ekle,
 *        sunucuya universe-runtime.json koy, bu scripti yükle.
 */

const SovereignLiveBridge = (() => {
    const DNA_ENDPOINT = '/universe-runtime.json';
    let currentTimestamp = null;
    let liveEntities = new Map();

    // 1. DOM'daki kartları bul ve GPU hızlandırma hazırla
    const mapLiveElements = () => {
        const elements = document.querySelectorAll('[data-gravity-id]');
        elements.forEach(el => {
            const id = el.getAttribute('data-gravity-id');
            liveEntities.set(id, el);
            el.style.transition = 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
            el.style.willChange = 'transform, box-shadow';
        });
        console.log(
            `%c[SOVEREIGN BRIDGE] %c${liveEntities.size} Canlı Düğüm Silaha Bağlandı.`,
            'color:#c5a059; font-weight:bold;', 'color:#aaa;'
        );
    };

    // 2. Runtime JSON'ı çek ve DOM'a uygula
    const fetchAndInjectDNA = async () => {
        try {
            const response = await fetch(DNA_ENDPOINT + '?t=' + Date.now());
            if (!response.ok) return; // JSON henüz yok, sessizce bekle

            const dna = await response.json();

            // Aynı versiyon → DOM'u yorma
            if (currentTimestamp === dna.timestamp) return;
            currentTimestamp = dna.timestamp;

            console.log(
                `%c[SOVEREIGN BRIDGE] Yeni DNA: ${dna.scene} | CVR: ${dna.stats.cvr}`,
                'color:#00ff66;'
            );

            // 3. Layout verilerini DOM'a uygula
            dna.layout.forEach(card => {
                const el = liveEntities.get(card.id);
                if (!el) return;

                requestAnimationFrame(() => {
                    // Öncelik sırasına göre z-index
                    el.style.zIndex = String(100 - card.priority);

                    // Yüksek CVR kartlarına altın glow
                    if (parseFloat(card.cvr) > 5) {
                        el.style.boxShadow = '0 0 30px rgba(197,160,89,0.4)';
                        el.style.borderColor = '#c5a059';
                    } else {
                        el.style.boxShadow = 'none';
                        el.style.borderColor = 'rgba(255,255,255,0.05)';
                    }

                    // Order değiştirerek CSS grid/flex sırasını güncelle
                    el.style.order = String(card.priority);
                });
            });

            // Seal bilgisini konsola bas
            if (dna.seal) {
                console.log(
                    `%c[SOVEREIGN SEAL] Grade: ${dna.seal.grade} | Hash: ${dna.seal.hash.slice(0, 20)}...`,
                    'color:#c5a059; font-weight:bold;'
                );
            }
        } catch (e) {
            // universe-runtime.json yoksa sessizce devam et
        }
    };

    return {
        ignite: () => {
            console.log(
                '%c 🦅 SOVEREIGN LIVE BRIDGE v1.0 AKTİF',
                'color:#00e5ff; font-weight:bold; font-size:12px;'
            );
            mapLiveElements();
            setTimeout(fetchAndInjectDNA, 500);
            setInterval(fetchAndInjectDNA, 5000); // 5s polling
        }
    };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SovereignLiveBridge.ignite);
} else {
    SovereignLiveBridge.ignite;
}
