/**
 * SANTIS OS — Admin Registry v1.0
 * Central namespace for all admin modules.
 * Replaces 100+ window.* exports with single window.SantisAdmin.
 * 
 * MUST load FIRST (before all other modules).
 */
(function () {
    'use strict';

    var SA = {
        version: '5.1.0',
        ready: false,

        // ── Module Namespaces ──
        api: {},         // centralized fetch wrapper (api-wrapper.js)
        errors: {},      // error boundary (error-boundary.js)
        ui: {},          // showToast, openModal, closeModal, switchTab
        dashboard: {},   // loadStats, chart rendering
        seo: {},         // runSeoAudit, runSeoAI, loadSeoScore
        activity: {},    // loadActivityLog, setActivityFilter
        health: {},      // loadHealthPanel
        redirects: {},   // loadRedirectsPanel, addRedirectEntry, deleteRedirectEntry
        oracle: {},      // loadOracleDashboard
        flight: {},      // loadFlightCheck, toggleFcModule
        tgov: {},        // loadTemplateGovernance, tgovFixAllInline
        i18n: {},        // loadI18nDashboard, setI18nFilter
        city: {},        // scanCity, executeProtocol
        sentinel: {},    // refreshFleetStatus
        media: {},       // MediaLibrary proxy
        products: {},    // product CRUD
        services: {},    // service CRUD
        blog: {},        // blog CRUD
        commerce: {},    // commerce module
        system: {},      // system module
        build: {},       // triggerBuild, triggerBackup, shutdownSystem
        audit: {},       // audit module
        pageBuilder: {}, // PageBuilder

        /**
         * Register a module's methods into a namespace.
         * Also creates backward-compatible window.* proxies.
         * 
         * @param {string} namespace - e.g. 'health'
         * @param {Object} methods - e.g. { loadPanel: fn, ... }
         * @param {Object} [windowAliases] - e.g. { loadHealthPanel: 'loadPanel' }
         */
        register: function (namespace, methods, windowAliases) {
            if (!SA[namespace]) SA[namespace] = {};

            Object.keys(methods).forEach(function (key) {
                SA[namespace][key] = methods[key];
            });

            // Backward-compatible window.* proxies
            if (windowAliases) {
                Object.keys(windowAliases).forEach(function (globalName) {
                    var localName = windowAliases[globalName];
                    if (typeof SA[namespace][localName] === 'function') {
                        window[globalName] = SA[namespace][localName];
                    }
                });
            }
        },

        /**
         * Get a registered method safely.
         * @param {string} path - e.g. 'health.loadPanel'
         * @returns {Function|undefined}
         */
        get: function (path) {
            var parts = path.split('.');
            var current = SA;
            for (var i = 0; i < parts.length; i++) {
                current = current[parts[i]];
                if (current === undefined) return undefined;
            }
            return current;
        },

        /**
         * Call a registered method safely, with fallback.
         * @param {string} path - e.g. 'health.loadPanel'
         * @param {...*} args
         * @returns {*}
         */
        call: function (path) {
            var fn = SA.get(path);
            if (typeof fn === 'function') {
                var args = Array.prototype.slice.call(arguments, 1);
                return fn.apply(null, args);
            }
        }
    };

    // ── Expose as single global ──
    window.SantisAdmin = SA;
})();
