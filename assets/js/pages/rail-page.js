/**
 * ========================================================================
 * SOVEREIGN OS v10 - SPA ROUTER PAGE (V10 IGNITION)
 * ========================================================================
 */
import { SantisDataBridge } from '../santis-data-bridge.js';

export const RailPage = {
    async mount() {
        console.log("🛡️ [Rail Aegis V10] Sayfa Yükleniyor... V10 Kuantum Köprüsü Ateşleniyor!");

        // 1. URL'den hangi kategoride olduğumuzu anla
        const path = window.location.pathname.toLowerCase();
        let category = 'general';
        if (path.includes('cilt-bakimi') || path.includes('skincare')) category = 'skincare';
        else if (path.includes('hamam')) category = 'hammam';
        else if (path.includes('masaj') || path.includes('massage')) category = 'massage';
        else if (path.includes('ritual')) category = 'rituals';

        // 2. Kartların basılacağı div'i bul
        let container = document.querySelector('#santis-matrix-container') || document.querySelector('.santis-matrix-container');

        // Eğer Masajlar veya Ana Sayfada özel ID kullanılmışsa fallback
        if (!container && category === 'massage') container = document.querySelector('#santis-massage-matrix');
        if (!container && category === 'hammam') container = document.querySelector('#santis-massage-matrix') || document.querySelector('.santis-neural-loader')?.parentNode;

        if (!container) return console.error("🚨 [Rail Aegis V10] Container DOM'da bulunamadı!");

        const selector = container.id ? `#${container.id}` : '.santis-matrix-container';

        // 3. V10 Kuantum Köprüsünü Ateşle!
        if (SantisDataBridge && SantisDataBridge.bootMatrix) {
            await SantisDataBridge.bootMatrix('/assets/data/services.json', selector, category);
        }
    },

    async unmount() {
        let container = document.querySelector('#santis-matrix-container') || document.querySelector('.santis-matrix-container');
        if (!container) container = document.querySelector('#santis-massage-matrix'); // Fallback temizleme

        if (container) container.innerHTML = ''; // 🧹 Sayfa değişirken RAM'i temizle (0-GC)
        if (window.SovereignVirtualEngine && window.SovereignVirtualEngine.physicalNodes) {
            window.SovereignVirtualEngine.physicalNodes.clear(); // O(1) Hafıza havuzunu boşalt
        }
        console.log("🧹 [Rail Aegis V10] DOM Temizlendi.");
    }
};

export function init() {
    return RailPage.mount();
}
export function initRailPage() { return RailPage; }
export default RailPage;
window.RailPage = RailPage;
