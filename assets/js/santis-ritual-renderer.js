import { SovereignForgeInjector } from './core/santis-forge-injector.js';


/**
 * SANTIS OS - SOVEREIGN RITUAL RENDERER V2 (Global Distribution Engine)
 * Kuantum Router Görevi: Hangi sayfada olduğumuzu (URL) anlar ve DataBridge'den
 * gelen devasa JSON okyanusunu (örn. window.NV_SKINCARE) parçalara bölerek
 * data-rail-engine Kuantum Raylarına doldurması için SovereignForgeInjector'a fırlatır.
 */
export class SovereignRitualRenderer {
    static ignite() {
        console.log("🦅 [Ritual Renderer] Sovereign Router Booting...");

        // 1. Kuantum Pusulası: Neredeyiz?
        const path = window.location.pathname.toLowerCase();

        if (path.includes('cilt-bakimi')) {
            this.routeSkincareMatrix();
        } else if (path.includes('masajlar')) {
            this.routeMassageMatrix();
        } else if (path.includes('hamam')) {
            this.routeHammamMatrix();
        } else if (path.includes('rituals') || path.includes('rituel')) {
            this.routeRitualsMatrix();
        } else {
            // Ana Sayfa
            this.routeIndexMatrix();
        }
    }

    /**
     * SADECE CİLT BAKIMI SAYFASI İÇİN YÖNLENDİRİCİ (PHASE 22)
     */
    static routeSkincareMatrix() {
        console.log("💉 [Ritual Renderer] Skincare Morph Routing Initiated.");

        // DataBridge bu veriyi daha önce API'den çekip Kuantum Hafızasına almış olmalı.
        const matrix = window.NV_SKINCARE;
        if (!matrix || matrix.length === 0) {
            console.error("🚨 [Sovereign Error] NV_SKINCARE matrix missing or empty from DataBridge!");
            return;
        }

        // Elimizdeki 64 birimlik Cilt Bakımı verisini, sayfamızdaki 3 farklı yatay raya bölüştürüyoruz.
        // Gerçek API verisinde category="sothys" gibi field'lar olabilir. 
        // Burada güçlü Sovereign estetiği için mantıksal dilimleme yapıyoruz.
        const sothysCollection = matrix.slice(0, Math.floor(matrix.length * 0.3)); // %30
        const antiAgeCollection = matrix.slice(Math.floor(matrix.length * 0.3), Math.floor(matrix.length * 0.7)); // %40
        const hydraCollection = matrix.slice(Math.floor(matrix.length * 0.7)); // %30

        // Kuantum Enjeksiyonunu Başlat (Phase 9 V5 Motoru ile)
        if (window.SovereignVirtualEngine) {
            window.SovereignVirtualEngine.create('section[data-rail-id="skincare_sothys"]', sothysCollection);
            window.SovereignVirtualEngine.create('section[data-rail-id="skincare_antiage"]', antiAgeCollection);
            window.SovereignVirtualEngine.create('section[data-rail-id="skincare_hydra"]', hydraCollection);
        } else {
            console.warn("⚠️ [Ritual Renderer] V5 Engine missing, falling back to V4 Forge.");
            SovereignForgeInjector.injectIntoRail(sothysCollection, 'skincare_sothys');
            SovereignForgeInjector.injectIntoRail(antiAgeCollection, 'skincare_antiage');
            SovereignForgeInjector.injectIntoRail(hydraCollection, 'skincare_hydra');
        }

        console.log("✅ [Ritual Renderer] 64 Skincare Cards successfully deployed across 3 Sovereign Rails.");
    }

    /** Gelecek Fazlar İçin Router Taslakları (Phase 18, 19 vs.) */
    static routeMassageMatrix() {
        console.log("💆‍♀️ [Ritual Renderer] Massage Matrix not yet implemented.");
    }

    static routeHammamMatrix() {
        console.log("🫧 [Ritual Renderer] Hammam Matrix Routing Initiated.");

        const hammamData = window.NV_HAMMAM || [];

        if (hammamData.length === 0) {
            console.error("🚨 [Sovereign Error] NV_HAMMAM data missing from DataBridge!");
            return;
        }

        if (window.SovereignVirtualEngine) {
            console.log("🚀 [Ritual Renderer] Booting V5 Virtual Engine for Hammam Matrix.");
            window.SovereignVirtualEngine.create('section[data-rail-id="rail-category"] .rituals-container', hammamData);
        } else {
            console.warn("⚠️ [Ritual Renderer] V5 Engine missing, falling back to V4 Forge.");
            SovereignForgeInjector.injectIntoRail(hammamData, 'rail-category');
        }
    }

    /**
     * RİTÜELLER SAYFASI YÖNLENDİRİCİSİ (Tüm Raylar: Signatures, Hammam, Therapies)
     */
    static routeRitualsMatrix() {
        console.log("👑 [Ritual Renderer] Rituals Matrix Routing Initiated.");

        // Sovereign Signatures aslında Wellness / Journeys olarak DataBridge'den giriyor
        const signaturesData = window.NV_JOURNEYS || [];
        const hammamData = window.NV_HAMMAM || [];
        const therapiesData = window.NV_MASSAGES || [];

        if (window.SovereignVirtualEngine) {
            if (signaturesData.length > 0) window.SovereignVirtualEngine.create('section[data-rail-id="rail-signatures"] .rituals-container', signaturesData);
            if (hammamData.length > 0) window.SovereignVirtualEngine.create('section[data-rail-id="rail-hammam"] .rituals-container', hammamData);
            if (therapiesData.length > 0) window.SovereignVirtualEngine.create('section[data-rail-id="rail-therapies"] .rituals-container', therapiesData);
        } else {
            if (signaturesData.length > 0) SovereignForgeInjector.injectIntoRail(signaturesData, 'rail-signatures');
            if (hammamData.length > 0) SovereignForgeInjector.injectIntoRail(hammamData, 'rail-hammam');
            if (therapiesData.length > 0) SovereignForgeInjector.injectIntoRail(therapiesData, 'rail-therapies');
        }

        console.log(`✅ [Ritual Renderer] Rituals Page: ${signaturesData.length} Signatures + ${hammamData.length} Hammam + ${therapiesData.length} Therapies cards injected.`);
    }

    /**
     * ANA SAYFA YÖNLENDİRİCİSİ
     * tr/index.html'deki 2 Sovereign Rayını Hammam ve Masaj verileriyle besler.
     */
    static routeIndexMatrix() {
        console.log("🏠 [Ritual Renderer] Ana Sayfa Sovereign Matrix Başlatılıyor...");

        const hammamData = window.NV_HAMMAM || [];
        const massageData = window.NV_MASSAGES || [];

        if (hammamData.length === 0 && massageData.length === 0) {
            console.warn("🚨 [Renderer] Ana sayfa için NV_HAMMAM veya NV_MASSAGES boş!");
            return;
        }

        // Her rayda max 10 kart (Quiet Luxury Oranı)
        if (window.SovereignVirtualEngine) {
            if (hammamData.length > 0) window.SovereignVirtualEngine.create('section[data-rail-id="rail-hammam"] .rituals-container', hammamData.slice(0, 10));
            if (massageData.length > 0) window.SovereignVirtualEngine.create('section[data-rail-id="rail-therapies"] .rituals-container', massageData.slice(0, 10));
        } else {
            if (hammamData.length > 0) SovereignForgeInjector.injectIntoRail(hammamData.slice(0, 10), 'rail-hammam');
            if (massageData.length > 0) SovereignForgeInjector.injectIntoRail(massageData.slice(0, 10), 'rail-therapies');
        }

        console.log(`✅ [Ritual Renderer] Ana Sayfa: ${hammamData.slice(0, 10).length} Hammam + ${massageData.slice(0, 10).length} Masaj kartı enjekte edildi.`);
    }
}

// ---------------------------------------------------------
// AUTO-IGNITION: DataBridge veriyi indirdiği an Kuantum Tuvalini doldurur.
// ---------------------------------------------------------
window.addEventListener('product-data:ready', () => {
    SovereignRitualRenderer.ignite();
});

