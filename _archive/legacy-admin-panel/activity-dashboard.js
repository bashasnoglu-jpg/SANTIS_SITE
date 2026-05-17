/**
 * 📋 SANTIS Activity Dashboard v1.0
 * Real-time activity feed for admin panel
 */

(function () {
    'use strict';

    // --- State ---
    var isLoaded = false;
    var autoRefreshTimer = null;
    var currentFilter = 'all';

    // --- Main Load Function ---
    window.loadActivityLog = async function () {
        var container = document.getElementById('activity-feed');
        var statsBox = document.getElementById('activity-stats');
        if (!container) return;

        try {
            // Fetch both log and stats in parallel
            var [logResp, statsResp] = await Promise.all([
                fetch('/api/activity-log?limit=50&v=' + Date.now()),
                fetch('/api/activity-log/stats?v=' + Date.now())
            ]);

            var logData = await logResp.json();
            var statsData = await statsResp.json();

            // Render stats
            renderStats(statsData);

            // Render feed
            var entries = logData.entries || [];
            if (entries.length === 0) {
                container.innerHTML = '<div class="text-center" style="padding:40px; color:#666;">' +
                    '<div style="font-size:48px; margin-bottom:15px;">📋</div>' +
                    '<p>Henüz kayıtlı etkinlik yok</p>' +
                    '<p style="font-size:12px; color:#555;">Admin panelinde bir değişiklik yaptığınızda burada görünecek.</p>' +
                    '</div>';
                return;
            }

            // Filter
            var filtered = entries;
            if (currentFilter !== 'all') {
                filtered = entries.filter(function (e) {
                    return e.label && e.label.includes(currentFilter);
                });
            }

            // Group by date
            var grouped = {};
            filtered.forEach(function (entry) {
                var date = entry.timestamp ? entry.timestamp.substring(0, 10) : 'unknown';
                if (!grouped[date]) grouped[date] = [];
                grouped[date].push(entry);
            });

            // Render
            var html = '';
            var today = new Date().toISOString().substring(0, 10);
            var yesterday = new Date(Date.now() - 86400000).toISOString().substring(0, 10);

            Object.keys(grouped).forEach(function (date) {
                var label = date === today ? '📅 Bugün' : date === yesterday ? '📅 Dün' : '📅 ' + date;
                html += '<div class="activity-date-header">' + label + '</div>';

                grouped[date].forEach(function (entry) {
                    var time = entry.timestamp ? entry.timestamp.substring(11, 16) : '--:--';
                    var statusColor = entry.status >= 200 && entry.status < 300 ? '#00ff88' :
                        entry.status >= 400 ? '#ff4444' : '#ffaa00';
                    var statusIcon = entry.status >= 200 && entry.status < 300 ? '✅' :
                        entry.status >= 400 ? '❌' : '⚠️';

                    html += '<div class="activity-entry">' +
                        '<div class="activity-time">' + time + '</div>' +
                        '<div class="activity-icon">' + statusIcon + '</div>' +
                        '<div class="activity-content">' +
                        '<div class="activity-label">' + (entry.label || entry.method) + '</div>' +
                        '<div class="activity-detail">' + (entry.detail || entry.path) + '</div>' +
                        '</div>' +
                        '<div class="activity-meta">' +
                        '<span style="color:' + statusColor + ';">' + entry.status + '</span>' +
                        ' · ' + (entry.duration_ms || 0).toFixed(0) + 'ms' +
                        '</div>' +
                        '</div>';
                });
            });

            container.innerHTML = html;
            isLoaded = true;

            // Start auto-refresh (every 15s)
            if (!autoRefreshTimer) {
                autoRefreshTimer = setInterval(function () {
                    var activeTab = document.querySelector('#tab-activity.active, #tab-activity.os-nav-item.active');
                    if (activeTab) loadActivityLog();
                }, 15000);
            }

        } catch (err) {
            console.error('Activity Log Error:', err);
            container.innerHTML = '<div class="text-center" style="padding:40px; color:#ff4444;">' +
                '<div style="font-size:48px; margin-bottom:15px;">⚠️</div>' +
                '<p>Activity log yüklenemedi</p>' +
                '<p style="font-size:12px; color:#888;">' + err.message + '</p>' +
                '</div>';
        }
    };

    // --- Render Stats ---
    function renderStats(stats) {
        var el = document.getElementById;
        var total = document.getElementById('activity-stat-total');
        var today = document.getElementById('activity-stat-today');
        var last = document.getElementById('activity-stat-last');

        if (total) total.textContent = stats.total || 0;
        if (today) today.textContent = stats.today || 0;
        if (last && stats.last_action) {
            var d = new Date(stats.last_action);
            last.textContent = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        } else if (last) {
            last.textContent = '-';
        }

        // Top labels
        var topLabels = document.getElementById('activity-top-labels');
        if (topLabels && stats.labels) {
            var html = '';
            Object.entries(stats.labels).forEach(function (pair) {
                html += '<span class="activity-badge">' + pair[0] + ' <strong>' + pair[1] + '</strong></span> ';
            });
            topLabels.innerHTML = html || '<span style="color:#666;">-</span>';
        }
    }

    // --- Filter ---
    window.setActivityFilter = function (filter) {
        currentFilter = filter;
        // Update button states
        document.querySelectorAll('.activity-filter-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        loadActivityLog();
    };

})();
