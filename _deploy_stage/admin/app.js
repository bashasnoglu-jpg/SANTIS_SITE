/**
 * SANTIS OS v5.0 — Modular Bootstrap
 * Application entry point. Initializes state and core systems.
 * Phase 2 Modularization (2026.02.14)
 *
 * Load order (defined in index.html):
 *   1. core/event-bus.js
 *   2. core/ui-engine.js
 *   3. core/tab-engine.js
 *   4. core/api-client.js
 *   5. modules/*.module.js
 *   6. app.js (this file)
 */
(function () {
    'use strict';

    // =========================================================================
    // GLOBAL STATE
    // =========================================================================
    window.localCatalog = window.localCatalog || [];
    window.localSothys = window.localSothys || []; // Apothecary Data
    window.localAtelier = window.localAtelier || []; // Atelier Data
    window.localServices = window.localServices || []; // Services Data
    window.localBlog = window.localBlog || [];
    window.auditSource = window.auditSource || null; // SSE Connection

    window.AdminState = window.AdminState || {
        blogs: [],
        audit: [],
        brokenLinks: []
    };

    window.LS_KEYS = window.LS_KEYS || {
        blogs: 'santis_admin_blogs',
        audit: 'santis_admin_audit'
    };

    // =========================================================================
    // DOM READY — Bootstrap
    // =========================================================================
    document.addEventListener('DOMContentLoaded', function () {
        console.log("🌌 SANTIS OS v5.0 (MODULAR) INITIATED...");
        console.log("📦 Modules: Core ✓ | Products ✓ | Services ✓ | Blog ✓ | Audit ✓ | Commerce ✓ | Sentinel ✓ | System ✓");

        // --- 1. Product Data Sync ---
        if (window.NV_DATA_READY && window.productCatalog) {
            localCatalog = [].concat(window.productCatalog);
            if (typeof updateProductView === 'function') updateProductView();
        } else {
            window.addEventListener('product-data:ready', function () {
                if (window.productCatalog) {
                    localCatalog = [].concat(window.productCatalog);
                    if (typeof updateProductView === 'function') updateProductView();
                }
            });
        }

        // --- 2. Audit System Init ---
        if (typeof initAuditSystem === 'function') initAuditSystem();
        if (typeof initCommandPalette === 'function') initCommandPalette();

        // --- 3. Button Bindings ---
        bind('runSiteAudit', window.runSiteAudit);
        bind('runLinkAudit', window.runLinkAudit);
        bind('downloadReportBtn', window.downloadAuditReport);
        bind('runSiteAuditFix', window.runSiteAuditFix);
        bind('openHtmlReport', window.openHtmlReport);
        bind('runDomAudit', window.runDomAudit);

        // --- 4. SEO & History ---
        if (typeof loadSeoScore === 'function') loadSeoScore();
        if (typeof loadSeoSuggestions === 'function') loadSeoSuggestions();
        if (typeof loadAuditHistory === 'function') loadAuditHistory();

        // --- 5. Initial Tab ---
        if (!location.hash) switchTab('home');

        // --- 6. Settings/Audit Checkbox Bindings (CSP-safe) ---
        var soulToggle = document.getElementById('chk-soul-engine');
        if (soulToggle && soulToggle.dataset.bound !== '1') {
            soulToggle.dataset.bound = '1';
            soulToggle.addEventListener('change', function () {
                if (typeof window.toggleSoulEngine === 'function') {
                    window.toggleSoulEngine(!!soulToggle.checked);
                }
            });
        }

        var filterBrokenOnly = document.getElementById('filterBrokenOnly');
        if (filterBrokenOnly && filterBrokenOnly.dataset.bound !== '1') {
            filterBrokenOnly.dataset.bound = '1';
            filterBrokenOnly.addEventListener('change', function () {
                if (typeof window.applyAuditFilters === 'function') {
                    window.applyAuditFilters();
                }
            });
        }

        var filterSlowOnly = document.getElementById('filterSlowOnly');
        if (filterSlowOnly && filterSlowOnly.dataset.bound !== '1') {
            filterSlowOnly.dataset.bound = '1';
            filterSlowOnly.addEventListener('change', function () {
                if (typeof window.applyAuditFilters === 'function') {
                    window.applyAuditFilters();
                }
            });
        }

        // --- 7. Media Library ---
        if (typeof MediaLibrary !== 'undefined') MediaLibrary.init();

        // --- 8. CSRF Token (Phase 3: Security) ---
        (function initCSRF() {
            fetch('/admin/api/csrf-token', { credentials: 'same-origin' })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data.csrf_token) {
                        window.__CSRF_TOKEN = data.csrf_token;
                        console.log('🔐 CSRF token loaded');
                    }
                })
                .catch(function () { /* silent - localhost bypass */ });

            // Monkey-patch fetch to auto-inject CSRF header
            var _origFetch = window.fetch;
            window.fetch = function (url, opts) {
                opts = opts || {};
                var method = (opts.method || 'GET').toUpperCase();
                if (['POST', 'PUT', 'DELETE'].indexOf(method) >= 0 && window.__CSRF_TOKEN) {
                    opts.headers = opts.headers || {};
                    if (opts.headers instanceof Headers) {
                        opts.headers.set('X-CSRF-Token', window.__CSRF_TOKEN);
                    } else {
                        opts.headers['X-CSRF-Token'] = window.__CSRF_TOKEN;
                    }
                }
                return _origFetch.call(window, url, opts);
            };
        })();

        // --- 9. EventBus Ready ---
        if (window.EventBus) {
            window.EventBus.emit('app:ready', { version: '5.0', modules: 11 });
        }

        console.log("🚀 SANTIS OS v5.0 — All systems operational.");
    });
})();
