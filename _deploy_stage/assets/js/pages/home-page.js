/**
 * ========================================================================
 * SOVEREIGN OS v10 - SPA ROUTER PAGE: HOME (INDEX)
 * ========================================================================
 */

export const HomePage = {
    async mount() {
        console.log("💎 [Home Aegis V10] Ana Sayfa Yükleniyor... V10 Kuantum Köprüleri Ateşleniyor!");

        // 1. Massage Rayını Doldur
        const massageContainer = '#santis-massage-matrix';
        if (document.querySelector(massageContainer)) {
            await window.SantisDataBridge.bootMatrix('/assets/data/services.json', massageContainer, 'massage');
        }

        // 2. Skincare Rayını Doldur
        const skincareContainer = '#santis-skincare-matrix';
        if (document.querySelector(skincareContainer)) {
            await window.SantisDataBridge.bootMatrix('/assets/data/services.json', skincareContainer, 'skincare');
        }
    },

    async unmount() {
        // DOM temizliği SPA navigasyonu için (Opsiyonel Ana sayfa cleanup)
        const massageContainer = document.querySelector('#santis-massage-matrix');
        if (massageContainer) massageContainer.innerHTML = '';
        const skincareContainer = document.querySelector('#santis-skincare-matrix');
        if (skincareContainer) skincareContainer.innerHTML = '';

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
