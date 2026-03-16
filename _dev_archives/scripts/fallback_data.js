/**
 * SANTIS — Fallback Data Store
 * home-products.js ve app.js bu dosyayı yükleyemezse bu global'i kullanır.
 * Gerçek veri: /assets/data/services.json veya santis-data-bridge.js üzerinden gelir.
 */
window.NV_PRODUCTS = window.NV_PRODUCTS || [];
window.productCatalog = window.productCatalog || [];
window.NV_MASSAGE = window.NV_MASSAGE || [];
window.NV_HAMMAM = window.NV_HAMMAM || [];
window.NV_SKINCARE = window.NV_SKINCARE || [];
window.SovereignDataMatrix = window.SovereignDataMatrix || [];

// Eğer data-bridge henüz yüklemediyse services.json'dan bootstrap yap
if (!window.__SANTIS_RAIL_READY__) {
    fetch('/assets/data/services.json')
        .then(r => r.json())
        .then(data => {
            // SADECE FALLBACK DATA (Event fırlatma! data-bridge'in event'ini bozuyor)
            window.SovereignDataMatrix = data.categories ? data.categories.flatMap(c => c.services || c.items) : (data.services || data);
            window.productCatalog = Array.isArray(window.SovereignDataMatrix) ? [...window.SovereignDataMatrix] : window.SovereignDataMatrix;
            window.__SANTIS_RAIL_READY__ = true;
            console.log('[Fallback] services.json bootstrap: ' + window.productCatalog.length + ' kayıt');
        })
        .catch(() => console.warn('[Fallback] services.json yüklenemedi'));
}
