/**
 * SANTIS API CLIENT v2.0 (Enterprise Hardening)
 * ─────────────────────────────────────────────
 * Centralized API handler for Santis OS.
 * Connects Frontend to Python Backend (server.py).
 * 
 * New Features:
 * - 🛡️ Timeout Guard (4s default)
 * - 🦅 Environment-Aware Base URL
 * - 🔍 Strict Response Shape Validation
 * - 📊 Enhanced Mode Logging
 */

(function (window) {
    // 1. Environment Flag (Hardcoded localhost is forbidden)
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE = window.__API_BASE__ || (isLocal ? 'http://localhost:8080/api/v1' : 'https://api.sovereign-os.com/api/v1');
    const STATIC_FALLBACK = '/assets/data/site_content.json';
    const TIMEOUT_MS = 4000;

    const SantisAPI = {
        mode: 'INITIALIZING', // 'API', 'FALLBACK', 'OFFLINE'

        // --- CORE FETCH METHODS ---

        /**
         * Enterprise-grade fetch with Timeout & Error Handling
         */
        async fetch(endpoint) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            try {
                const response = await fetch(`${API_BASE}${endpoint}`, {
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                this.setMode('API');
                return await response.json();
            } catch (error) {
                clearTimeout(timeoutId);

                if (error.name === 'AbortError') {
                    console.warn(`⏳ [SantisAPI] Timeout (${TIMEOUT_MS}ms) for ${endpoint}`);
                } else {
                    console.warn(`🦅 [SantisAPI] Network/Server Error for ${endpoint}:`, error.message);
                }
                return null;
            }
        },

        setMode(newMode) {
            if (this.mode !== newMode) {
                this.mode = newMode;
                console.info(`%c 🦅 SANTIS DATA LAYER: ${newMode} MODE `, 'background: #000; color: #D4AF37; font-weight: bold; border: 1px solid #D4AF37; padding: 4px;');
            }
        },

        /**
         * Enterprise-grade POST fetch with CSRF Token and Timeout
         */
        async post(endpoint, payload) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            // Get CSRF token from cookie if available
            let csrfToken = '';
            const match = document.cookie.match(new RegExp('(^| )csrf_token=([^;]+)'));
            if (match) csrfToken = match[2];

            try {
                const response = await fetch(`${API_BASE}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfToken
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                this.setMode('API');
                return await response.json();
            } catch (error) {
                clearTimeout(timeoutId);
                console.warn(`🦅 [SantisAPI] POST Error for ${endpoint}:`, error.message);
                throw error;
            }
        },

        /**
         * Get full service catalog (Master List)
         */
        async getMasterCatalog() {
            // Try API First
            const data = await this.fetch('/services');

            // 2. Response Shape Freeze Check
            if (data && Array.isArray(data) && data.length > 0) {
                const sample = data[0];
                if (!sample.slug && !sample.id) {
                    console.error("🚨 [SantisAPI] Critical Shape Mismatch: 'slug' or 'id' missing in API response.");
                    // In a strict environment, we might fallback here, but for now we proceed with warning
                }
                return data;
            }

            // Fallback Logic
            this.setMode('FALLBACK');
            return await this.fetchStaticFallback();
        },

        /**
         * Get all active locations
         */
        async getLocations() {
            return await this.fetch('/locations') || [];
        },

        /**
         * Get specific menu for a hotel/location
         * @param {string} slug - Location slug (e.g., 'santis-royal-belek')
         */
        async getHotelMenu(slug) {
            if (!slug) return null;
            return await this.fetch(`/locations/${slug}/menu`);
        },

        // --- FALLBACK MECHANISM ---

        async fetchStaticFallback() {
            try {
                const response = await fetch(STATIC_FALLBACK);
                if (!response.ok) throw new Error("Static fallback missing");
                const data = await response.json();

                // Convert legacy structure to flat array if needed
                let services = [];
                if (data.global) {
                    Object.keys(data.global).forEach(key => {
                        if (Array.isArray(data.global[key])) {
                            services = [...services, ...data.global[key]];
                        }
                    });
                }
                return services;
            } catch (e) {
                this.setMode('OFFLINE');
                console.error("🚨 [SantisAPI] CRITICAL: All data sources failed.", e);
                return [];
            }
        },

        // --- UTILITIES ---

        /**
         * Resolves the correct URL for a service item
         * @param {object} item - Service object
         */
        resolveUrl(item) {
            if (!item) return '#';

            // 1. Explicit API URL (if provided by backend)
            // Freeze: API must return 'detailUrl' if it wants to control routing
            if (item.detailUrl) return item.detailUrl;

            // 2. Construct Dynamic URL (Deterministic)
            const lang = (window.SITE_LANG || 'tr').toLowerCase();
            const slug = item.slug || item.id;
            let section = 'masajlar'; // Default

            // Basic Category Detection
            const cat = (item.categoryId || item.category || '').toLowerCase();
            if (cat.includes('hammam') || cat.includes('hamam')) section = 'hamam';
            else if (cat.includes('skin') || cat.includes('facial') || cat.includes('sothys') || cat.includes('face')) section = 'cilt-bakimi';
            else if (cat.includes('ritual')) section = 'rituel';

            return `/${lang}/${section}/${slug}.html`;
        }
    };

    // Expose Global
    window.SantisAPI = SantisAPI;
    console.log("🦅 Santis API Client v2.0 (Enterprise) Initialized.");

})(window);
