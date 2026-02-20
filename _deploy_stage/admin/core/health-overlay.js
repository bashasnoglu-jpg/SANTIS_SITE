/**
 * SANTIS OS — Health Overlay v1.0
 * Persistent mini status indicator in bottom-right corner of admin panel.
 * Shows: API latency, error count, auth status, system state.
 * 
 * Requires: admin-registry.js, error-boundary.js
 */
(function () {
    'use strict';

    var REFRESH_INTERVAL = 10000; // 10s
    var _overlayEl = null;
    var _timer = null;

    function createOverlay() {
        if (_overlayEl) return;

        _overlayEl = document.createElement('div');
        _overlayEl.id = 'sa-health-overlay';
        _overlayEl.style.cssText =
            'position:fixed; bottom:16px; right:16px; z-index:9998; ' +
            'background:rgba(10,10,15,0.92); border:1px solid rgba(255,255,255,0.08); ' +
            'border-radius:12px; padding:8px 14px; font-size:11px; ' +
            'font-family:"SF Mono","Consolas",monospace; color:#888; ' +
            'display:flex; align-items:center; gap:12px; ' +
            'backdrop-filter:blur(12px); cursor:pointer; ' +
            'transition:all 0.3s ease; user-select:none;';

        _overlayEl.innerHTML =
            '<span id="sa-health-dot" style="width:8px; height:8px; border-radius:50%; background:#00ff88; display:inline-block; box-shadow:0 0 6px rgba(0,255,136,0.4);"></span>' +
            '<span id="sa-health-latency" style="color:#666;">–ms</span>' +
            '<span id="sa-health-error-count" style="display:none; background:rgba(255,68,68,0.2); color:#ff4444; padding:1px 6px; border-radius:8px; font-size:10px; font-weight:600;">0</span>' +
            '<span id="sa-health-auth" style="color:#444;">●</span>';

        // Hover effect
        _overlayEl.addEventListener('mouseenter', function () {
            _overlayEl.style.borderColor = 'rgba(212,175,55,0.3)';
            _overlayEl.style.background = 'rgba(10,10,15,0.96)';
        });
        _overlayEl.addEventListener('mouseleave', function () {
            _overlayEl.style.borderColor = 'rgba(255,255,255,0.08)';
            _overlayEl.style.background = 'rgba(10,10,15,0.92)';
        });

        // Click to toggle detail panel
        _overlayEl.addEventListener('click', toggleDetailPanel);

        document.body.appendChild(_overlayEl);
    }

    function updateOverlay() {
        var SA = window.SantisAdmin;
        if (!SA || !_overlayEl) return;

        // Latency
        var latencyEl = document.getElementById('sa-health-latency');
        if (latencyEl) {
            var lat = SA._lastLatency || 0;
            latencyEl.textContent = lat + 'ms';
            latencyEl.style.color = lat < 300 ? '#00ff88' : lat < 800 ? '#ffaa00' : '#ff4444';
        }

        // Error count
        var errorEl = document.getElementById('sa-health-error-count');
        if (errorEl && SA.errors) {
            var count = SA.errors.errorCount || 0;
            errorEl.textContent = count;
            errorEl.style.display = count > 0 ? 'inline-block' : 'none';
        }

        // Status dot
        var dot = document.getElementById('sa-health-dot');
        if (dot) {
            var errors = SA.errors ? SA.errors.errorCount : 0;
            var latency = SA._lastLatency || 0;
            if (errors > 5) {
                dot.style.background = '#ff4444';
                dot.style.boxShadow = '0 0 6px rgba(255,68,68,0.4)';
            } else if (errors > 0 || latency > 800) {
                dot.style.background = '#ffaa00';
                dot.style.boxShadow = '0 0 6px rgba(255,170,0,0.4)';
            } else {
                dot.style.background = '#00ff88';
                dot.style.boxShadow = '0 0 6px rgba(0,255,136,0.4)';
            }
        }

        // Auth indicator
        var authEl = document.getElementById('sa-health-auth');
        if (authEl) {
            var hasAuth = !!(window._csrfToken || document.cookie.indexOf('session') !== -1);
            authEl.style.color = hasAuth ? '#00ff88' : '#ff4444';
            authEl.title = hasAuth ? 'Authenticated' : 'No session';
        }
    }

    // ── Detail Panel ──
    var _detailVisible = false;

    function toggleDetailPanel() {
        var panel = document.getElementById('sa-health-detail');
        if (panel) {
            _detailVisible = !_detailVisible;
            panel.style.display = _detailVisible ? 'block' : 'none';
            if (_detailVisible) renderDetailPanel();
            return;
        }

        // Create panel
        panel = document.createElement('div');
        panel.id = 'sa-health-detail';
        panel.style.cssText =
            'position:fixed; bottom:50px; right:16px; z-index:9999; ' +
            'background:rgba(10,10,15,0.96); border:1px solid rgba(255,255,255,0.1); ' +
            'border-radius:14px; padding:16px; width:280px; font-size:12px; ' +
            'font-family:"SF Mono","Consolas",monospace; color:#ccc; ' +
            'backdrop-filter:blur(16px); box-shadow:0 8px 32px rgba(0,0,0,0.5);';
        document.body.appendChild(panel);
        _detailVisible = true;
        renderDetailPanel();
    }

    function renderDetailPanel() {
        var panel = document.getElementById('sa-health-detail');
        if (!panel) return;
        var SA = window.SantisAdmin;

        var errors = SA.errors ? SA.errors.recent(5) : [];
        var errorHtml = '';
        if (errors.length === 0) {
            errorHtml = '<div style="color:#00ff88; padding:4px 0;">✅ No errors</div>';
        } else {
            errors.forEach(function (e) {
                errorHtml += '<div style="padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.05);">' +
                    '<span style="color:#666;">' + e.time + '</span> ' +
                    '<span style="color:#ff6b6b;">' + (e.msg || '').substring(0, 40) + '</span></div>';
            });
        }

        panel.innerHTML =
            '<div style="display:flex; justify-content:space-between; margin-bottom:12px;">' +
            '<span style="color:#d4af37; font-weight:600;">SantisOS Health</span>' +
            '<span style="color:#444; cursor:pointer;" id="sa-health-close">✕</span></div>' +

            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">' +
            '<div style="background:rgba(255,255,255,0.03); padding:8px; border-radius:8px; text-align:center;">' +
            '<div style="font-size:16px; font-weight:700; color:#fff;">' + (SA._lastLatency || 0) + '<span style="font-size:10px; color:#666;">ms</span></div>' +
            '<div style="font-size:9px; color:#555;">LATENCY</div></div>' +

            '<div style="background:rgba(255,255,255,0.03); padding:8px; border-radius:8px; text-align:center;">' +
            '<div style="font-size:16px; font-weight:700; color:' + ((SA.errors?.errorCount || 0) > 0 ? '#ff4444' : '#00ff88') + ';">' + (SA.errors?.errorCount || 0) + '</div>' +
            '<div style="font-size:9px; color:#555;">ERRORS</div></div></div>' +

            '<div style="font-size:10px; color:#555; margin-bottom:6px; text-transform:uppercase; letter-spacing:1px;">Recent Errors</div>' +
            errorHtml +

            '<div style="margin-top:10px; text-align:center;">' +
            '<button id="sa-health-clear" style="background:none; border:1px solid #333; color:#888; padding:4px 12px; border-radius:6px; font-size:10px; cursor:pointer;">Clear Log</button></div>';

        // Close button
        var closeBtn = document.getElementById('sa-health-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                _detailVisible = false;
                panel.style.display = 'none';
            });
        }

        // Clear button
        var clearBtn = document.getElementById('sa-health-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (SA.errors) SA.errors.clear();
                updateOverlay();
                renderDetailPanel();
            });
        }
    }

    // ── Init ──
    document.addEventListener('DOMContentLoaded', function () {
        // Only show on admin pages
        if (!window.SantisAdmin) return;

        createOverlay();
        updateOverlay();

        // Periodic refresh
        _timer = setInterval(updateOverlay, REFRESH_INTERVAL);

        // Mark ready
        window.SantisAdmin.ready = true;
    });

    // ── Register ──
    if (window.SantisAdmin) {
        window.SantisAdmin.register('health', {
            showOverlay: createOverlay,
            updateOverlay: updateOverlay,
            toggleDetail: toggleDetailPanel
        });
    }
})();
