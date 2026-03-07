/**
 * 🦅 SANTIS OS API CLIENT v1.0
 * Centralized Data Layer for Phase 2 Integration.
 * Connects Frontend to Python/FastAPI Backbone.
 */
(function () {
    const API_ROOT = 'http://127.0.0.1:8000/api/v1';

    // JS'in okuyabildiği csrf_token çerezini alır
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    let isRefreshing = false;
    let failedQueue = [];

    // Bekleyen istekleri serbest bırakan Kuantum Odası
    const processQueue = (error) => {
        failedQueue.forEach(prom => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve();
            }
        });
        failedQueue = [];
    };

    const SantisAPI = {
        /**
         * Generic Fetch Wrapper with Error Handling
         */
        async request(endpoint, options = {}) {
            try {
                if (window.location.protocol === 'file:') {
                    console.warn('⚠️ File protocol detected. API unavailable.');
                    return null;
                }

                options.credentials = 'include';
                options.headers = options.headers || {};
                if (!options.headers['Content-Type']) {
                    options.headers['Content-Type'] = 'application/json';
                }

                const method = options.method ? options.method.toUpperCase() : 'GET';
                const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

                if (isMutation) {
                    const csrfToken = getCookie('csrf_token');
                    if (csrfToken) {
                        options.headers['X-CSRF-Token'] = csrfToken;
                    }
                }

                let res = await fetch(`${API_ROOT}${endpoint}`, options);

                // 🚨 SESSİZ YENİLEME (SILENT RENEWAL) MANTIĞI
                if (res.status === 401 && !options._retry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {

                    if (isRefreshing) {
                        // Halihazırda başka bir istek token yeniliyor. Bu isteği KUYRUĞA AL ve bekle!
                        return new Promise(function (resolve, reject) {
                            failedQueue.push({ resolve, reject });
                        }).then(() => {
                            options._retry = true; // Sonsuz döngü kalkanı

                            // Yeni CSRF token'ı al ve sıradaki istekleri güncelle
                            if (isMutation) {
                                options.headers["X-CSRF-Token"] = getCookie("csrf_token");
                            }
                            return fetch(`${API_ROOT}${endpoint}`, options).then(r => r.json()); // Orijinal isteği TEKRAR DENE
                        }).catch(err => {
                            return Promise.reject(err);
                        });
                    }

                    options._retry = true;
                    isRefreshing = true;
                    console.warn("🔄 [AUTH] Access Token süresi doldu. Sessiz yenileme başlatılıyor...");

                    try {
                        const refreshResponse = await fetch(`${API_ROOT}/auth/refresh`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { "X-CSRF-Token": getCookie("csrf_token") }
                        });

                        if (refreshResponse.ok) {
                            console.log("✅ [AUTH] Oturum sessizce döndürüldü. Bekleyen istekler serbest bırakılıyor.");
                            isRefreshing = false;
                            processQueue(null);

                            if (isMutation) {
                                options.headers["X-CSRF-Token"] = getCookie("csrf_token");
                            }
                            res = await fetch(`${API_ROOT}${endpoint}`, options);
                        } else {
                            throw new Error("Refresh token expired or revoked");
                        }
                    } catch (refreshError) {
                        console.error("🛑 [AUTH CRASH] Oturum kurtarılamadı. Kill Switch aktif. Login'e yönlendiriliyor.");
                        processQueue(refreshError);
                        isRefreshing = false;
                        window.location.href = "/login";
                        return Promise.reject(refreshError);
                    }
                }

                if (!res.ok) {
                    const errorText = await res.text();
                    let detail = res.statusText;
                    try {
                        const jsonErr = JSON.parse(errorText);
                        if (jsonErr.detail) detail = jsonErr.detail;
                    } catch (e) { }
                    throw new Error(`API Error ${res.status}: ${detail}`);
                }
                return await res.json();
            } catch (e) {
                console.error(`🔌 Santis API Failure [${endpoint}]:`, e);
                return null;
            }
        },

        async get(endpoint) {
            return this.request(endpoint, { method: 'GET' });
        },

        async post(endpoint, data) {
            return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) });
        },

        async put(endpoint, data) {
            return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) });
        },

        async delete(endpoint) {
            return this.request(endpoint, { method: 'DELETE' });
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
