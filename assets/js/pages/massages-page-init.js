import { SantisDataBridge } from '../santis-data-bridge.js';

export const MassagePage = {
    async mount() {
        console.log("🛡️ [Massage V10] Kaçak dosya ele geçirildi. V10 Motoruna devrediliyor...");
        const container = document.querySelector('#santis-matrix-container') || document.querySelector('.santis-matrix-container');
        if (!container) return;
        const selector = container.id ? `#${container.id}` : '.santis-matrix-container';

        if (SantisDataBridge && SantisDataBridge.bootMatrix) {
            await SantisDataBridge.bootMatrix('/assets/data/services.json', selector, 'massage');
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
