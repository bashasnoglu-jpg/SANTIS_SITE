/**
 * SANTIS OS — Sentinel Module v1.0
 * Fleet management and status monitoring.
 * Phase 2 Modularization (2026.02.14)
 */
(function () {
    'use strict';

    window.initSentinelFleet = async function () {
        console.log("🌍 Initializing Sentinel Fleet View (V2)...");
        await refreshFleetStatus();
    };

    window.refreshFleetStatus = async function () {
        var grid = document.getElementById('fleet-grid');
        if (!grid) return;

        grid.innerHTML = '<div class="text-center w-full" style="padding:20px; color:#666;">Loading Fleet Data...</div>';

        try {
            var response = await fetch('/admin/sentinel/fleet');
            var data = await response.json();

            if (data.fleet && data.fleet.length > 0) {
                grid.innerHTML = '';
                data.fleet.forEach(function (site) {
                    var card = document.createElement('div');
                    card.className = 'os-stat-box';
                    card.style.textAlign = 'left';
                    card.style.borderLeft = '4px solid ' + (site.status.state === 'IDLE' ? '#00ff88' : '#ff4444');

                    var statusColor = '#00ff88';
                    if (site.status.state === 'SCANNING') statusColor = '#ffa500';
                    if (site.status.state === 'ERROR') statusColor = '#ff4444';

                    var recentActions = (site.status.actions_today || []).slice(-3);
                    var actionsHtml = recentActions.length > 0
                        ? recentActions.map(function (a) {
                            return '<div style="border-bottom:1px solid rgba(255,255,255,0.1); padding:4px 0;">[' + (a.result || 'OK') + '] ' + (a.action || 'Unknown') + '</div>';
                        }).join('')
                        : '<div class="text-center" style="opacity:0.5; padding-top:10px;">No actions today</div>';

                    card.innerHTML =
                        '<div class="flex" style="justify-content:space-between; align-items:center; margin-bottom:15px;">' +
                        '<h3 class="text-white" style="margin:0; font-size:18px;">' + site.id.toUpperCase() + '</h3>' +
                        '<span class="os-badge" style="background:' + statusColor + '; color:#000; padding:2px 6px; border-radius:4px; font-weight:bold;">' + (site.status.health || 'N/A') + '</span>' +
                        '</div>' +
                        '<div style="font-size:12px; color:#888; margin-bottom:15px;">' +
                        '<div><strong>State:</strong> <span style="color:' + statusColor + '">' + site.status.state + '</span></div>' +
                        '<div><strong>Last Scan:</strong> ' + (site.status.last_scan ? new Date(site.status.last_scan).toLocaleTimeString() : 'Never') + '</div>' +
                        '<div style="margin-top:4px;"><strong>Config:</strong> <span style="font-family:monospace; color:#aaa;">' + site.config + '</span></div>' +
                        '</div>' +
                        '<div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:6px; font-family:monospace; font-size:11px; color:#0f0; height:80px; overflow-y:auto;">' +
                        actionsHtml +
                        '</div>';
                    grid.appendChild(card);
                });
            } else {
                grid.innerHTML = '<div class="text-center" style="padding:20px;">No active Sentinel sites found.</div>';
            }
        } catch (e) {
            console.error("Fleet Load Error:", e);
            grid.innerHTML = '<div class="text-center" style="color:red;">Failed to load fleet data: ' + e.message + '</div>';
        }
    };

    console.log('🛰️ [Module] Sentinel v1.0 loaded');
})();
