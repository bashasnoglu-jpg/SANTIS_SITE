/**
 * SANTIS OS — API Wrapper v1.0
 * Centralized fetch handler with timeout, CSRF, retry, and error normalization.
 * 
 * Requires: admin-registry.js (SantisAdmin)
 */
(function () {
    'use strict';

    var DEFAULT_TIMEOUT = 15000; // 15s
    var MAX_RETRIES = 1;

    /**
     * Core request method.
     * @param {string} endpoint
     * @param {Object} [options]
     * @param {string} [options.method='GET']
     * @param {Object} [options.headers]
     * @param {*} [options.body]
     * @param {number} [options.timeout=15000]
     * @param {number} [options.retries=1]
     * @param {boolean} [options.raw=false] - return Response instead of JSON
     * @returns {Promise<*>}
     */
    async function request(endpoint, options) {
        options = options || {};
        var method = options.method || 'GET';
        var timeout = options.timeout || DEFAULT_TIMEOUT;
        var retries = options.retries != null ? options.retries : MAX_RETRIES;
        var attempt = 0;

        while (attempt <= retries) {
            var controller = new AbortController();
            var timer = setTimeout(function () { controller.abort(); }, timeout);

            try {
                var headers = Object.assign({}, options.headers || {});

                // Auto-inject CSRF for write operations
                if (method !== 'GET' && method !== 'HEAD') {
                    var csrf = window._csrfToken || document.querySelector('meta[name="csrf-token"]')?.content;
                    if (csrf) headers['X-CSRF-Token'] = csrf;
                }

                var fetchOpts = {
                    method: method,
                    headers: headers,
                    signal: controller.signal
                };

                if (options.body) {
                    if (typeof options.body === 'string' || options.body instanceof FormData) {
                        fetchOpts.body = options.body;
                    } else {
                        fetchOpts.body = JSON.stringify(options.body);
                        if (!headers['Content-Type']) {
                            headers['Content-Type'] = 'application/json';
                        }
                    }
                }

                var startTime = performance.now();
                var resp = await fetch(endpoint, fetchOpts);
                var latency = Math.round(performance.now() - startTime);

                // Track latency for health overlay
                if (window.SantisAdmin && window.SantisAdmin._lastLatency !== undefined) {
                    window.SantisAdmin._lastLatency = latency;
                }

                if (!resp.ok) {
                    var errBody = null;
                    try { errBody = await resp.text(); } catch (_) { }
                    var err = new Error('HTTP ' + resp.status + ': ' + (errBody || resp.statusText));
                    err.status = resp.status;
                    err.endpoint = endpoint;
                    throw err;
                }

                if (options.raw) return resp;
                return await resp.json();

            } catch (err) {
                clearTimeout(timer);

                if (err.name === 'AbortError') {
                    err = new Error('Timeout: ' + endpoint + ' (' + timeout + 'ms)');
                    err.isTimeout = true;
                }

                // Retry on network/timeout errors (not 4xx/5xx)
                if (attempt < retries && !err.status) {
                    attempt++;
                    continue;
                }

                // Report to error boundary
                if (window.SantisAdmin && typeof window.SantisAdmin.errors.report === 'function') {
                    window.SantisAdmin.errors.report(err, {
                        endpoint: endpoint,
                        method: method,
                        attempt: attempt
                    });
                }
                throw err;

            } finally {
                clearTimeout(timer);
            }
        }
    }

    // ── Register on SantisAdmin ──
    var api = {
        request: request,

        get: function (url, opts) {
            return request(url, Object.assign({ method: 'GET' }, opts || {}));
        },

        post: function (url, body, opts) {
            return request(url, Object.assign({ method: 'POST', body: body }, opts || {}));
        },

        put: function (url, body, opts) {
            return request(url, Object.assign({ method: 'PUT', body: body }, opts || {}));
        },

        del: function (url, opts) {
            return request(url, Object.assign({ method: 'DELETE' }, opts || {}));
        }
    };

    if (window.SantisAdmin) {
        window.SantisAdmin.api = api;
        window.SantisAdmin._lastLatency = 0;
    }
})();
