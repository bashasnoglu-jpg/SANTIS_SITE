/**
 * 🦅 SANTIS OS API CLIENT v1.0
 * Centralized Data Layer for Phase 2 Integration.
 * Connects Frontend to Python/FastAPI Backbone.
 */
(function () {
    const API_ROOT = '/api/v1';

    const SantisAPI = {
        /**
         * Generic Fetch Wrapper with Error Handling
         */
        async get(endpoint) {
            try {
                // Handle local file protocol fallback gracefully
                if (window.location.protocol === 'file:') {
                    console.warn('⚠️ File protocol detected. API unavailable.');
                    return null;
                }

                const res = await fetch(`${API_ROOT}${endpoint}`);
                if (!res.ok) {
                    throw new Error(`API Error ${res.status}: ${res.statusText}`);
                }
                return await res.json();
            } catch (e) {
                console.error(`🔌 Santis API Failure [${endpoint}]:`, e);
                return null;
            }
        },

        /**
         * Get Master Service Catalog
         * @returns {Promise<Array>} List of all services
         */
        async getMasterCatalog() {
            return await this.get('/services') || [];
        },

        /**
         * Get All Active Locations
         * @returns {Promise<Array>} List of hotels
         */
        async getLocations() {
            return await this.get('/locations') || [];
        },

        /**
         * Get Specific Hotel Menu with Pricing
         * @param {string} slug - Hotel slug (e.g. 'alba-royal')
         * @returns {Promise<Object>} { location: {}, menu: [] }
         */
        async getHotelMenu(slug) {
            if (!slug) return null;
            return await this.get(`/locations/${slug}/menu`);
        }
    };

    // Expose Global
    window.SantisAPI = SantisAPI;
    console.log("🦅 Santis OS API Client Initialized");
})();
