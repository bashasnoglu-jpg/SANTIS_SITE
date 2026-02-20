/**
 * SANTIS OS — Event Bindings v1.0
 * Phase 3: CSP Compliance
 *
 * Replaces ALL inline onclick/oninput handlers with
 * event delegation. Elements use data-action attributes
 * instead of inline JavaScript.
 *
 * Total: 79 inline handlers migrated.
 */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {

        // =====================================================================
        // 1. TAB NAVIGATION (Event Delegation on sidebar)
        // =====================================================================
        document.addEventListener('click', function (e) {
            var navItem = e.target.closest('.os-nav-item[id^="tab-"]');
            if (!navItem) return;
            // Don't handle if a data-action is already set (handled below)
            if (navItem.hasAttribute('data-action')) return;

            var tabId = navItem.id.replace('tab-', '');
            if (typeof switchTab === 'function') switchTab(tabId);

            // Panel-specific load functions
            var loadMap = {
                'activity': 'loadActivityLog',
                'redirects': 'loadRedirectsPanel',
                'health': 'loadHealthPanel',
                'tgov': 'loadTemplateGovernance',
                'flight': 'loadFlightCheck',
                'oracle': 'loadOracleDashboard'
            };

            var fn = loadMap[tabId];
            if (fn && typeof window[fn] === 'function') {
                window[fn]();
            }
        });

        // =====================================================================
        // 2. UNIVERSAL data-action HANDLER (Event Delegation)
        // =====================================================================
        document.addEventListener('click', function (e) {
            var el = e.target.closest('[data-action]');
            if (!el) return;

            var action = el.getAttribute('data-action');

            // --- Simple function calls (no args) ---
            var simpleFns = {
                'close-modal': 'closeModal',
                'save-item': 'startSaveItem',
                'close-blog-modal': 'closeBlogModal',
                'close-service-modal': 'closeServiceModal',
                'open-service-modal': 'openServiceModal',
                'open-blog-modal': 'openBlogModal',
                'save-product': 'saveProduct',
                'save-service': 'saveService',
                'save-blog': 'saveBlog',
                'save-settings': 'saveSettings',
                'save-social-data': 'saveSocialData',
                'add-redirect-entry': 'addRedirectEntry',
                'load-i18n-dashboard': 'loadI18nDashboard',
                'reload-template-governance': function () { if (typeof loadTemplateGovernance === 'function') loadTemplateGovernance(true); },
                'tgov-fix-all-inline': 'tgovFixAllInline',
                'run-seo-audit': 'runSeoAudit',
                'run-seo-ai': 'runSeoAI',
                'run-deep-audit': 'runDeepAudit',
                'run-intelligence-scan': 'runIntelligenceScan',
                'load-stats': 'loadStats',
                'load-activity-log': 'loadActivityLog',
                'load-flight-check': 'loadFlightCheck',
                'load-health-panel': function () { if (typeof loadHealthPanel === 'function') loadHealthPanel(); },
                'load-redirects-panel': function () { if (typeof loadRedirectsPanel === 'function') loadRedirectsPanel(); },
                'scan-city': 'scanCity',
                'refresh-fleet-status': 'refreshFleetStatus',
                'add-bio-link': 'addBioLink',
                'trigger-build': 'triggerBuild',
                'trigger-backup': 'triggerBackup',
                'shutdown-system': 'shutdownSystem',
                'toggle-theme': 'toggleTheme'
            };

            // Check simple function mapping
            var fnRef = simpleFns[action];
            if (fnRef) {
                if (typeof fnRef === 'function') {
                    fnRef();
                } else if (typeof window[fnRef] === 'function') {
                    window[fnRef]();
                }
                return;
            }

            // --- Navigate ---
            if (action === 'navigate-world-table') {
                location.href = 'world_table.html';
                return;
            }

            // --- Modal open with type ---
            if (action === 'open-media-from-modal') {
                if (typeof switchTab === 'function') switchTab('media');
                if (typeof closeModal === 'function') closeModal();
                return;
            }
            if (action === 'open-modal-cosmetics' && typeof openModal === 'function') { openModal('cosmetics'); return; }
            if (action === 'open-modal-atelier' && typeof openModal === 'function') { openModal('atelier'); return; }

            // --- Product table actions ---
            if (action === 'product-view' && typeof viewOnSite === 'function') {
                viewOnSite(el.getAttribute('data-id'), el.getAttribute('data-cat') || '');
                return;
            }
            if (action === 'product-edit' && typeof editProduct === 'function') {
                editProduct(el.getAttribute('data-id'));
                return;
            }
            if (action === 'product-delete' && typeof deleteProduct === 'function') {
                deleteProduct(el.getAttribute('data-id'));
                return;
            }

            // --- Service table actions ---
            if (action === 'service-edit' && typeof editService === 'function') {
                editService(el.getAttribute('data-id'));
                return;
            }
            if (action === 'service-delete' && typeof deleteService === 'function') {
                deleteService(el.getAttribute('data-id'));
                return;
            }

            // --- Blog table actions ---
            if (action === 'blog-edit' && typeof editBlog === 'function') {
                editBlog(el.getAttribute('data-id'));
                return;
            }
            if (action === 'blog-delete' && typeof deleteBlog === 'function') {
                deleteBlog(el.getAttribute('data-id'));
                return;
            }

            // --- Commerce table actions ---
            if (action === 'item-edit' && typeof editItem === 'function') {
                editItem(el.getAttribute('data-context'), el.getAttribute('data-id'));
                return;
            }
            if (action === 'item-delete' && typeof deleteItem === 'function') {
                deleteItem(el.getAttribute('data-context'), el.getAttribute('data-id'));
                return;
            }

            // --- Audit table action ---
            if (action === 'audit-fix-link' && typeof fixBrokenLink === 'function') {
                fixBrokenLink(el);
                return;
            }

            // --- System slot actions ---
            if (action === 'slot-remove') {
                var slot = el.closest('.slot-card');
                if (slot) slot.remove();
                return;
            }
            if (action === 'slot-upload' && typeof triggerUpload === 'function') {
                triggerUpload(el);
                return;
            }

            // --- Activity filters ---
            if (action.startsWith('activity-filter-')) {
                var filterMap = {
                    'activity-filter-all': 'all',
                    'activity-filter-audit': 'Audit',
                    'activity-filter-dosya': 'Dosya',
                    'activity-filter-hizmet': 'Hizmet',
                    'activity-filter-duzeltme': 'Düzeltme',
                    'activity-filter-city': 'City'
                };
                var f = filterMap[action];
                if (f && typeof setActivityFilter === 'function') setActivityFilter(f);
                return;
            }

            // --- Redirect lang filters ---
            if (action.startsWith('redirect-filter-')) {
                var lang = action.replace('redirect-filter-', '');
                if (typeof setRedirectLangFilter === 'function') setRedirectLangFilter(lang);
                return;
            }

            // --- i18n filters ---
            if (action.startsWith('i18n-filter-')) {
                var i18nFilter = action.replace('i18n-filter-', '');
                if (typeof setI18nFilter === 'function') setI18nFilter(i18nFilter);
                return;
            }

            // --- Flight Check module toggles ---
            if (action.startsWith('fc-toggle-')) {
                var mod = action.replace('fc-toggle-', '');
                if (typeof toggleFcModule === 'function') toggleFcModule(mod);
                return;
            }

            // --- City OS protocols ---
            if (action.startsWith('exec-protocol-')) {
                var protocol = action.replace('exec-', '').replace(/-/g, '_');
                if (typeof executeProtocol === 'function') executeProtocol(protocol);
                return;
            }

            // --- Trigger fix ---
            if (action.startsWith('trigger-fix-')) {
                var fixType = action.replace('trigger-fix-', '');
                if (typeof triggerFix === 'function') triggerFix(fixType);
                return;
            }

            // --- Page Builder ---
            if (action.startsWith('pb-add-')) {
                var blockType = action.replace('pb-add-', '');
                if (typeof PageBuilder !== 'undefined' && typeof PageBuilder.addBlock === 'function') {
                    PageBuilder.addBlock(blockType);
                }
                return;
            }
            if (action === 'pb-save') {
                if (typeof PageBuilder !== 'undefined' && typeof PageBuilder.save === 'function') PageBuilder.save();
                return;
            }

            // --- Export ---
            if (action === 'export-cosmetics' && typeof itemExport === 'function') { itemExport('cosmetics'); return; }
            if (action === 'export-atelier' && typeof exportData === 'function') { exportData('atelier'); return; }

            // --- AI Content ---
            if (action === 'ai-gen-product-desc' && typeof generateAIContent === 'function') { generateAIContent('inp-desc', 'desc', 'prod'); return; }
            if (action === 'ai-gen-blog-summary' && typeof generateAIContent === 'function') { generateAIContent('blog-summary', 'summary'); return; }
            if (action === 'ai-gen-blog-content' && typeof generateAIContent === 'function') { generateAIContent('blog-content', 'blog', 'blog'); return; }
            if (action === 'ai-gen-svc-desc' && typeof generateAIContent === 'function') { generateAIContent('svc-desc', 'desc', 'svc'); return; }

            // --- Media Library ---
            if (action === 'media-register-new') {
                if (typeof MediaLibrary !== 'undefined') {
                    var inp = document.getElementById('new-media-path');
                    if (inp) MediaLibrary.registerNew(inp.value);
                }
                return;
            }
            if (action === 'media-select') {
                if (typeof MediaLibrary !== 'undefined') {
                    MediaLibrary.select(el.getAttribute('data-path') || '');
                }
                return;
            }

            // --- stop propagation ---
            if (action === 'stop-propagation') {
                e.stopPropagation();
                return;
            }

            // --- close command palette ---
            if (action === 'close-command-palette') {
                if (typeof closeCommandPalette === 'function') closeCommandPalette(e);
                return;
            }
        });

        // =====================================================================
        // 3. IMAGE PREVIEW (replaces oninput)
        // =====================================================================
        var imgInput = document.getElementById('inp-img');
        if (imgInput) {
            imgInput.addEventListener('input', function () {
                var preview = document.getElementById('preview-img');
                if (preview) preview.src = '../' + this.value;
            });
        }

        // Global fallback for dynamically rendered images (CSP-safe replacement for onerror).
        document.addEventListener('error', function (e) {
            var target = e.target;
            if (!target || target.tagName !== 'IMG') return;
            var fallback = target.getAttribute('data-fallback-src');
            if (!fallback) return;
            if (target.getAttribute('src') !== fallback) {
                target.setAttribute('src', fallback);
            }
        }, true);

        console.log('🔗 [Event Bindings] CSP-compliant handlers loaded (79 migrated)');
    });
})();
