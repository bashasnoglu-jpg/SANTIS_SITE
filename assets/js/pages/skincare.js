/**
 * 🛡️ [SOVEREIGN V10] SKINCARE PAGE ROUTER (JSON FALLBACK)
 */

export const SkincarePage = {
    async mount() {
        console.log("🛡️ [Skincare V10] Kuantum Köprüsü Ateşleniyor...");

        const container = document.querySelector('#santis-matrix-container') || document.querySelector('.santis-matrix-container');
        if (!container) return console.error("🚨 [Skincare V10] Container bulunamadı!");

        const selector = container.id ? `#${container.id}` : '.santis-matrix-container';

        // 💎 API kapalı olsa bile sistemin çökmemesi için doğrudan yerel JSON'a bağlıyoruz!
        if (window.SantisDataBridge && window.SantisDataBridge.bootMatrix) {
            await window.SantisDataBridge.bootMatrix('/assets/data/services.json', selector, 'skincare');
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

export function init() {
    return SkincarePage.mount();
}
export function initSkincare() { return SkincarePage; }
export default SkincarePage;
window.SkincarePage = SkincarePage;
