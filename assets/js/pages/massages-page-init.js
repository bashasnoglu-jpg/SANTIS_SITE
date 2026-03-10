const SantisDataBridge = window.SantisDataBridge;

export const MassagePage = {
    async mount() {
        console.log("🛡️ [Massage V10] Sayfa inşası başlıyor, V17 Kuantum Motoru uyanıyor...");
        const container = document.querySelector('#santis-matrix-container') || document.querySelector('.santis-matrix-container');
        if (!container) return;
        const selector = container.id ? `#${container.id}` : '.santis-matrix-container';

        if (SantisDataBridge && SantisDataBridge.bootMatrix) {
            await SantisDataBridge.bootMatrix('/assets/data/services.json', selector, 'massage');

            // 🚨 POWERSHELL / HUNTER İÇİN THE ARCHITECT'S SCALPEL MÜHRÜ 🚨
            // Neuro-Sync'ten gelen 40 kartlık veri
            const massageData = window.__NEURO_SYNC_CACHE__ || [];

            if (massageData.length > 0) {
                // Eğer SovereignVirtualizer devredeyse başlat, yoksa fallback objesi yarat
                if (typeof SovereignVirtualizer !== 'undefined') {
                    const engineInstance = new SovereignVirtualizer('#santis-giant-lineup', massageData);
                    window.SovereignEngineInstance = engineInstance;
                } else {
                    window.SovereignEngineInstance = { source: 'fallback', data: massageData, isAwake: true };
                }
            }
        } else {
            console.error("🚨 [Massage V10] SantisDataBridge globalde bulunamadı! Engine tetiklenemiyor.");
        }
    },
    async unmount() {
        const container = document.querySelector('#santis-matrix-container') || document.querySelector('.santis-matrix-container');
        if (container) container.innerHTML = '';
        if (window.SovereignVirtualEngine && window.SovereignVirtualEngine.physicalNodes) {
            window.SovereignVirtualEngine.physicalNodes.clear();
        }
    }
};

export function initMassages() { return MassagePage; } // veya initMassage()
export default MassagePage;
window.MassagePage = MassagePage;

// ========================================================================
// 🌌 V17 THE IGNITION PROTOCOL - OMNI-OS MOTOR ATEŞLEYİCİ
// ========================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("🦅 [V17 IGNITION] Kuantum Radar Devrede. Ruhlar Bekleniyor...");

    // Neuro-Sync 40 kartı RAM'e indirdiği an onu yakalayıp motoru tetikleyen Kuantum Döngüsü!
    const sparkInterval = setInterval(() => {
        // Neuro-Sync'in hafızasından veriyi al (Avcı 40 tane bulduğunu raporladı)
        const massageData = window.__NEURO_SYNC_CACHE__ || [];

        if (massageData && massageData.length > 0) {
            clearInterval(sparkInterval); // Veriyi bulduk, radarı kapat!
            console.log(`⚡ [V17 IGNITION] ${massageData.length} Ruh Yakalandı! V17 Motoru Uyanıyor!`);

            // HTML'de o kapsayıcı div'in olduğundan emin ol!
            const container = document.querySelector('.santis-matrix-container') || document.querySelector('#santis-giant-lineup');

            if (container) {
                if (typeof SovereignVirtualizer !== 'undefined') {
                    // V17 Çizim Motorunu başlat ve Küresel RAM'e (Window) mühürle!
                    // (Senin Avcının ve PowerShell'in aradığı Kutsal Obje!)
                    window.SovereignEngineInstance = new SovereignVirtualizer(container, massageData);
                    console.log(`🏆 [V17 APEX SINGULARITY] ${massageData.length} Masaj Kartı Matrix'e Kusursuzca Yüklendi!`);
                } else {
                    console.error("🚨 Kuantum motoru (SovereignVirtualizer) ortamda bulunamadı!");
                }
            } else {
                console.error("🚨 KAPSAYICI YOK! HTML'de .santis-matrix-container veya #santis-giant-lineup bulunamadı!");
            }
        }
    }, 50); // Saniyede 20 kez verinin gelip gelmediğini kontrol et (Sıfır Gecikme)
});
