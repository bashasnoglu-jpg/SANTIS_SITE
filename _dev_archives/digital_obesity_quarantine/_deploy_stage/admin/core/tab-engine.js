/**
 * SANTIS OS — Tab Engine v1.0
 * Single canonical tab switcher with lazy-load hooks.
 * Phase 2 Modularization (2026.02.14)
 */
(function () {
    'use strict';

    /**
     * Switch between admin panel tabs.
     * Manages nav active state, content visibility, and lazy-loads tab modules.
     * @param {string} tabName - Tab identifier (matches id="tab-{name}" and id="view-{name}")
     */
    window.switchTab = function (tabName) {
        // 1. Deactivate all nav items
        document.querySelectorAll('.os-nav-item').forEach(function (el) {
            el.classList.remove('active');
        });
        var tabEl = document.getElementById('tab-' + tabName);
        if (tabEl) tabEl.classList.add('active');

        // 2. Hide all content layers, show target
        document.querySelectorAll('.content-layer').forEach(function (el) {
            el.classList.remove('active');
        });
        var viewEl = document.getElementById('view-' + tabName);
        if (viewEl) viewEl.classList.add('active');

        // 3. Lazy-load tab-specific initializers (typeof guards for safety)
        try {
            if (tabName === 'services' && typeof initServices === 'function') initServices();
            if (tabName === 'blog' && typeof initBlog === 'function') initBlog();
            if (tabName === 'settings' && typeof initSettings === 'function') initSettings();
            if (tabName === 'social' && typeof initSocial === 'function') setTimeout(initSocial, 100);
            if (tabName === 'sentinel-fleet' && typeof initSentinelFleet === 'function') initSentinelFleet();
            if (tabName === 'cosmetics' && typeof initCosmetics === 'function') initCosmetics();
            if (tabName === 'atelier' && typeof initAtelier === 'function') initAtelier();
            if (tabName === 'activity' && typeof loadActivityLog === 'function') loadActivityLog();
            if (tabName === 'redirects' && typeof loadRedirectsPanel === 'function') loadRedirectsPanel();
            if (tabName === 'health' && typeof loadHealthPanel === 'function') loadHealthPanel();
            if (tabName === 'tgov' && typeof loadTemplateGovernance === 'function') loadTemplateGovernance();
            if (tabName === 'flight' && typeof loadFlightCheck === 'function') loadFlightCheck();
            if (tabName === 'i18n' && typeof loadI18nDashboard === 'function') loadI18nDashboard();
            if (tabName === 'gallery' && typeof initGallery === 'function') initGallery();
        } catch (e) {
            console.warn('[TabEngine] Lazy-load error for ' + tabName + ':', e);
        }

        // 4. Emit event for interested modules
        if (window.EventBus) {
            window.EventBus.emit('tab:switched', { tab: tabName });
        }
    };

    console.log('📑 [Core] Tab Engine v1.0 loaded');
})();
