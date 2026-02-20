/**
 * SANTIS OS — Inline Panels v1.0
 * Extracted from index.html inline scripts (Phase 2.5)
 * Contains: Oracle, Health Monitor, Redirects, Activity Log,
 *           i18n hook, Flight Check, Template Governance
 */
(function () {
    'use strict';
    function escapeAttr(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // =========================================================================
    // 1. ORACLE DASHBOARD
    // =========================================================================
    async function loadOracleDashboard() {
        try {
            // 1. Live Status
            var res = await fetch('/api/oracle/status');
            var data = await res.json();

            document.getElementById('oracle-mood').innerText = data.mood;
            document.getElementById('oracle-energy').innerText = data.energy;
            document.getElementById('oracle-mood').style.color = getMoodColor(data.mood);

            if (data.location) {
                document.getElementById('oracle-suggestion').innerHTML =
                    data.suggestion.name + '<br><span style="font-size:10px; color:#666;">(Detected: ' + data.location.city + ', ' + data.location.country + ')</span>';
            } else {
                document.getElementById('oracle-suggestion').innerText = data.suggestion.name;
            }

            // 2. Global Analytics
            var resAn = await fetch('/api/admin/analytics/dashboard');
            var stats = await resAn.json();

            document.getElementById('wt-total').innerText = stats.total_citizens;
            document.getElementById('wt-active').innerText = stats.active_now;

            // Render Region Table
            var tbody = document.getElementById('wt-regions-body');
            tbody.innerHTML = "";
            if (stats.country_distribution) {
                Object.entries(stats.country_distribution).forEach(function (entry) {
                    var country = entry[0], count = entry[1];
                    var tr = document.createElement('tr');
                    tr.innerHTML =
                        '<td style="padding:5px; color:#ccc;">' + country + '</td>' +
                        '<td style="padding:5px; color:#D4AF37;">' + count + '</td>' +
                        '<td style="padding:5px; color:#666;">ONLINE</td>';
                    tbody.appendChild(tr);
                });
            }

            // Render Mood Bars
            var moodContainer = document.getElementById('wt-mood-bars');
            moodContainer.innerHTML = "";
            if (stats.mood_distribution) {
                var totalMoods = Object.values(stats.mood_distribution).reduce(function (a, b) { return a + b; }, 0) || 1;

                Object.entries(stats.mood_distribution).forEach(function (entry) {
                    var mood = entry[0], count = entry[1];
                    var pct = (count / totalMoods) * 100;
                    var color = getMoodColor(mood);
                    var div = document.createElement('div');
                    div.style.marginBottom = "10px";
                    div.innerHTML =
                        '<div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:3px;">' +
                        '<span style="color:' + color + '; text-transform:uppercase;">' + mood + '</span>' +
                        '<span style="color:#666;">' + count + '</span>' +
                        '</div>' +
                        '<div style="height:4px; background:#333; border-radius:2px; overflow:hidden;">' +
                        '<div style="height:100%; width:' + pct + '%; background:' + color + ';"></div>' +
                        '</div>';
                    moodContainer.appendChild(div);
                });
            }

        } catch (e) { console.error("Oracle View Error", e); }
    }

    function getMoodColor(mood) {
        var colors = {
            'dawn': '#ffccaa',
            'zen': '#ffffff',
            'sunset': '#ffaa88',
            'midnight': '#88ccff'
        };
        return colors[mood] || '#fff';
    }

    // Hook into tab click
    document.addEventListener('DOMContentLoaded', function () {
        var tabOracle = document.getElementById('tab-oracle');
        if (tabOracle) tabOracle.addEventListener('click', loadOracleDashboard);
    });

    // =========================================================================
    // 2. SYSTEM HEALTH MONITOR
    // =========================================================================
    var _healthTimer = null;
    var CIRCUMFERENCE = 2 * Math.PI * 42; // ~264

    function setGauge(id, percent) {
        var el = document.getElementById(id);
        if (!el) return;
        var offset = CIRCUMFERENCE - (CIRCUMFERENCE * Math.min(percent, 100) / 100);
        el.setAttribute('stroke-dashoffset', offset);
        var color = percent < 60 ? '#00ff88' : percent < 80 ? '#ffaa00' : '#ff4444';
        el.setAttribute('stroke', color);
    }

    window.loadHealthPanel = async function () {
        try {
            var res = await fetch('/api/system/health?v=' + Date.now());
            var data = await res.json();
            if (data.error) return;

            // CPU Gauge
            var cpuPct = data.cpu?.percent || 0;
            setGauge('gauge-cpu', cpuPct);
            var cpuText = document.getElementById('gauge-cpu-text');
            if (cpuText) cpuText.textContent = Math.round(cpuPct) + '%';
            var cpuDetail = document.getElementById('cpu-detail');
            if (cpuDetail) cpuDetail.textContent = (data.cpu?.cores || '-') + ' core / ' + (data.cpu?.freq_mhz || '-') + ' MHz';

            // RAM Gauge
            var ramPct = data.ram?.percent || 0;
            setGauge('gauge-ram', ramPct);
            var ramText = document.getElementById('gauge-ram-text');
            if (ramText) ramText.textContent = Math.round(ramPct) + '%';
            var ramDetail = document.getElementById('ram-detail');
            if (ramDetail) ramDetail.textContent = (data.ram?.used_gb || '-') + ' / ' + (data.ram?.total_gb || '-') + ' GB';

            // Disk Gauge
            var diskPct = data.disk?.percent || 0;
            setGauge('gauge-disk', diskPct);
            var diskText = document.getElementById('gauge-disk-text');
            if (diskText) diskText.textContent = Math.round(diskPct) + '%';
            var diskDetail = document.getElementById('disk-detail');
            if (diskDetail) diskDetail.textContent = (data.disk?.used_gb || '-') + ' / ' + (data.disk?.total_gb || '-') + ' GB';

            // Server / Process
            var uptime = document.getElementById('server-uptime');
            if (uptime) uptime.textContent = Math.round(data.process?.uptime_minutes || 0);
            var srvDetail = document.getElementById('server-detail');
            if (srvDetail) srvDetail.textContent = 'PID: ' + (data.process?.pid || '-') + ' | RAM: ' + (data.process?.memory_mb || '-') + ' MB | Threads: ' + (data.process?.threads || '-');

            // Network
            var netSent = document.getElementById('net-sent');
            var netRecv = document.getElementById('net-recv');
            if (netSent) netSent.textContent = (data.network?.bytes_sent_mb || 0) + ' MB';
            if (netRecv) netRecv.textContent = (data.network?.bytes_recv_mb || 0) + ' MB';

            // Alarms
            var alarms = [];
            if (cpuPct > 80) alarms.push('\u26a0\ufe0f CPU yüksek: ' + Math.round(cpuPct) + '%');
            if (ramPct > 85) alarms.push('\u26a0\ufe0f RAM yüksek: ' + Math.round(ramPct) + '%');
            if (diskPct > 90) alarms.push('\ud83d\udea8 Disk kritik: ' + Math.round(diskPct) + '%');

            var alarmBox = document.getElementById('health-alarms');
            var statusDot = document.getElementById('health-status-dot');
            var statusText = document.getElementById('health-status-text');
            if (alarms.length > 0) {
                if (alarmBox) alarmBox.innerHTML = alarms.map(function (a) { return '<div style="color:#ff4444; font-size:13px; margin-bottom:4px;">' + a + '</div>'; }).join('');
                if (statusDot) statusDot.style.background = '#ff4444';
                if (statusText) { statusText.textContent = 'Alarm'; statusText.style.color = '#ff4444'; }
            } else {
                if (alarmBox) alarmBox.innerHTML = '<div style="color:#00ff88; font-size:13px;">\u2705 Tüm metrikler normal sınırlarda</div>';
                if (statusDot) statusDot.style.background = '#00ff88';
                if (statusText) { statusText.textContent = 'Canlı'; statusText.style.color = '#00ff88'; }
            }

            // Last update
            var lastEl = document.getElementById('health-last-update');
            if (lastEl) lastEl.textContent = new Date().toLocaleTimeString('tr-TR');

            // Auto-refresh (10s)
            if (!_healthTimer) {
                _healthTimer = setInterval(function () {
                    var tab = document.getElementById('tab-health');
                    if (tab && tab.classList.contains('active')) loadHealthPanel();
                }, 10000);
            }

        } catch (err) {
            console.error('Health load error:', err);
        }
    };

    // =========================================================================
    // 3. REDIRECT MANAGER (Multi-Lang v2.0)
    // =========================================================================
    var _redirectsCache = [];
    var _redirLangFilter = 'all';
    var LANGS = ['tr', 'en', 'de', 'ru', 'ar'];
    var LANG_FLAGS = { tr: '\ud83c\uddf9\ud83c\uddf7', en: '\ud83c\uddec\ud83c\udde7', de: '\ud83c\udde9\ud83c\uddea', ru: '\ud83c\uddf7\ud83c\uddfa', ar: '\ud83c\uddf8\ud83c\udde6' };
    var LANG_COLORS = { tr: '#e53935', en: '#1976d2', de: '#ffd166', ru: '#7986cb', ar: '#66bb6a' };

    function detectLang(url) {
        if (!url) return null;
        var m = url.match(/^\/([a-z]{2})\//);
        return (m && LANGS.indexOf(m[1]) !== -1) ? m[1] : null;
    }

    window.setRedirectLangFilter = function (lang) {
        _redirLangFilter = lang;
        document.querySelectorAll('[data-rfilter]').forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-rfilter') === lang);
        });
        renderRedirectTable();
    };

    function renderRedirectTable() {
        var tbody = document.getElementById('redirect-tbody');
        var empty = document.getElementById('redirect-empty');
        if (!tbody) return;

        var items = _redirectsCache;
        if (_redirLangFilter !== 'all') {
            items = items.filter(function (r) {
                var lang = detectLang(r.from);
                if (_redirLangFilter === 'other') return !lang;
                return lang === _redirLangFilter;
            });
        }

        if (items.length === 0) {
            tbody.innerHTML = '';
            if (empty) empty.style.display = 'block';
            return;
        }
        if (empty) empty.style.display = 'none';

        var html = '';
        items.forEach(function (r) {
            var lang = detectLang(r.from);
            var flag = lang ? (LANG_FLAGS[lang] || '') : '\u26aa';
            var langColor = lang ? (LANG_COLORS[lang] || '#888') : '#555';
            var langLabel = lang ? lang.toUpperCase() : '-';
            var typeColor = (r.type || 301) == 301 ? '#00ff88' : '#ffaa00';

            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">' +
                '<td style="padding:8px 10px; text-align:center;"><span style="display:inline-block; padding:1px 6px; border-radius:4px; background:rgba(255,255,255,0.04); border:1px solid ' + langColor + '; font-size:10px; color:' + langColor + ';">' + flag + ' ' + langLabel + '</span></td>' +
                '<td style="padding:8px 10px; color:#ddd; font-family:monospace; font-size:12px;">' + (r.from || '') + '</td>' +
                '<td style="padding:8px 10px; color:#9ad; font-family:monospace; font-size:12px;">' + (r.to || '') + '</td>' +
                '<td style="padding:8px 10px; text-align:center;"><span style="display:inline-block; padding:1px 8px; border-radius:999px; background:rgba(255,255,255,0.05); color:' + typeColor + '; font-size:11px; font-weight:600;">' + (r.type || 301) + '</span></td>' +
                '<td style="padding:8px 10px; text-align:center;"><button class="btn-os" style="padding:3px 8px; font-size:10px; border-color:#ff4444; color:#ff4444;" data-action="redirect-delete-entry" data-from="' + escapeAttr(r.from || '') + '" data-to="' + escapeAttr(r.to || '') + '">✖</button></td>' +
                '</tr>';
        });
        tbody.innerHTML = html;
    }

    window.loadRedirectsPanel = async function () {
        try {
            var res = await fetch('/admin/redirects?v=' + Date.now());
            var data = await res.json();
            _redirectsCache = data.redirects || [];

            var total = _redirectsCache.length;
            var c301 = _redirectsCache.filter(function (r) { return (r.type || 301) == 301; }).length;
            var c302 = total - c301;

            // Per-language count
            var langCounts = {};
            var otherCount = 0;
            _redirectsCache.forEach(function (r) {
                var lang = detectLang(r.from);
                if (lang) { langCounts[lang] = (langCounts[lang] || 0) + 1; }
                else { otherCount++; }
            });

            // Update stats
            var el = function (id) { return document.getElementById(id); };
            if (el('redirect-stat-total')) el('redirect-stat-total').textContent = total;
            if (el('redirect-stat-301')) el('redirect-stat-301').textContent = c301;
            if (el('redirect-stat-302')) el('redirect-stat-302').textContent = c302;
            if (el('redirect-stat-other')) el('redirect-stat-other').textContent = otherCount;

            // Language distribution
            var distEl = el('redirect-lang-dist');
            if (distEl) {
                if (total === 0) {
                    distEl.innerHTML = '<span style="color:#555;">-</span>';
                } else {
                    var distHtml = '';
                    LANGS.forEach(function (lang) {
                        var cnt = langCounts[lang] || 0;
                        distHtml += '<span style="color:' + LANG_COLORS[lang] + ';">' + LANG_FLAGS[lang] + ' ' + cnt + '</span> ';
                    });
                    distEl.innerHTML = distHtml;
                }
            }

            renderRedirectTable();
        } catch (err) {
            console.error('Redirect load error:', err);
        }
    };

    window.addRedirectEntry = async function () {
        var fromEl = document.getElementById('redir-from');
        var toEl = document.getElementById('redir-to');
        var typeEl = document.getElementById('redir-type');
        var multiEl = document.getElementById('redir-multi-lang');
        var warn = document.getElementById('redir-loop-warning');
        var preview = document.getElementById('redir-multi-preview');

        var fromVal = (fromEl ? fromEl.value : '').trim();
        var toVal = (toEl ? toEl.value : '').trim();
        var typeVal = parseInt(typeEl ? typeEl.value : '301');
        var isMulti = multiEl ? multiEl.checked : false;

        if (!fromVal || !toVal) { alert('Her iki URL de gerekli!'); return; }
        if (fromVal === toVal) { alert('Eski ve yeni URL aynı olamaz!'); return; }

        // Build redirect pairs
        var pairs = [{ from: fromVal, to: toVal }];

        if (isMulti) {
            var srcLang = detectLang(fromVal);
            var dstLang = detectLang(toVal);
            if (srcLang && dstLang && srcLang === dstLang) {
                LANGS.forEach(function (lang) {
                    if (lang !== srcLang) {
                        pairs.push({
                            from: fromVal.replace('/' + srcLang + '/', '/' + lang + '/'),
                            to: toVal.replace('/' + dstLang + '/', '/' + lang + '/')
                        });
                    }
                });
            } else {
                alert("5 dile uygulama için her iki URL de aynı dil prefix'ine sahip olmalı (örn: /tr/...)");
                return;
            }
        }

        // Loop detection for all pairs
        for (var p = 0; p < pairs.length; p++) {
            var loopPath = detectLoop(pairs[p].from, pairs[p].to);
            if (loopPath) {
                if (warn) {
                    warn.style.display = 'block';
                    warn.textContent = '\u26a0\ufe0f Döngü tespit edildi: ' + loopPath;
                }
                return;
            }
        }
        if (warn) warn.style.display = 'none';
        if (preview) preview.style.display = 'none';

        try {
            for (var i = 0; i < pairs.length; i++) {
                await fetch('/admin/redirects/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ from: pairs[i].from, to: pairs[i].to, type: typeVal })
                });
            }
            if (fromEl) fromEl.value = '';
            if (toEl) toEl.value = '';
            loadRedirectsPanel();
        } catch (err) {
            alert('Ekleme hatası: ' + err.message);
        }
    };

    window.deleteRedirectEntry = async function (from, to) {
        if (!confirm('Bu yönlendirmeyi silmek istiyor musunuz?')) return;
        try {
            await fetch('/admin/redirects/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: from, to: to })
            });
            loadRedirectsPanel();
        } catch (err) {
            alert('Silme hatası: ' + err.message);
        }
    };

    function detectLoop(newFrom, newTo) {
        var graph = {};
        _redirectsCache.forEach(function (r) { graph[r.from] = r.to; });
        graph[newFrom] = newTo;
        var current = newTo;
        var path = [newFrom, newTo];
        for (var i = 0; i < 20; i++) {
            if (!graph[current]) return null;
            current = graph[current];
            path.push(current);
            if (current === newFrom) return path.join(' → ');
        }
        return null;
    }

    // =========================================================================
    // 4. ACTIVITY DASHBOARD v1.1
    // =========================================================================
    var _activityLoaded = false;
    var _activityAutoRefresh = null;
    var _activityFilter = 'all';

    window.loadActivityLog = async function () {
        var container = document.getElementById('activity-feed');
        if (!container) return;

        try {
            var logResp = await fetch('/api/activity-log?limit=50&v=' + Date.now());
            var statsResp = await fetch('/api/activity-log/stats?v=' + Date.now());
            var logData = await logResp.json();
            var statsData = await statsResp.json();

            // Render stats
            var total = document.getElementById('activity-stat-total');
            var today = document.getElementById('activity-stat-today');
            var last = document.getElementById('activity-stat-last');
            if (total) total.textContent = statsData.total || 0;
            if (today) today.textContent = statsData.today || 0;
            if (last && statsData.last_action) {
                var d = new Date(statsData.last_action);
                last.textContent = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            } else if (last) {
                last.textContent = '-';
            }

            // Top labels
            var topLabels = document.getElementById('activity-top-labels');
            if (topLabels && statsData.labels) {
                var lhtml = '';
                Object.keys(statsData.labels).forEach(function (key) {
                    lhtml += '<span class="activity-badge">' + key + ' <strong>' + statsData.labels[key] + '</strong></span> ';
                });
                topLabels.innerHTML = lhtml || '<span style="color:#666;">-</span>';
            }

            // Render feed
            var entries = logData.entries || [];
            if (entries.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:40px; color:#666;">' +
                    '<div style="font-size:48px; margin-bottom:15px;">📋</div>' +
                    '<p>Henüz kayıtlı etkinlik yok</p>' +
                    '<p style="font-size:12px; color:#555;">Admin panelinde bir değişiklik yaptığınızda burada görünecek.</p>' +
                    '</div>';
                return;
            }

            // Filter
            var filtered = entries;
            if (_activityFilter !== 'all') {
                filtered = entries.filter(function (e) {
                    return e.label && e.label.indexOf(_activityFilter) !== -1;
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
            var todayStr = new Date().toISOString().substring(0, 10);
            var yesterdayStr = new Date(Date.now() - 86400000).toISOString().substring(0, 10);

            Object.keys(grouped).forEach(function (date) {
                var label = date === todayStr ? '📅 Bugün' : date === yesterdayStr ? '📅 Dün' : '📅 ' + date;
                html += '<div class="activity-date-header">' + label + '</div>';

                grouped[date].forEach(function (entry) {
                    var time = entry.timestamp ? entry.timestamp.substring(11, 16) : '--:--';
                    var statusColor = entry.status >= 200 && entry.status < 300 ? '#00ff88' :
                        entry.status >= 400 ? '#ff4444' : '#ffaa00';
                    var statusIcon = entry.status >= 200 && entry.status < 300 ? '✅' :
                        entry.status >= 400 ? '❌' : '⚠️';
                    var dur = (entry.duration_ms != null) ? entry.duration_ms.toFixed(0) : '0';

                    html += '<div class="activity-entry">' +
                        '<div class="activity-time">' + time + '</div>' +
                        '<div class="activity-icon">' + statusIcon + '</div>' +
                        '<div class="activity-content">' +
                        '<div class="activity-label">' + (entry.label || entry.method) + '</div>' +
                        '<div class="activity-detail">' + (entry.detail || entry.path) + '</div>' +
                        '</div>' +
                        '<div class="activity-meta">' +
                        '<span style="color:' + statusColor + ';">' + entry.status + '</span>' +
                        ' \u00b7 ' + dur + 'ms' +
                        '</div>' +
                        '</div>';
                });
            });

            container.innerHTML = html;
            _activityLoaded = true;

            // Auto-refresh (15s)
            if (!_activityAutoRefresh) {
                _activityAutoRefresh = setInterval(function () {
                    var tab = document.getElementById('tab-activity');
                    if (tab && tab.classList.contains('active')) loadActivityLog();
                }, 15000);
            }

        } catch (err) {
            console.error('Activity Log Error:', err);
            container.innerHTML = '<div style="text-align:center; padding:40px; color:#ff4444;">' +
                '<div style="font-size:48px; margin-bottom:15px;">⚠️</div>' +
                '<p>Activity log yüklenemedi</p>' +
                '<p style="font-size:12px; color:#888;">' + err.message + '</p>' +
                '</div>';
        }
    };

    // setActivityFilter removed — authoritative copy in activity-dashboard.js

    // =========================================================================
    // 5. i18n DASHBOARD HOOK
    // =========================================================================
    document.addEventListener('DOMContentLoaded', function () {
        document.addEventListener('click', function (e) {
            var delBtn = e.target.closest('[data-action="redirect-delete-entry"]');
            if (delBtn && typeof deleteRedirectEntry === 'function') {
                deleteRedirectEntry(delBtn.getAttribute('data-from') || '', delBtn.getAttribute('data-to') || '');
            }
        });

        var tabI18n = document.getElementById('tab-i18n');
        if (tabI18n) {
            tabI18n.addEventListener('click', function () {
                var stat = document.getElementById('i18n-stat-total');
                if (!stat || !stat.textContent || stat.textContent === '-') {
                    if (typeof loadI18nDashboard === 'function') loadI18nDashboard();
                }
            });
        }
    });

    // =========================================================================
    // 6. FLIGHT CHECK ENGINE v1.0
    // =========================================================================
    window._fcData = null;
    window._fcLoading = false;

    window.loadFlightCheck = async function () {
        if (window._fcLoading) return;
        window._fcLoading = true;
        var btn = document.getElementById('fc-scan-btn');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Taranıyor...'; }

        try {
            var resp = await fetch('/api/flight-check?v=' + Date.now());
            var data = await resp.json();
            window._fcData = data;

            // Verdict + Score
            var verdictEl = document.getElementById('fc-verdict');
            var scoreEl = document.getElementById('fc-score');
            if (verdictEl) {
                verdictEl.textContent = data.verdict || '?';
                verdictEl.style.color = data.verdict === 'GO' ? '#00ff88' : '#ff4444';
            }
            if (scoreEl) scoreEl.textContent = data.score != null ? data.score : '?';

            // Gauge arc
            var arc = document.getElementById('fc-gauge-arc');
            if (arc) {
                var pct = Math.min(100, Math.max(0, data.score || 0));
                var circ = 2 * Math.PI * 52;
                arc.setAttribute('stroke-dasharray', (pct / 100 * circ) + ' ' + circ);
                arc.setAttribute('stroke', data.verdict === 'GO' ? '#00ff88' : (pct >= 50 ? '#ffaa00' : '#ff4444'));
            }

            // Summary counters
            var s = data.summary || {};
            var el = function (id) { return document.getElementById(id); };
            if (el('fc-critical')) el('fc-critical').textContent = s.critical || 0;
            if (el('fc-warning')) el('fc-warning').textContent = s.warning || 0;
            if (el('fc-info')) el('fc-info').textContent = s.info || 0;

            // Module badges
            var modules = data.modules || {};
            var badgeColors = {
                'PASS': { bg: 'rgba(0,255,136,0.15)', color: '#00ff88' },
                'WARN': { bg: 'rgba(255,170,0,0.15)', color: '#ffaa00' },
                'FAIL': { bg: 'rgba(255,68,68,0.15)', color: '#ff4444' }
            };
            ['redirects', 'hreflang', 'canonical', 'template', 'links'].forEach(function (mod) {
                var m = modules[mod] || {};
                var badge = document.getElementById('fc-badge-' + mod);
                var count = document.getElementById('fc-count-' + mod);
                var bc = badgeColors[m.status] || badgeColors['WARN'];
                if (badge) {
                    badge.textContent = m.status || '?';
                    badge.style.background = bc.bg;
                    badge.style.color = bc.color;
                }
                if (count) count.textContent = (m.count || 0) + ' issues';
            });

            // Timestamp
            var ts = document.getElementById('fc-timestamp');
            if (ts) ts.textContent = 'Son tarama: ' + new Date().toLocaleString('tr-TR');

        } catch (e) {
            console.error('[FlightCheck] Error:', e);
            var scoreEl2 = document.getElementById('fc-score');
            if (scoreEl2) scoreEl2.textContent = '!';
        } finally {
            window._fcLoading = false;
            if (btn) { btn.disabled = false; btn.textContent = '🚀 Tara'; }
        }
    };

    window.toggleFcModule = function (mod) {
        var container = document.getElementById('fc-issues');
        if (!container || !window._fcData) return;
        var modules = window._fcData.modules || {};
        var m = modules[mod];
        if (!m || !m.issues || m.issues.length === 0) {
            container.style.display = 'block';
            container.innerHTML = '<div style="color:#888; padding:10px;">✅ ' + mod.toUpperCase() + ': Sorun bulunamadı</div>';
            return;
        }

        // Toggle: if same module is shown, hide
        if (container.dataset.activeMod === mod && container.style.display === 'block') {
            container.style.display = 'none';
            container.dataset.activeMod = '';
            return;
        }

        container.dataset.activeMod = mod;
        container.style.display = 'block';

        var html = '<div style="background:#111; border:1px solid #333; border-radius:12px; padding:16px;">';
        html += '<h4 style="color:#eee; margin:0 0 12px 0;">' + mod.toUpperCase() + ' Issues (' + m.issues.length + ')</h4>';
        m.issues.forEach(function (issue, idx) {
            if (idx >= 20) return;
            var icon = issue.severity === 'critical' ? '🔴' : (issue.severity === 'warning' ? '🟡' : 'ℹ️');
            var color = issue.severity === 'critical' ? '#ff4444' : (issue.severity === 'warning' ? '#ffaa00' : '#00d9ff');
            html += '<div style="padding:6px 0; border-bottom:1px solid #222; font-size:12px;">';
            html += '<span>' + icon + '</span> <span style="color:' + color + ';">[' + issue.severity.toUpperCase() + ']</span> ';
            html += '<span style="color:#ccc;">' + (issue.msg || '') + '</span></div>';
        });
        if (m.issues.length > 20) {
            html += '<div style="color:#888; padding:8px 0; font-size:11px;">... +' + (m.issues.length - 20) + ' daha</div>';
        }
        html += '</div>';
        container.innerHTML = html;
    };

    // =========================================================================
    // 7. TEMPLATE GOVERNANCE v1.1
    // =========================================================================
    window._tgovLoading = false;

    window.loadTemplateGovernance = async function (refresh) {
        if (window._tgovLoading) return;
        window._tgovLoading = true;
        try {
            var url = '/api/template-governance' + (refresh ? '?refresh=true&v=' + Date.now() : '?v=' + Date.now());
            var resp = await fetch(url);
            var data = await resp.json();

            // Stats
            var s = data.stats || {};
            var el = function (id) { return document.getElementById(id); };
            if (el('tgov-score')) el('tgov-score').textContent = s.compliance_score || 0;
            if (el('tgov-stat-pages')) el('tgov-stat-pages').textContent = s.total_pages || 0;
            if (el('tgov-stat-violations')) el('tgov-stat-violations').textContent = s.total_violations || 0;
            if (el('tgov-stat-inline')) el('tgov-stat-inline').textContent = s.inline_styles || 0;
            if (el('tgov-stat-dom')) el('tgov-stat-dom').textContent = s.dom_mismatches || 0;

            // Gauge arc
            var arc = el('tgov-gauge-arc');
            if (arc) {
                var pct = Math.min(100, Math.max(0, s.compliance_score || 0));
                var circumference = 2 * Math.PI * 52;
                var dashLen = (pct / 100) * circumference;
                arc.setAttribute('stroke-dasharray', dashLen + ' ' + circumference);
                if (pct >= 80) arc.setAttribute('stroke', '#00ff88');
                else if (pct >= 50) arc.setAttribute('stroke', '#ffaa00');
                else arc.setAttribute('stroke', '#ff4444');
            }

            // Language Matrix
            var matrix = el('tgov-lang-matrix');
            if (matrix && data.lang_matrix) {
                var html = '';
                var langs = ['tr', 'en', 'de', 'fr', 'ru', 'ar'];
                langs.forEach(function (lang) {
                    var lm = data.lang_matrix[lang] || { total: 0, has_pair: 0, dom_ok: 0 };
                    var color = lm.total > 0 ? '#e040fb' : '#333';
                    var pairPct = lm.total > 0 ? Math.round((lm.has_pair / lm.total) * 100) : 0;
                    html += '<div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px; text-align:center;">';
                    html += '<div style="font-size:18px; font-weight:700; color:' + color + ';">' + lang.toUpperCase() + '</div>';
                    html += '<div style="font-size:24px; font-weight:700; color:#fff; margin:8px 0;">' + lm.total + '</div>';
                    html += '<div style="font-size:10px; color:#888;">sayfa</div>';
                    if (lm.total > 0) {
                        html += '<div style="margin-top:8px; height:4px; background:rgba(255,255,255,0.06); border-radius:2px;">';
                        html += '<div style="height:100%; width:' + pairPct + '%; background:' + (pairPct >= 80 ? '#00ff88' : pairPct >= 50 ? '#ffaa00' : '#ff4444') + '; border-radius:2px; transition:width 0.5s;"></div>';
                        html += '</div>';
                        html += '<div style="font-size:9px; color:#666; margin-top:4px;">' + lm.has_pair + ' eşleşme</div>';
                    }
                    html += '</div>';
                });
                matrix.innerHTML = html;
            }

            // Violations Table
            var tbody = el('tgov-violations-body');
            if (tbody && data.violations) {
                if (data.violations.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="color:#00ff88; text-align:center;">✅ İhlal bulunamadı</td></tr>';
                } else {
                    var rows = '';
                    data.violations.slice(0, 30).forEach(function (v) {
                        var typeColor = v.type === 'inline_style' ? '#ffaa00' : '#00d9ff';
                        var typeIcon = v.type === 'inline_style' ? '🎨' : '🔀';
                        var typeLabel = v.type === 'inline_style' ? 'Inline Style' : 'DOM Fark';
                        rows += '<tr>';
                        rows += '<td><span style="color:' + typeColor + ';">' + typeIcon + ' ' + typeLabel + '</span></td>';
                        rows += '<td style="font-size:12px; font-family:monospace; color:#aaa;">' + (v.path || '-') + '</td>';
                        rows += '<td style="color:#888;">' + (v.line || '-') + '</td>';
                        rows += '<td style="font-size:11px; color:#666; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + (v.detail || '-') + '</td>';
                        rows += '</tr>';
                    });
                    if (data.violations.length > 30) {
                        rows += '<tr><td colspan="4" style="color:#888; text-align:center;">... ve ' + (data.violations.length - 30) + ' daha fazla</td></tr>';
                    }
                    tbody.innerHTML = rows;
                }
            }
        } catch (e) {
            console.error('[TGov] Error:', e);
            var scoreEl = document.getElementById('tgov-score');
            if (scoreEl) scoreEl.textContent = '!';
        } finally {
            window._tgovLoading = false;
        }
    };

    // --- AUTO-FIX: Inline Styles ---
    window.tgovFixAllInline = async function () {
        var confirmed = confirm(
            '⚠️ DİKKAT: Tüm HTML dosyalarındaki kozmetik inline style\'lar CSS class\'larına taşınacak.\n\n' +
            'Layout-critical style\'lar (display, flex, padding, margin, gap vb.) korunur.\n' +
            'Her dosyanın yedeği _backup/tgov/ klasörüne alınır.\n\n' +
            'Devam etmek istiyor musunuz?'
        );
        if (!confirmed) return;

        var btn = document.getElementById('tgov-fix-btn');
        var status = document.getElementById('tgov-fix-status');
        var progress = document.getElementById('tgov-fix-progress');
        var bar = document.getElementById('tgov-fix-bar');
        var log = document.getElementById('tgov-fix-log');

        if (btn) btn.disabled = true;
        if (status) status.textContent = 'Tarama ve düzeltme başlatılıyor... (Yedekler alınıyor)';
        if (progress) progress.style.display = 'block';
        if (bar) bar.style.width = '10%';
        if (log) log.innerHTML = '';

        try {
            var resp = await fetch('/api/template-governance/fix-inline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: '__ALL__' })
            });
            var data = await resp.json();
            if (bar) bar.style.width = '100%';

            if (data.success) {
                if (status) status.innerHTML = '<span style="color:#00ff88;">✅ ' + data.total_fixed + ' inline style düzeltildi (' + data.files_fixed + ' dosya)</span>';
                if (log && data.details) {
                    var logHtml = '';
                    data.details.forEach(function (d) {
                        logHtml += '<div style="color:#aaa;">📄 ' + d.path + ' → <span style="color:#00ff88;">' + d.fixed + ' fix</span></div>';
                    });
                    log.innerHTML = logHtml;
                }
                // Refresh dashboard after fix
                setTimeout(function () { loadTemplateGovernance(true); }, 1500);
            } else {
                if (status) status.innerHTML = '<span style="color:#ff4444;">❌ Hata: ' + (data.error || 'Bilinmeyen') + '</span>';
            }
        } catch (e) {
            if (status) status.innerHTML = '<span style="color:#ff4444;">❌ ' + e.message + '</span>';
        }
        if (btn) btn.disabled = false;
    };

    console.log('📋 [Panels] Inline Panels v1.0 loaded (Oracle, Health, Redirects, Activity, Flight, TGov)');
})();
