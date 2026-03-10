/**
 * ========================================================================
 * SOVEREIGN OS v10 - SPA ROUTER PAGE: HOME (INDEX)
 * ========================================================================
 */
import { SantisDataBridge } from '../santis-data-bridge.js';

export const HomePage = {
    async mount() {
        console.log("💎 [Home Aegis V10] Ana Sayfa Yükleniyor... V10 Kuantum Köprüleri Ateşleniyor!");

        // 1. Hammam Rayını Doldur
        const hammamContainer = 'section[data-rail-id="rail-hammam"] .rituals-container';
        if (document.querySelector(hammamContainer)) {
            await SantisDataBridge.bootMatrix('/assets/data/services.json', hammamContainer, 'hammam');
        }

        // 2. Therapies/Massage Rayını Doldur
        const therapiesContainer = 'section[data-rail-id="rail-therapies"] .rituals-container';
        if (document.querySelector(therapiesContainer)) {
            await SantisDataBridge.bootMatrix('/assets/data/services.json', therapiesContainer, 'massage');
        }
    },

    async unmount() {
        // DOM temizliği SPA navigasyonu için (Opsiyonel Ana sayfa cleanup)
        const hammamContainer = document.querySelector('section[data-rail-id="rail-hammam"] .rituals-container');
        if (hammamContainer) hammamContainer.innerHTML = '';
        const therapiesContainer = document.querySelector('section[data-rail-id="rail-therapies"] .rituals-container');
        if (therapiesContainer) therapiesContainer.innerHTML = '';

        if (window.SovereignVirtualEngine && window.SovereignVirtualEngine.physicalNodes) {
            window.SovereignVirtualEngine.physicalNodes.clear();
        }
        console.log("🧹 [Home Aegis V10] DOM Temizlendi.");
    }
};

export function init() {
    return HomePage.mount();
}
export function initHomePage() { return HomePage; }
export default HomePage;
window.HomePage = HomePage;
