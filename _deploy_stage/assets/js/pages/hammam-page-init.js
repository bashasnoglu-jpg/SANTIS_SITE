import { SantisDataBridge } from '../santis-data-bridge.js';

export const HammamPage = {
    async mount() {
        console.log("🛡️ [Hammam V10] Kaçak dosya ele geçirildi. V10 Motoruna devrediliyor...");
        const container = document.querySelector('#santis-matrix-container') || document.querySelector('.santis-matrix-container');
        if (!container) return;
        const selector = container.id ? `#${container.id}` : '.santis-matrix-container';

        if (SantisDataBridge && SantisDataBridge.bootMatrix) {
            // Eğer Hamam'ın ayrı JSON'u varsa buraya onu yazın, yoksa services.json kalsın
            await SantisDataBridge.bootMatrix('/assets/data/services.json', selector, 'hammam');
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

export function initHammam() { return HammamPage; } // veya initHamam()
export default HammamPage;
window.HammamPage = HammamPage;
