/**
 * 🛡️ [SOVEREIGN V10] RITUALS (JOURNEY) PAGE ROUTER
 */
import { SantisDataBridge } from '../santis-data-bridge.js';

export const RitualsPage = {
    async mount() {
        console.log("🛡️ [Rituals V10] Kuantum Köprüsü Ateşleniyor... SWR Yankısı Susturuldu!");

        const container = document.querySelector('#santis-matrix-container') || document.querySelector('.santis-matrix-container');
        if (!container) return console.error("🚨 [Rituals V10] Container bulunamadı! Lütfen HTML'e <div id='santis-matrix-container'></div> ekleyin.");

        const selector = container.id ? `#${container.id}` : '.santis-matrix-container';

        // 💎 Kuantum Motoruna "rituals" etiketli tüm (yaklaşık 24) lüks kartı çizmesini emrediyoruz!
        if (SantisDataBridge && SantisDataBridge.bootMatrix) {
            await SantisDataBridge.bootMatrix('/assets/data/services.json', selector, 'rituals');
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
    return RitualsPage.mount();
}
export function initRituals() { return RitualsPage; }
export default RitualsPage;
window.RitualsPage = RitualsPage;
