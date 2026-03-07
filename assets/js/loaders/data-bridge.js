/**
 * THE SOVEREIGN ENGINE DATA BRIDGE V6.0 (SaaS Multi-Tenant Protocol)
 * Replaces monolithic product-data.js & V5 Data Bridge
 * 
 * 1. Identifies Tenant ID via window.location.hostname
 * 2. Fetches tenant-isolated config/catalog asynchronously.
 * 3. Populates window.productCatalog.
 * 4. Distributes items via Sovereign Isolation Buckets.
 */

(function () {
    console.log("🌉 [Sovereign Bridge] Initializing V6.0 SaaS Protocol...");
    const API_BASE = window.__API_BASE__ || 'http://127.0.0.1:8000/api/v1';

    // 1. TENANT HEARTBEAT ALGORITHM
    const hostname = window.location.hostname;
    let tenant_id = 'santis_hq'; // Default Local/Master Tenant

    if (hostname.includes('amanspa.com')) tenant_id = 'tenant_aman';
    else if (hostname.includes('rixos.com')) tenant_id = 'tenant_rixos';
    else if (hostname.includes('santisclub.com')) tenant_id = 'tenant_santis';

    window.SANTIS_TENANT_ID = tenant_id;
    console.log(`🌍 [Global Context] Tenant Heartbeat Locked: ${tenant_id}`);

    window.productCatalog = window.productCatalog || [];

    // BUCKET INITIALIZATION
    window.NV_MASSAGES = [];
    window.NV_HAMMAM = [];
    window.NV_SKINCARE = [];
    window.NV_JOURNEYS = [];
    window.NV_PRODUCTS = [];

    const distributeData = (items) => {
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch (e) { }
        }
        if (!Array.isArray(items)) {
            console.error("🔴 [DataBridge] distributeData received non-array data:", typeof items, items);
            // Emergency fallback
            items = [];
        }

        window.NV_MASSAGES = [];
        window.NV_HAMMAM = [];
        window.NV_SKINCARE = [];
        window.NV_JOURNEYS = [];
        window.NV_PRODUCTS = [];

        items.forEach(item => {
            // Support both old 'categoryId' and new 'category' fields
            const cat = (item.categoryId || item.category || '').toLowerCase();

            if (cat === 'wellness' || cat.includes('journey')) {
                window.NV_JOURNEYS.push(item);
            } else if (cat.startsWith('massage') || cat === 'massage' || cat === 'classicmassages' || cat === 'asianmassages' || cat === 'sportstherapy') {
                window.NV_MASSAGES.push(item);
            } else if (cat.includes('hammam') || cat.startsWith('ritual-hammam') || cat === 'hamam') {
                window.NV_HAMMAM.push(item);
            } else if (cat.startsWith('skincare') || cat.startsWith('sothys') || cat === 'facesothys') {
                window.NV_SKINCARE.push(item);
            } else {
                window.NV_PRODUCTS.push(item);
            }
        });

        window.NV_PRODUCTS_ALL = items; // Global Alias
        window.santisServices = items; // The user's requested fix
        window.services = items;
        window.catalog = items;
        window.santisCatalog = items;
        window.dataBridge = true;

        console.log(`🌉 [DataBridge] Distribution Complete. Total: ${items.length} | Journeys(Wellness): ${window.NV_JOURNEYS.length} | Massages: ${window.NV_MASSAGES.length} | Hammam: ${window.NV_HAMMAM.length} | Skincare: ${window.NV_SKINCARE.length}`);

        // Neuro-Sync signal (make sure listeners are notified even when we skip fetch)
        window.NV_DATA_READY = true;
        window.dispatchEvent(new CustomEvent('product-data:ready', { detail: { count: items.length } }));
    };

    const loadData = async () => {
        try {
            // Check if already populated
            if (window.productCatalog.length > 0) {
                console.log("⚡ [Sovereign Bridge] Catalog already populated, skipping fetch.");
                distributeData(window.productCatalog);
                return;
            }

            // ✅ FIX: Fetch API directly — do NOT wait for window.SantisAPI
            // SantisAPI loads AFTER data-bridge.js, so if(window.SantisAPI) NEVER enters.
            let data = null;
            try {
                console.log(`🦅 [Sovereign Bridge] Fetching from Edge API: ${API_BASE}/services?tenant_id=${window.SANTIS_TENANT_ID}`);
                const response = await fetch(`${API_BASE}/services?tenant_id=${window.SANTIS_TENANT_ID}`);
                if (response.ok) {
                    const parsed = await response.json();
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        data = parsed;
                        console.log(`✅ [Sovereign Bridge] API success: ${data.length} services loaded.`);
                    }
                }
            } catch (e) {
                console.log("⚠️ [Sovereign Bridge] API fetch failed, using fallback...", e.message);
            }

            // SantisAPI secondary attempt (if API returned nothing)
            if (!data && window.SantisAPI) {
                try { data = await window.SantisAPI.getMasterCatalog(); } catch (_) { }
            }

            // Fallback to static JSON
            if (!data || data.length === 0) {
                console.log(`⚠️ [Sovereign Bridge] API unavailable for ${window.SANTIS_TENANT_ID}, falling back to static services.json`);
                // Temporary static resolution
                const response = await fetch(`/assets/data/services.json?v=12.0&tenant=${window.SANTIS_TENANT_ID}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                data = await response.json();
            }

            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (e) { }
            }
            if (!Array.isArray(data)) data = [];

            window.productCatalog = data;
            distributeData(data);

        } catch (err) {
            console.error("🔴 [DataBridge] CRITICAL: JSON Load Failed.", err);
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
