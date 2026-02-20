/**
 * SANTIS | Product Data Bridge (Phase 3 UTF-8 Ironclad)
 * Loads canonical product dataset (JSON) and exposes it globally for legacy scripts.
 * Source of truth: assets/data/product-data.json (UTF-8, no BOM).
 */
(function () {
  const JSON_URL = '/assets/data/product-data.json?v=5.5';

  const inject = (data) => {
    // Legacy consumers expect window.productCatalog
    window.productCatalog = Array.isArray(data) ? data : [];
    // Convenience aliases used by some modules
    window.NV_PRODUCTS = window.productCatalog;

    // 🧠 NEURO-SYNC SIGNAL SOURCE
    window.NV_DATA_READY = true;
    document.dispatchEvent(new CustomEvent('product-data:ready', { detail: { count: window.productCatalog.length } }));
    console.log(`🧠 [Neuro-Sync] Signal Dispatched: product-data:ready (${window.productCatalog.length} items)`);
  };

  const fallback = () => {
    window.productCatalog = [];
    window.NV_PRODUCTS = [];
  };

  fetch(JSON_URL, { cache: 'no-store' })
    .then((resp) => resp.ok ? resp.json() : Promise.reject(resp.status))
    .then(inject)
    .catch(() => {
      console.warn('product-data.js: failed to load product-data.json, falling back to empty array');
      fallback();
    });
})();
