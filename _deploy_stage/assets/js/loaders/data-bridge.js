/**
 * SANTIS DATA BRIDGE V5.5 (JSON-First Architecture)
 * Replaces monolithic product-data.js
 * 
 * 1. Fetches assets/data/product-data.json asynchronously.
 * 2. Populates window.productCatalog.
 * 3. Distributes items to compatibility buckets (NV_MASSAGES, etc.) for legacy scripts.
 * 4. Dispatches 'SantisCatalogReady' event.
 */

(function () {
    console.log("🌉 [DataBridge] Initializing V5.5 Protocol...");

    window.productCatalog = window.productCatalog || [];

    // BUCKET INITIALIZATION
    window.NV_MASSAGES = [];
    window.NV_HAMMAM = [];
    window.NV_SKINCARE = [];
    window.NV_JOURNEYS = [];
    window.NV_PRODUCTS = [];

    const distributeData = (items) => {
        window.NV_MASSAGES.length = 0;
        window.NV_HAMMAM.length = 0;
        window.NV_SKINCARE.length = 0;
        window.NV_JOURNEYS.length = 0;
        window.NV_PRODUCTS.length = 0;

        items.forEach(item => {
            const cat = (item.categoryId || '').toLowerCase();
            if (cat.includes('journey') || cat.includes('paket')) {
                window.NV_JOURNEYS.push(item);
            } else if (cat.includes('massage')) {
                window.NV_MASSAGES.push(item);
            } else if (cat.includes('hammam') || cat.includes('hamam')) {
                window.NV_HAMMAM.push(item);
            } else if (cat.includes('facial') || cat.includes('skin') || cat.includes('sothys') || cat.includes('face')) {
                window.NV_SKINCARE.push(item);
            } else {
                window.NV_PRODUCTS.push(item);
            }
        });

        window.NV_PRODUCTS_ALL = items; // Global Alias
        console.log(`🌉 [DataBridge] Distribution Complete. Total: ${items.length} | Journeys: ${window.NV_JOURNEYS.length} | Massages: ${window.NV_MASSAGES.length} | Hammam: ${window.NV_HAMMAM.length}`);

        // Neuro-Sync signal (make sure listeners are notified even when we skip fetch)
        window.NV_DATA_READY = true;
        window.dispatchEvent(new CustomEvent('product-data:ready', { detail: { count: items.length } }));
    };

    const loadData = async () => {
        try {
            // Check if already populated (e.g. by another hydration source)
            if (window.productCatalog.length > 0) {
                console.log("⚡ [DataBridge] Catalog already populated, skipping fetch.");
                distributeData(window.productCatalog);
                return;
            }

            const response = await fetch('/assets/data/services.json?v=8.1');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            window.productCatalog = data;

            distributeData(data);

            // Dispatch Ready Event for Listeners
            // 🧠 NEURO-SYNC SIGNAL (Standard V3)
            window.NV_DATA_READY = true;
            window.dispatchEvent(new CustomEvent('product-data:ready', { detail: { count: data.length } }));

            // Legacy Support
            window.dispatchEvent(new CustomEvent('SantisCatalogReady', { detail: { count: data.length } }));

        } catch (err) {
            console.error("🔴 [DataBridge] CRITICAL: JSON Load Failed.", err);
            // Optional: Retry logic or UI Error Toast could be added here
        }
    };

    // Execute
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadData);
    } else {
        loadData();
    }

    // Expose Helper for Manual Reload
    window.reloadSantisCatalog = loadData;

})();
