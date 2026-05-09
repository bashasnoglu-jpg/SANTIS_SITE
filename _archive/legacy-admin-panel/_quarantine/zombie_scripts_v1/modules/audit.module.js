/**
 * SANTIS OS — Audit Module v1.0
 * Site audit, SEO, link checking, deep audit, DOM audit, export.
 * Phase 2 Modularization (2026.02.14)
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

    // --- AUDIT SYSTEM INIT ---
    window.initAuditSystem = function () {
        console.log("🛡️ [Audit] Sentinel V3 Audit System Ready.");
    };

    // --- SITE AUDIT (SSE Stream) ---
    window.runSiteAudit = async function () {
        var logBox = document.getElementById('auditResult');
        if (!logBox) return;

        var dashboard = document.getElementById('auditDashboard');

        logBox.textContent = '⏳ Tarama başlatılıyor...\n';
        if (dashboard) dashboard.style.display = 'none';

        try {
            auditSource = new EventSource('/admin/run-audit');

            auditSource.onmessage = function (e) {
                logBox.textContent += e.data + '\n';
                logBox.scrollTop = logBox.scrollHeight;

                if (e.data.includes('✅ TOTAL_SCANNED_PAGES:')) {
                    var match = e.data.match(/TOTAL_SCANNED_PAGES:\s*(\d+)/);
                    if (match) updateStat('audit-stat-pages', match[1]);
                }
                if (e.data.includes('TOTAL_ASSETS:')) {
                    var match = e.data.match(/TOTAL_ASSETS:\s*(\d+)/);
                    if (match) updateStat('audit-stat-assets', match[1]);
                }
                if (e.data.includes('TOTAL_ERRORS_OR_MISSING:')) {
                    var match = e.data.match(/TOTAL_ERRORS_OR_MISSING:\s*(\d+)/);
                    if (match) updateStat('audit-stat-errors', match[1]);
                }

                if (e.data.includes('[AUDIT END]') || e.data.includes('AUDIT_COMPLETE')) {
                    auditSource.close();
                    logBox.textContent += '\n🏁 Tarama tamamlandı.\n';
                    if (dashboard) dashboard.style.display = 'block';
                    loadAuditReport();
                }
            };

            auditSource.onerror = function () {
                logBox.textContent += '\n❌ Bağlantı hatası. Sunucu kapalı olabilir.\n';
                auditSource.close();
            };
        } catch (e) {
            logBox.textContent += '\n❌ Hata: ' + e.message + '\n';
        }
    };

    window.updateStat = function (id, val) {
        var el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    // --- LINK AUDIT & FIX BRIDGE ---
    window.setAuditStatus = function (text, color) {
        color = color || "#888";
        var el = document.getElementById('auditStatus');
        if (el) {
            el.textContent = text;
            el.style.color = color;
        }
    };

    window.normalizeAuditRow = function (row) {
        return {
            file: row.file || row.File || '',
            url: row.url || row.Link || '',
            status: row.status || row.Status || '',
            ms: row.ms || row.Ms || 0
        };
    };

    window.renderAuditTables = function (rows) {
        rows = rows || [];
        var homePages = ['index', 'index_tr', 'index_en', 'index_de', 'index_ru', 'index_fr'];
        var homeRows = [];
        var detailRows = [];

        rows.forEach(function (r) {
            var norm = normalizeAuditRow(r);
            var isHome = homePages.some(function (hp) { return norm.file.includes(hp); });
            if (isHome) homeRows.push(norm);
            else detailRows.push(norm);
        });

        fillAuditTable('homePagesTable', homeRows);
        fillAuditTable('detailPagesTable', detailRows);
    };

    function fillAuditTable(tableId, rows) {
        var table = document.getElementById(tableId);
        if (!table) return;
        var tbody = table.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        rows.forEach(function (r) {
            var tr = document.createElement('tr');
            var statusColor = '#0f0';
            if (String(r.status).startsWith('4') || String(r.status).startsWith('5')) statusColor = '#f00';
            tr.innerHTML = '<td style="padding:4px 6px;">' + r.file + '</td>' +
                '<td style="padding:4px 6px;">' + r.url + '</td>' +
                '<td style="padding:4px 6px;color:' + statusColor + '">' + r.status + '</td>' +
                '<td style="padding:4px 6px;"><button class="btn-os sm" data-action="audit-fix-link" data-file="' + escapeAttr(r.file) + '" data-url="' + escapeAttr(r.url) + '">Fix</button></td>';
            tbody.appendChild(tr);
        });
    }

    window.loadAuditReport = async function () {
        try {
            var res = await fetch('/admin/last-audit-report');
            if (res.ok) {
                var data = await res.json();
                if (data.results) renderAuditTables(data.results);
            }
        } catch (e) {
            console.warn("Could not load audit report:", e);
        }
    };

    window.applyAuditFilters = function () {
        // Re-render with filters applied
        loadAuditReport();
    };

    window.runLinkAudit = async function (autoFix) {
        autoFix = autoFix || false;
        var output = document.getElementById('linkAuditOutput');
        if (output) output.textContent = '⏳ PowerShell tarama başlatılıyor...';
        setAuditStatus('Taranıyor...', '#ffaa00');

        try {
            var endpoint = autoFix ? '/admin/run-link-audit?fix=true' : '/admin/run-link-audit';
            var res = await fetch(endpoint);
            var data = await res.json();

            if (data.results) {
                AdminState.brokenLinks = data.results;
                renderAuditTables(data.results);
                setAuditStatus(data.results.length + ' link tarandı', '#0f0');
                if (output) output.textContent = JSON.stringify(data.summary || data, null, 2);
            }
        } catch (e) {
            setAuditStatus('Hata: ' + e.message, '#f00');
            if (output) output.textContent = '❌ ' + e.message;
        }
    };

    window.downloadAuditReport = function () {
        window.open('/reports/fixed_links_report.csv');
    };

    window.openHtmlReport = function () {
        window.open('/reports/audit-report.html');
    };

    window.runDomAudit = async function () {
        try {
            setAuditStatus('DOM tarama başlatılıyor...', '#ffaa00');
            var res = await fetch('/admin/run-dom-audit', { method: 'POST' });
            var data = await res.json();
            setAuditStatus('DOM tarama tamamlandı', '#0f0');

            if (data.results) {
                AdminState.brokenLinks = data.results;
                renderAuditTables(data.results);
            }
        } catch (e) {
            setAuditStatus('DOM hata: ' + e.message, '#f00');
        }
    };

    window.runSiteAuditFix = function () {
        runLinkAudit(true);
    };

    // --- SEO ---
    window.loadSeoScore = async function () {
        try {
            var res = await fetch('/api/admin/seo/score');
            if (!res.ok) return;
            var data = await res.json();

            var el = document.getElementById('seoScore');
            if (el && data.score !== undefined) {
                var color = data.score >= 80 ? '#00ff88' : data.score >= 50 ? '#ffaa00' : '#ff4444';
                el.innerHTML = '<span style="font-size:48px; color:' + color + '">' + data.score + '</span>/100';

                if (data.details) {
                    var detailHtml = '<div style="margin-top:15px; display:grid; grid-template-columns:1fr 1fr; gap:8px;">';
                    for (var key in data.details) {
                        detailHtml += '<div style="padding:8px; background:#111; border-radius:6px; font-size:12px;">' +
                            '<span style="color:#888;">' + key + ':</span> ' +
                            '<span style="color:#fff;">' + data.details[key] + '</span></div>';
                    }
                    detailHtml += '</div>';
                    el.innerHTML += detailHtml;
                }
            }
        } catch (e) {
            console.warn("SEO Score load failed:", e);
        }
    };

    window.loadSeoSuggestions = async function () {
        try {
            var res = await fetch('/api/admin/seo/suggestions');
            if (!res.ok) return;
            var data = await res.json();
            var el = document.getElementById('aiSuggestions');
            if (el && data.suggestions) {
                el.innerHTML = data.suggestions.map(function (s) {
                    return '<div style="padding:8px; margin:4px 0; background:#111; border-left:3px solid #d4af37; border-radius:4px; font-size:12px;">' + s + '</div>';
                }).join('');
            }
        } catch (e) {
            console.warn("SEO suggestions load failed:", e);
        }
    };

    window.runSeoAudit = async function () {
        var el = document.getElementById('seoScore');
        if (el) el.innerHTML = '⏳ SEO taranıyor...';

        try {
            var res = await fetch('/api/admin/seo/audit', { method: 'POST' });
            if (res.ok) {
                showToast('✅ SEO Audit tamamlandı', 'success');
                loadSeoScore();
            }
        } catch (e) {
            showToast('❌ SEO Audit hatası', 'error');
        }
    };

    window.runSeoAI = async function () {
        try {
            var res = await fetch('/api/admin/seo/ai-suggestions', { method: 'POST' });
            if (res.ok) {
                showToast('✅ AI önerileri güncellendi', 'success');
                loadSeoSuggestions();
            }
        } catch (e) {
            showToast('❌ AI öneri hatası', 'error');
        }
    };

    window.loadAuditHistory = async function () {
        try {
            var res = await fetch('/admin/audit-history');
            if (!res.ok) return;
            var data = await res.json();

            if (data.history && data.history.length > 0) {
                var canvas = document.getElementById('auditTrendChart');
                if (canvas && window.Chart) {
                    var labels = data.history.map(function (h) { return h.date; });
                    var scores = data.history.map(function (h) { return h.score; });

                    new Chart(canvas, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Health Score',
                                data: scores,
                                borderColor: '#d4af37',
                                backgroundColor: 'rgba(212,175,55,0.1)',
                                fill: true,
                                tension: 0.4
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: { min: 0, max: 100, ticks: { color: '#666' }, grid: { color: '#222' } },
                                x: { ticks: { color: '#666' }, grid: { color: '#222' } }
                            },
                            plugins: { legend: { labels: { color: '#aaa' } } }
                        }
                    });
                }
            }
        } catch (e) {
            console.warn("Audit history load failed:", e);
        }
    };

    window.fixBrokenLink = async function (btn) {
        var file = btn.getAttribute('data-file');
        var url = btn.getAttribute('data-url');

        btn.disabled = true;
        btn.innerText = '⏳';

        try {
            var res = await fetch('/admin/fix-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: file, url: url })
            });
            var data = await res.json();
            if (data.success) {
                btn.innerText = '✅';
                showToast('Link düzeltildi: ' + url, 'success');
            } else {
                btn.innerText = '❌';
                showToast('Düzeltme başarısız', 'error');
            }
        } catch (e) {
            btn.innerText = '❌';
            showToast('Hata: ' + e.message, 'error');
        }
    };

    // --- AUDIT EXPORT ---
    window.exportAuditResults = function () {
        var items = AdminState.brokenLinks || [];
        if (items.length === 0) {
            alert("Dışa aktarılacak veri yok (Önce tarama yapın).");
            return;
        }

        var csvContent = "File,Issue,Level\n";
        items.forEach(function (i) {
            var file = i.file.replace(/"/g, '""');
            var issue = i.issue.replace(/"/g, '""');
            csvContent += '"' + file + '","' + issue + '","' + i.level + '"\n';
        });

        downloadUTF8(csvContent, "audit_clean_report.csv", "text/csv");
    };

    console.log('🛡️ [Module] Audit v1.0 loaded');
})();
