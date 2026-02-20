/* 
 * SANTIS ADMIN DASHBOARD LOGIC (v5.5)
 * Consolidated from inline scripts for Strict CSP Compliance.
 * Includes: Tone Health, Oracle, Deep Audit, Security, Auto-Fix.
 */

function escapeAttr(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// --- GOD MODE SIMULATORS (Phase 6) ---
let liveTrafficInterval = null;
function initGodModeSimulators() {
    // 1. Live Traffic Number
    const trafficEl = document.getElementById('stat-live-traffic');
    if (trafficEl) {
        let currentTraffic = Math.floor(Math.random() * 5) + 2; // Baseline 2-6 users

        if (liveTrafficInterval) clearInterval(liveTrafficInterval);
        liveTrafficInterval = setInterval(() => {
            // Randomly fluctuate online users (-1 to +2)
            const change = Math.floor(Math.random() * 4) - 1;
            currentTraffic = Math.max(1, currentTraffic + change); // Keep at least 1

            // Keep the pulse dot HTML and just change the text
            const dotHtml = `<span class="live-dot" style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#00aaff; margin-right:10px; animation: pulse 1.5s infinite;"></span>`;
            trafficEl.innerHTML = `${dotHtml}${currentTraffic}`;
        }, 3500); // Update every 3.5 seconds
    }

    // 2. Live Audit Logs Injection
    const logContainer = document.getElementById('live-audit-log');
    if (logContainer) {
        const dummyLogs = [
            { source: 'Santis Security', msg: 'Admin Panel Access Authorized (Istanbul).', color: '#00ff88', type: '[OK]' },
            { source: 'DataBridge', msg: 'catalog.json served from Edge Cache (12ms).', color: '#00ff88', type: '[OK]' },
            { source: 'PixelEngine', msg: 'Ads tracking blocked (User Consent: False).', color: '#ffcc00', type: '[WARN]' },
            { source: 'City OS', msg: 'Weather sensor updated (Antalya, 24°C).', color: '#00aaff', type: '[INFO]' },
            { source: 'OmniLang', msg: 'Auto-switched to /en/ (Client pref: English).', color: '#00aaff', type: '[INFO]' }
        ];

        setInterval(() => {
            // Only add a log 30% of the time to keep it realistic
            if (Math.random() > 0.3) return;

            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            const logEntry = dummyLogs[Math.floor(Math.random() * dummyLogs.length)];

            const newLog = document.createElement('div');
            newLog.style.cssText = 'display:flex; gap:15px; animation: fadeDown 0.5s ease;';
            newLog.innerHTML = `
                <span style="color:#666;">[${timeStr}]</span>
                <span style="color:${logEntry.color};">${logEntry.type}</span>
                <span>${logEntry.source}: ${logEntry.msg}</span>
            `;

            logContainer.prepend(newLog); // Add to top

            // Keep max 7 logs
            if (logContainer.children.length > 7) {
                logContainer.lastElementChild.remove();
            }
        }, 2000); // Check every 2 seconds

        // Add animation class if not exists
        if (!document.getElementById('sim-styles')) {
            const style = document.createElement('style');
            style.id = 'sim-styles';
            style.innerHTML = `@keyframes fadeDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`;
            document.head.appendChild(style);
        }
    }
}

// --- TONE HEALTH HUD (Phase 38.7) ---
async function updateToneHealth() {
    try {
        const res = await fetch('http://127.0.0.1:8000/api/admin/tone-health');
        const data = await res.json();

        if (data.status === "NO_DATA") return;

        // Update Score
        const scoreEl = document.getElementById('tone-score');
        if (scoreEl) scoreEl.innerText = data.score;

        // Update Circle
        const circle = document.getElementById('tone-progress');
        if (circle) {
            const offset = 226 - (226 * data.score / 100);
            circle.style.strokeDashoffset = offset;

            // Color Logic
            let color = "#ff4444";
            let label = "CRITICAL";
            if (data.score >= 75) { color = "#d4af37"; label = "LUXURY STRONG"; }
            else if (data.score >= 60) { color = "#00ff88"; label = "ACCEPTABLE"; }
            else if (data.score >= 40) { color = "#ffcc00"; label = "DRIFT DETECTED"; }

            circle.style.stroke = color;
            if (scoreEl) scoreEl.style.color = color;

            // Update Badge
            const badge = document.getElementById('tone-badge');
            if (badge) {
                badge.innerText = label;
                badge.style.background = color + "22"; // 20% opacity
                badge.style.color = color;
            }
        }

        // Update Lists
        const keywordsEl = document.getElementById('tone-keywords');
        if (keywordsEl) keywordsEl.innerText = data.top_keywords.join(", ") || "None";

        const violationsEl = document.getElementById('tone-violations');
        if (violationsEl) violationsEl.innerText = data.top_violations.join(", ") || "None";

    } catch (e) { console.error("Tone Health Error", e); }
}

// Poll every 10s (Auto-Start if tab active)
setInterval(() => {
    const viewIntel = document.getElementById('view-intelligence');
    if (viewIntel && viewIntel.classList.contains('active')) {
        updateToneHealth();
    }
}, 10000);

// --- ORACLE DASHBOARD (Phase 24) ---
async function loadOracleDashboard() {
    try {
        // 1. Live Status
        const res = await fetch('http://127.0.0.1:8000/api/oracle/status');
        const data = await res.json();

        const moodEl = document.getElementById('oracle-mood');
        const energyEl = document.getElementById('oracle-energy');
        const suggestionEl = document.getElementById('oracle-suggestion');

        if (moodEl) {
            moodEl.innerText = data.mood;
            moodEl.style.color = getMoodColor(data.mood);
        }
        if (energyEl) energyEl.innerText = data.energy;

        if (suggestionEl) {
            if (data.location) {
                // Show where the current session is seemingly from
                suggestionEl.innerHTML =
                    `${data.suggestion.name} <br><span style="font-size:10px; color:#666;">(Detected: ${data.location.city}, ${data.location.country})</span>`;
            } else {
                suggestionEl.innerText = data.suggestion.name;
            }
        }

        // 2. Global Analytics
        // Note: Check if endpoint exists, otherwise fallback or skip
        try {
            const resAn = await fetch('/api/admin/analytics/dashboard');
            if (resAn.ok) {
                const stats = await resAn.json();

                const wtTotal = document.getElementById('wt-total');
                const wtActive = document.getElementById('wt-active');
                if (wtTotal) wtTotal.innerText = stats.total_citizens;
                if (wtActive) wtActive.innerText = stats.active_now;

                // Render Region Table
                const tbody = document.getElementById('wt-regions-body');
                if (tbody && stats.country_distribution) {
                    tbody.innerHTML = "";
                    Object.entries(stats.country_distribution).forEach(([country, count]) => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td style="padding:5px; color:#ccc;">${country}</td>
                            <td style="padding:5px; color:#D4AF37;">${count}</td>
                            <td style="padding:5px; color:#666;">ONLINE</td>
                        `;
                        tbody.appendChild(tr);
                    });
                }

                // Render Mood Bars
                const moodContainer = document.getElementById('wt-mood-bars');
                if (moodContainer && stats.mood_distribution) {
                    moodContainer.innerHTML = "";
                    const totalMoods = Object.values(stats.mood_distribution).reduce((a, b) => a + b, 0) || 1;

                    Object.entries(stats.mood_distribution).forEach(([mood, count]) => {
                        const pct = (count / totalMoods) * 100;
                        const color = getMoodColor(mood);
                        const div = document.createElement('div');
                        div.style.marginBottom = "10px";
                        div.innerHTML = `
                            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:3px;">
                                <span style="color:${color}; text-transform:uppercase;">${mood}</span>
                                <span style="color:#666;">${count}</span>
                            </div>
                            <div style="height:4px; background:#333; border-radius:2px; overflow:hidden;">
                                <div style="height:100%; width:${pct}%; background:${color};"></div>
                            </div>
                        `;
                        moodContainer.appendChild(div);
                    });
                }
            }
        } catch (err) {
            console.warn("Analytics Endpoint unavailable/error", err);
        }

    } catch (e) { console.error("Oracle View Error", e); }
}

function getMoodColor(mood) {
    const colors = {
        'dawn': '#ffccaa',
        'zen': '#ffffff',
        'sunset': '#ffaa88',
        'midnight': '#88ccff'
    };
    return colors[mood] || '#fff';
}


// --- DEEP AUDIT V2 (Recursive Engine) ---
var auditInterval = window.auditInterval || null;

async function runDeepAudit() {
    const log = document.getElementById("auditResult");
    if (!log) return;
    log.innerHTML = "🕷️ <b>Deep Audit V2 Motoru Başlatılıyor...</b><br>Hazırlanıyor...";

    // 1. START
    try {
        const startRes = await fetch("http://127.0.0.1:8000/admin/deep-audit/start");
        const startData = await startRes.json();

        if (startData.error) {
            log.innerHTML += `<br><span style='color:red'>HATA: ${startData.error}</span>`;
            return;
        }

        log.innerHTML = "🕷️ <b>Motor Çalışıyor...</b><br>Canlı veriler alınıyor...<br><br>";

        // Clear previous interval if any
        if (auditInterval) clearInterval(auditInterval);

        // 2. POLL STATUS
        auditInterval = setInterval(async () => {
            try {
                const statusRes = await fetch("http://127.0.0.1:8000/admin/deep-audit/status");
                const statusData = await statusRes.json();

                // Update Live Counters
                log.innerHTML = `
                <div style="padding:15px; background:#111; border:1px solid #333; border-radius:8px; margin-bottom:15px; font-family:monospace;">
                    <div style="color:#888; font-size:12px; margin-bottom:5px;">CANLI DURUM: <span style="color:#fff; font-weight:bold;">${statusData.status}</span></div>
                    <div style="font-size:18px; display:flex; gap:20px;">
                        <div>📄 <span style="color:#fff;">${statusData.scanned_pages}</span> <span style="font-size:12px; color:#666;">/ ${statusData.total_discovered}</span></div>
                        <div>🔗 <span style="color:#ff4444;">${statusData.broken_links}</span></div>
                        <div>🖼️ <span style="color:#ffaa00;">${statusData.missing_assets}</span></div>
                        <div>💥 <span style="color:#ff0000;">${statusData.server_errors}</span></div>
                    </div>
                    <div style="margin-top:5px; height:4px; background:#333; width:100%; border-radius:2px;">
                        <div style="height:100%; background:var(--os-accent); width:${(statusData.scanned_pages / Math.max(statusData.total_discovered, 1)) * 100}%;"></div>
                    </div>
                </div>`;

                // If Completed, get full report
                if (statusData.status === "COMPLETED") {
                    clearInterval(auditInterval);
                    await fetchAndShowReport(log);
                }

            } catch (e) {
                console.error("Polling error", e);
            }
        }, 1000); // Poll every 1 second

    } catch (err) {
        log.innerHTML += "<br><span style='color:red'>HATA: Sunucu bağlantısı koptu.</span>";
        console.error(err);
    }
}

async function fetchAndShowReport(logElement) {
    try {
        const res = await fetch("http://127.0.0.1:8000/admin/deep-audit/report");
        const data = await res.json();

        // Append full report below the status box
        const writeSection = (title, items, color, keyName = 'url') => {
            if (!items || items.length === 0) return "";
            let html = `<div style="margin-top:15px; border-bottom:1px solid #333; padding-bottom:5px; color:${color}; font-weight:bold;">==== ${title} (${items.length}) ====</div>`;
            items.forEach(i => {
                let msg = i[keyName] || i.url || i;
                let status = i.status ? ` (${i.status})` : '';
                let issue = i.issue ? ` (${i.issue})` : '';
                let suggestion = i.suggestion ? ` <br><span style='color:#00ff88'>&nbsp;&nbsp;↳ Öneri: ${i.suggestion}</span>` : '';
                html += `<div style='color:#ccc; margin-left:10px; font-size:13px; margin-bottom:3px;'>• ${msg}${status}${issue}${suggestion}</div>`;
            });
            return html;
        };

        let reportHtml = "";
        reportHtml += writeSection("KIRIK LİNKLER", data.broken_links, "#ff4444");
        reportHtml += writeSection("EKSİK ASSETLER (IMG/JS/CSS)", data.missing_assets, "#ffaa00");
        reportHtml += writeSection("SUNUCU HATALARI", data.server_errors, "#ff0000");
        reportHtml += writeSection("SEO EKSİKLERİ", data.seo_issues, "#00aaff");
        reportHtml += writeSection("AKILLI DÜZELTME ÖNERİLERİ", data.fix_suggestions, "#00ff88", "broken");

        if (data.broken_links.length === 0 && data.missing_assets.length === 0) {
            reportHtml += "<br><br><span style='color:#00ff88; font-weight:bold;'>✔ MÜKEMMEL! Hiçbir teknik sorun bulunamadı.</span>";
        }

        // --- SEMANTIC AUDIT SECTION ---
        if (data.semantic_audit && data.semantic_audit.length > 0) {
            let totalScore = 0;
            let totalWords = 0;
            let luxuryCount = 0;
            let issuesCount = 0;

            data.semantic_audit.forEach(page => {
                totalScore += page.score;
                totalWords += page.word_count;
                luxuryCount += page.luxury_hits.length;
                issuesCount += page.issues.length;
            });

            const avgScore = Math.round(totalScore / data.semantic_audit.length);

            let toneColor = "#ff0000";
            if (avgScore >= 80) toneColor = "#00ff88"; // Excellent
            else if (avgScore >= 60) toneColor = "#ffaa00"; // Good

            reportHtml += `<div style="margin-top:20px; padding:15px; border:1px solid ${toneColor}; border-radius:8px; background:#111;">
                <h4 style="margin:0; color:${toneColor};">🧠 AI TONE GUARD (Santis Semantic Engine)</h4>
                <div style="display:flex; justify-content:space-between; margin-top:10px;">
                    <div style="text-align:center;">
                        <div style="font-size:32px; font-weight:bold; color:#fff;">${avgScore}</div>
                        <div style="font-size:12px; color:#888;">LÜKS SKORU</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:32px; font-weight:bold; color:#fff;">${luxuryCount}</div>
                        <div style="font-size:12px; color:#888;">LÜKS KELİME</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:32px; font-weight:bold; color:#ff4444;">${issuesCount}</div>
                        <div style="font-size:12px; color:#888;">YASAKLI KELİME</div>
                    </div>
                </div>
                <div style="margin-top:10px; font-size:12px; color:#ccc;">
                    Analyzing ${data.semantic_audit.length} pages based on "Quiet Luxury" standards.
                </div>
            </div>`;

            // Show specific semantic issues
            let semanticIssues = [];
            data.semantic_audit.forEach(p => {
                p.issues.forEach(i => {
                    semanticIssues.push({
                        url: p.url,
                        issue: `"${i.word}" (Kullanım: ${i.count})`,
                        suggestion: `Yerine: "${i.suggestion}" kullanın.`
                    });
                });
            });

            reportHtml += writeSection("SEMANTIC UYUMSUZLUKLAR (Tone Guard)", semanticIssues, "#ff4444");
        }

        // PDF DOWNLOAD BUTTON
        reportHtml += `<br><br><a href="/admin/deep-audit/report-pdf" target="_blank" class="btn-os" style="background:#fff; color:#000; display:inline-block; margin-top:10px; text-decoration:none; font-weight:bold; padding:10px 20px;">📄 PDF TEKNİK RAPORU İNDİR</a>`;

        // AUTO-FIX PANEL
        reportHtml += `
        <div style="margin-top:20px; padding:15px; border:1px solid #444; border-radius:8px; background:#1a1a1a;">
            <h4 style="margin-top:0; color:#00ff88;">🛠️ SANTIS SELF-HEALING SYSTEM (BETA)</h4>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button data-action="dashboard-run-autofix" data-type="images" class="btn-os" style="background:#ffaa00; color:#000; font-size:12px;">🖼️ Eksik Resimleri Onar</button>
                <!--- <button data-action="dashboard-run-autofix" data-type="links" class="btn-os" style="background:#ff4444; color:#fff; font-size:12px;">🔗 Kırık Linkleri Düzelt (.bak alır)</button> --->
                <button data-action="dashboard-run-autofix" data-type="sitemap" class="btn-os" style="background:#00aaff; color:#fff; font-size:12px;">🗺️ Sitemap.xml Oluştur</button>
            </div>
            <div id="fixResult" style="margin-top:10px; font-size:12px; color:#ccc;"></div>
        </div>
        
        <!-- VISUAL AUDIT PANEL -->
            <div style="margin-top:20px; padding:15px; border:1px solid #444; border-radius:8px; background:#1a1a1a;">
            <h4 style="margin-top:0; color:#00aaff;">👁️ VISUAL SENTINEL (Görsel Bekçi)</h4>
            <div style="font-size:12px; color:#888; margin-bottom:10px;">
                Sitenin ekran görüntülerini alıp (Playwright) önceki versiyonlarla karşılaştırır.
            </div>
            <button data-action="dashboard-run-visual-audit" class="btn-os" style="background:#00aaff; color:#000;">📸 GÖRSEL TARAMA BAŞLAT</button>
            <div id="visualResult" style="margin-top:10px; color:#ccc; font-family:monospace;"></div>
        </div>
        
        <!-- PERFORMANCE AUDIT PANEL -->
            <div style="margin-top:20px; padding:15px; border:1px solid #444; border-radius:8px; background:#1a1a1a;">
            <h4 style="margin-top:0; color:#ffcc00;">⚡ PERFORMANCE DEEP DIVE</h4>
            <div style="font-size:12px; color:#888; margin-bottom:10px;">
                Core Web Vitals (LCP, CLS, FCP) ve Sunucu Hız Testi (TTFB).
            </div>
            <button data-action="dashboard-run-performance-audit" class="btn-os" style="background:#ffcc00; color:#000;">🏎️ HIZ TESTİ BAŞLAT</button>
            <div id="perfResult" style="margin-top:10px; color:#ccc; font-family:monospace;"></div>
        </div>
        
        <!-- SECURITY AUDIT PANEL -->
            <div style="margin-top:20px; padding:15px; border:1px solid #444; border-radius:8px; background:#1a1a1a;">
            <h4 style="margin-top:0; color:#ff4444;">🛡️ SECURITY SHIELD</h4>
            <div style="font-size:12px; color:#888; margin-bottom:10px;">
                Header Analizi, Hassas Dosya Taraması ve SSL Kontrolü.
            </div>
            <div style="display:flex; gap:10px;">
                <button data-action="dashboard-run-security-audit" class="btn-os" style="background:#ff4444; color:#fff;">🛡️ GÜVENLİK TARAMASI BAŞLAT</button>
                <button data-action="dashboard-run-security-patch" class="btn-os" style="background:#ff0000; color:#fff; border:1px solid #ffaaaa;">🧨 GÜVENLİĞİ OTOMATİK GÜÇLENDİR</button>
            </div>
            <div id="securityResult" style="margin-top:10px; color:#00ff88; font-family:monospace; font-size:11px;"></div>
            <div id="secResult" style="margin-top:10px; color:#ccc; font-family:monospace;"></div>
            <div style="margin-top:10px; font-size:11px; color:#666; border-top:1px solid #333; padding-top:5px;">
                🔒 <b>Aktif Korumalar (Middleware):</b> CSP, X-Frame-Options (DENY), Sensitive Path Blocker (.env, .git)
            </div>
        </div>
        
        <!-- AI FIX SUGGESTIONS PANEL -->
            <div style="margin-top:20px; padding:15px; border:1px solid #aa00ff; border-radius:8px; background:#1a0033;">
            <h4 style="margin-top:0; color:#aa00ff;">🧠 SANTIS BRAIN (AI Fix Suggestions)</h4>
            <div style="font-size:12px; color:#cba3ff; margin-bottom:10px;">
                Tüm taramaları analiz eder ve akıllı çözüm önerileri sunar.
            </div>
            <button data-action="dashboard-run-ai-fix-suggestions" class="btn-os" style="background:#aa00ff; color:#fff;">🧠 AKILLI ÖNERİLERİ GETİR</button>
            <div id="aiResult" style="margin-top:10px; color:#ccc; font-family:monospace;"></div>
        </div>
        
        <!-- LIVE ATTACK SIMULATOR PANEL -->
            <div style="margin-top:20px; padding:15px; border:1px solid #ff0055; border-radius:8px; background:#330011;">
            <h4 style="margin-top:0; color:#ff0055;">⚔️ LIVE ATTACK SIMULATOR (Red Team)</h4>
            <div style="font-size:12px; color:#ff99bb; margin-bottom:10px;">
                Sitemize saldırı simülasyonu yaparak savunma hatlarını test eder.
            </div>
            <button data-action="dashboard-run-attack-sim" class="btn-os" style="background:#ff0055; color:#fff;">⚔️ SALDIRI SİMÜLASYONU BAŞLAT</button>
            <div id="attackResult" style="margin-top:10px; color:#ccc; font-family:monospace;"></div>
        </div>
        `;

        logElement.innerHTML += reportHtml;
    } catch (e) {
        logElement.innerHTML += "<br>Rapor alınamadı.";
    }
}

// --- AUTO FIX ---
async function runAutoFix(type, target = null, btnElement = null) {
    // If runAutoFix('type') from button, type varies
    // If called with (fixId, target, btn), it's the AI Apply path.
    // Let's distinguish by arguments.

    // CASE 1: AI Apply Fix (3 args or 2 args where 1st is UUID-like)
    if (target !== null || (type && type.includes('-') && type.length > 10)) {
        return applyAiFix(type, target, btnElement);
    }

    // CASE 2: Module Trigger (images, sitemap, ghost, utf8, etc.)
    const resBox = document.getElementById("fixResult");
    if (resBox) resBox.innerHTML = "⏳ İşlem yapılıyor...";

    try {
        const res = await fetch(`http://127.0.0.1:8000/admin/deep-audit/fix/${type}`);
        const data = await res.json();

        if (resBox) {
            if (type === 'images') {
                resBox.innerHTML = `✅ ${data.healed_count} görsel onarıldı! (Placeholder atandı)`;
            } else if (type === 'sitemap') {
                resBox.innerHTML = `✅ Sitemap oluşturuldu! (${data.url_count} Link) - <a href="/sitemap.xml" target="_blank" style="color:#fff;">Görüntüle</a>`;
            } else if (type === 'links') {
                resBox.innerHTML = `✅ ${data.fixed_count} link düzeltildi!`;
            } else if (type === 'ghost') {
                resBox.innerHTML = `✅ ${data.total_fixed} hayalet dosya silindi.`;
            } else if (type === 'utf8') {
                resBox.innerHTML = `✅ ${data.issues ? data.issues.length : 0} dosya tarandı. ${data.message}`;
            } else if (type === 'optimize') {
                resBox.innerHTML = `✅ ${data.issues ? data.issues.length : 0} büyük görsel bulundu.`;
            } else {
                resBox.innerHTML = `✅ İşlem tamamlandı: ${JSON.stringify(data)}`;
            }
        }

    } catch (e) {
        if (resBox) resBox.innerHTML = "❌ Hata oluştu.";
        console.error(e);
    }
}

async function applyAiFix(fixId, target, btnElement) {
    const btn = btnElement || (event && event.target);
    if (!confirm("⚠️ KOD DEĞİŞİKLİĞİ YAPILACAK!\n\nBu düzeltmeyi 'AutoFixer Engine' ile uygulamak istiyor musunuz?\nÖnce otomatik yedek (.bak) alınacaktır.")) return;

    const originalText = btn ? btn.innerText : "...";
    if (btn) {
        btn.innerText = "⏳ Uygulanıyor...";
        btn.disabled = true;
    }

    try {
        const res = await fetch("http://127.0.0.1:8000/api/admin/auto-fix", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fix_id: fixId, target: target })
        });

        const data = await res.json();

        if (data.success || data.status === "fixed") {
            alert("✅ BAŞARILI: " + (data.message || "Düzeltme uygulandı."));
            // Refresh suggestions
            runAIFixSuggestions();
        } else {
            alert("❌ Hata: " + (data.message || "Bilinmeyen hata"));
            if (btn) {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        }
    } catch (e) {
        console.error(e);
        alert("❌ Ağ Hatası");
        if (btn) {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
}


// --- VISUAL AUDIT (V1.0) ---
async function runVisualAudit() {
    const resBox = document.getElementById("visualResult");
    if (!resBox) return; // Guard

    resBox.innerHTML = "👁️ <b>Görsel Bekçi Taraması Başladı...</b><br>Ekran görüntüleri alınıyor (Playwright)...";

    // List of pages to check (Critical Paths)
    const pages = ["/", "/contact.html", "/services.html"];

    let html = "<div style='margin-top:10px;'>";

    for (const page of pages) {
        try {
            resBox.innerHTML += `<br>📸 Taranıyor: ${page}...`;

            const res = await fetch("http://127.0.0.1:8000/admin/visual-audit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: page })
            });
            const data = await res.json();

            if (data.error) {
                html += `<div style='color:red;'>❌ ${page}: ${data.error}</div>`;
            } else if (data.status === "REFERENCE_UPDATED") {
                html += `<div style='color:#00aaff;'>ℹ️ ${page}: Referans oluşturuldu (İlk Tarama)</div>`;
            } else {
                let color = data.match === "PERFECT" ? "#00ff88" : "#ffaa00";
                html += `<div style='color:${color};'>
                    ${data.match === "PERFECT" ? "✅" : "⚠️"} <b>${page}</b>: Skor ${data.score}/100 
                    ${data.diff_image ? `(<a href='/visual_checkpoints/diffs/${data.diff_image.split(/[\\/]/).pop()}' target='_blank' style='color:#fff'>Farkı Gör</a>)` : ""}
                </div>`;
            }

        } catch (e) {
            html += `<div style='color:red;'>❌ ${page}: Bağlantı Hatası</div>`;
        }
    }
    html += "</div>";
    resBox.innerHTML = html;
}

// --- PERFORMANCE AUDIT (V1.0) ---
async function runPerformanceAudit() {
    const resBox = document.getElementById("perfResult");
    if (!resBox) return;

    resBox.innerHTML = "⚡ <b>Hız Testi Başladı...</b><br>Playwright motoru ısınıyor...";

    const pages = ["/", "/services.html"]; // Test key pages
    let html = "<div style='margin-top:10px;'>";

    for (const page of pages) {
        try {
            resBox.innerHTML += `<br>🏎️ Ölçülüyor: ${page}...`;

            const res = await fetch("http://127.0.0.1:8000/admin/performance-audit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: page })
            });
            const data = await res.json();

            if (data.error) {
                html += `<div style='color:red;'>❌ ${page}: ${data.error}</div>`;
            } else {
                // Colorize Score
                let scoreColor = "#ff0000";
                if (data.score >= 90) scoreColor = "#00ff88";
                else if (data.score >= 50) scoreColor = "#ffaa00";

                html += `<div style='margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:5px;'>
                    <div style='color:${scoreColor}; font-weight:bold; font-size:14px;'>
                        ${page} (Skor: ${data.score}/100)
                    </div>
                    <div style='display:grid; grid-template-columns: 1fr 1fr 1fr; gap:5px; font-size:11px; margin-top:5px; color:#ccc;'>
                        <div>🚀 FCP: <span style="color:#fff">${data.fcp}ms</span></div>
                        <div>🖼️ LCP: <span style="color:#fff">${data.lcp}ms</span></div>
                        <div>🤾 CLS: <span style="color:#fff">${data.cls}</span></div>
                        <div>📡 TTFB: <span style="color:#fff">${data.ttfb}ms</span></div>
                        <div>⚖️ Boyut: <span style="color:#fff">${data.resources.total_size} KB</span></div>
                        <div>📦 Kaynak: <span style="color:#fff">${data.resources.count} adet</span></div>
                    </div>
                </div>`;
            }
        } catch (e) {
            html += `<div style='color:red;'>❌ ${page}: Bağlantı Hatası</div>`;
        }
    }
    html += "</div>";
    resBox.innerHTML = html;
}

// --- SECURITY AUDIT (V1.0) ---
async function runSecurityAudit() {
    const resBox = document.getElementById("secResult");
    if (!resBox) return;

    resBox.innerHTML = "🛡️ <b>Güvenlik Taraması Başladı...</b><br>Header ve Dosya Taraması yapılıyor...";

    try {
        const res = await fetch("http://127.0.0.1:8000/admin/security-audit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: "/" }) // Scan root
        });
        const data = await res.json();

        if (data.error) {
            resBox.innerHTML = `<div style='color:red;'>❌ Hata: ${data.error}</div>`;
            return;
        }

        // Colorize Grade
        let color = "#ff0000"; // F
        if (data.grade === "A") color = "#00ff88";
        else if (data.grade === "B") color = "#ffaa00";
        else if (data.grade === "C") color = "#ffff00";

        let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
            <div style="font-size:32px; font-weight:bold; color:${color};">${data.grade}</div>
            <div style="font-size:14px; color:#fff;">GÜVENLİK SKORU: ${data.score}/100</div>
        </div>
        
        <div style="font-size:12px;">
            <div style="margin-bottom:5px; color:#ccc;">🔒 SSL Durumu: <span style="color:${data.ssl_info.valid ? '#00ff88' : '#ff4444'}">${data.ssl_info.protocol}</span></div>
            <div style="margin-bottom:10px; font-weight:bold;">🛡️ Güvenlik Başlıkları:</div>
        `;

        for (const [key, val] of Object.entries(data.headers)) {
            html += `<div style="display:flex; justify-content:space-between; color:#888; border-bottom:1px solid #222; padding:2px 0;">
                <span>${key}</span>
                <span style="color:${val.present ? '#00ff88' : '#ff4444'}">${val.present ? '✔ MEVCUT' : '❌ EKSİK'}</span>
            </div>`;
        }

        html += `<div style="margin-top:10px; font-weight:bold;">📂 Hassas Dosya Taraması:</div>`;
        if (data.exposed_files.length === 0) {
            html += `<div style="color:#00ff88;">✔ Temiz. Hiçbir hassas dosya dışarı açık değil.</div>`;
        } else {
            data.exposed_files.forEach(f => {
                html += `<div style="color:red;">⚠️ AÇIK: ${f} (Hemen engelleyin!)</div>`;
            });
        }

        html += "</div>";
        resBox.innerHTML = html;

    } catch (e) {
        resBox.innerHTML = "<div style='color:red;'>❌ Bağlantı Hatası</div>";
    }
}

// --- AI FIX SUGGESTIONS (V1.0) ---
async function runAIFixSuggestions() {
    const resBox = document.getElementById("aiResult");
    if (!resBox) return;

    resBox.innerHTML = "🧠 <b>Santis Brain Düşünüyor...</b><br>Security ve Performance verileri analiz ediliyor...";

    try {
        const res = await fetch("http://127.0.0.1:8000/admin/ai-fix-suggestions");
        const data = await res.json();

        if (data.error) {
            resBox.innerHTML = `<div style='color:red;'>❌ Hata: ${data.error}</div>`;
            return;
        }

        if (data.length === 0) {
            resBox.innerHTML = `<div style='color:#00ff88;'>🎉 Harika! Yapay zeka hiçbir kritik eksik bulamadı.</div>`;
            return;
        }

        let html = "";

        data.forEach(item => {
            let color = "#fff";
            if (item.priority === "CRITICAL") color = "#ff4444";
            else if (item.priority === "HIGH") color = "#ffaa00";
            else if (item.priority === "MEDIUM") color = "#ffff00";

            html += `
            <div style="margin-bottom:15px; border:1px solid #444; padding:10px; border-radius:4px; background:#111;">
                <div style="color:${color}; font-weight:bold; font-size:13px;">[${item.priority}] ${item.issue}</div>
                <div style="color:#ccc; font-size:12px; margin-top:5px;">💡 ${item.fix}</div>
                ${item.code ? `<pre style="background:#000; color:#0f0; padding:5px; margin-top:5px; overflow-x:auto;">${item.code}</pre>` : ""}
                ${item.fix_id ? `<button data-action="dashboard-run-autofix-item" data-fix-id="${escapeAttr(item.fix_id)}" data-target="${escapeAttr(item.target || '')}" style="margin-top:5px; background:#444; border:none; color:#fff; cursor:pointer; font-size:10px; padding:3px 8px; border-radius:3px;">⚡ UYGULA (AUTO-APPLY)</button>` : ''}
            </div>
            `;
        });

        resBox.innerHTML = html;

    } catch (e) {
        resBox.innerHTML = "<div style='color:red;'>❌ Bağlantı Hatası</div>";
    }
}

// --- AUTO SECURITY PATCH ---
async function runSecurityPatch() {
    const resBox = document.getElementById("securityResult");
    if (resBox) resBox.innerHTML = "⏳ Güvenlik yamaları kontrol ediliyor...";

    try {
        const res = await fetch("http://127.0.0.1:8000/admin/auto-security-patch");
        const data = await res.json();

        if (resBox) resBox.innerHTML = `
        <div style="border:1px solid #00ff88; padding:10px; background:#003311; border-radius:4px;">
            <div style="font-weight:bold;">✅ ${data.status}</div>
            <div>🛡️ Headers: ${data.headers_enabled.join(", ")}</div>
            <div>🚫 Sensitive Paths: ${data.sensitive_paths_blocked ? "BLOCKED" : "OPEN"}</div>
        </div>
        `;
    } catch (e) {
        if (resBox) resBox.innerHTML = "❌ Hata.";
    }
}

// --- ATTACK SIMULATOR ---
async function runAttackSim() {
    const resBox = document.getElementById("attackResult");
    if (!resBox) return;
    resBox.innerHTML = "⚔️ <b>Saldırı Başlatıldı...</b><br>Red Team operasyonu sürüyor...";

    try {
        const res = await fetch("http://127.0.0.1:8000/admin/attack-simulator", { method: "POST" });
        const data = await res.json();

        if (data.error) {
            resBox.innerHTML = `<div style='color:red;'>❌ Hata: ${data.error}</div>`;
            return;
        }

        // Calculate Success Rate
        const successRate = Math.round((data.score / data.total) * 100);
        let color = "#ff0000";
        if (successRate === 100) color = "#00ff88";
        else if (successRate >= 80) color = "#ffaa00";

        let html = `
        <div style="font-size:18px; font-weight:bold; color:${color}; margin-bottom:10px;">
            SAVUNMA SKORU: %${successRate} (${data.score}/${data.total} Bloklandı)
        </div>
        `;

        data.attacks.forEach(att => {
            let icon = att.status === "BLOCKED" ? "🛡️" : "⚠️";
            let statusColor = att.status === "BLOCKED" ? "#00ff88" : "#ff4444";

            html += `
            <div style="border-bottom:1px solid #440022; padding:5px 0; font-size:12px;">
                <span style="color:#fff; font-weight:bold;">${icon} [${att.type}]</span> 
                <span style="color:#ccc;">${att.target}</span><br>
                <span style="color:${statusColor}; margin-left:20px;">${att.outcome}</span>
            </div>
            `;
        });

        resBox.innerHTML = html;

    } catch (e) {
        resBox.innerHTML = "❌ Hata.";
    }
}

// --- SOCIAL MEDIA DATA (Medya Üssü) ---
async function loadSocialData() {
    try {
        const res = await fetch("http://127.0.0.1:8000/api/admin/social");
        const data = await res.json();

        // 1. Platforms
        const pContainer = document.getElementById('social-platforms-container');
        if (pContainer) {
            pContainer.innerHTML = '';
            const defaults = ['instagram', 'facebook', 'youtube', 'linkedin', 'tripadvisor'];
            defaults.forEach(key => {
                const val = (data.platforms && data.platforms[key]) || '';
                pContainer.innerHTML += `
                    <div class="form-group" style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                        <span style="display:inline-block; width:80px; text-transform:uppercase; font-size:11px; color:#888;">${key}</span>
                        <input type="text" id="${key}" data-platform="${key}" class="os-input" value="${val}" style="flex:1;" placeholder="https://..." />
                    </div>
                `;
            });
        }

        // 2. Concierge
        if (data.concierge) {
            const act = document.getElementById('concierge-active');
            if (act) act.checked = data.concierge.active || false;

            const txt = document.getElementById('concierge-title');
            if (txt) txt.value = data.concierge.title || '';

            const msg = document.getElementById('concierge-welcome');
            if (msg) msg.value = data.concierge.welcome || '';
        }

        // 2.5 Pixels
        if (data.pixels) {
            const fbq = document.getElementById('meta-pixel-id');
            if (fbq) fbq.value = data.pixels.fbq || '';

            const gtag = document.getElementById('google-gtag-id');
            if (gtag) gtag.value = data.pixels.gtag || '';
        }

        // 3. Biolinks
        const bContainer = document.getElementById('biolinks-container');
        if (bContainer && data.biolinks) {
            bContainer.innerHTML = '';
            data.biolinks.forEach(link => {
                const row = document.createElement('div');
                row.className = 'biolink-row';
                row.style.cssText = 'display:flex; gap:8px; margin-bottom:8px; align-items:center;';
                row.innerHTML = `
                    <input class="os-input biolink-label" placeholder="Etiket" style="flex:1;" value="${link.label || ''}" />
                    <input class="os-input biolink-url" placeholder="https://..." style="flex:2;" value="${link.url || ''}" />
                    <button class="btn-os sm" data-action="dashboard-biolink-remove" title="Kaldır">✕</button>
                `;
                bContainer.appendChild(row);
            });
        }
    } catch (e) {
        console.error("Failed to load social data:", e);
    }
}

async function saveSocialData() {
    const platforms = {};
    document.querySelectorAll('#social-platforms-container .os-input').forEach(input => {
        const key = input.dataset.platform || input.id;
        if (key && input.value.trim()) {
            platforms[key] = input.value.trim();
        }
    });

    const concierge = {
        active: document.getElementById('concierge-active')?.checked || false,
        title: document.getElementById('concierge-title')?.value || '',
        welcome: document.getElementById('concierge-welcome')?.value || ''
    };

    const pixels = {
        fbq: document.getElementById('meta-pixel-id')?.value.trim() || '',
        gtag: document.getElementById('google-gtag-id')?.value.trim() || ''
    };

    const biolinks = [];
    document.querySelectorAll('#biolinks-container .biolink-row').forEach(row => {
        const label = row.querySelector('.biolink-label')?.value;
        const url = row.querySelector('.biolink-url')?.value;
        if (label && url) biolinks.push({ label, url });
    });

    const payload = { platforms, concierge, pixels, biolinks };

    try {
        const res = await fetch("http://127.0.0.1:8000/api/admin/social", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('✅ Medya ayarları kaydedildi!');
        } else {
            const err = await res.json().catch(() => ({}));
            alert('❌ Kaydetme hatası: ' + (err.message || res.statusText));
        }
    } catch (e) {
        console.error('[Social] Save error:', e);
        alert('❌ Sunucu bağlantı hatası. Lütfen sunucunun çalıştığından emin olun.');
    }
}

function addBioLink() {
    const container = document.getElementById('biolinks-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'biolink-row';
    row.style.cssText = 'display:flex; gap:8px; margin-bottom:8px; align-items:center;';
    row.innerHTML = `
        <input class="os-input biolink-label" placeholder="Etiket" style="flex:1;" />
        <input class="os-input biolink-url" placeholder="https://..." style="flex:2;" />
        <button class="btn-os sm" data-action="dashboard-biolink-remove" title="Kaldır">✕</button>
    `;
    container.appendChild(row);
}

// Initialization hooks
document.addEventListener('DOMContentLoaded', () => {
    // View switching
    document.querySelectorAll('.os-nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.id.replace('tab-', 'view-');
            const targetView = document.getElementById(targetId);

            if (targetView) {
                // Remove active from all tabs
                document.querySelectorAll('.os-nav-item').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');

                // Remove active from all views
                document.querySelectorAll('.content-layer').forEach(v => v.classList.remove('active'));
                targetView.classList.add('active');

                // Specific View Triggers
                if (targetId === 'view-dashboard') document.querySelector('[data-action="load-stats"]')?.click();
                if (targetId === 'view-intelligence') updateToneHealth();
                if (targetId === 'view-oracle') loadOracleDashboard();
                if (targetId === 'view-social') loadSocialData();
            }
        });
    });

    document.addEventListener('click', (event) => {
        const el = event.target.closest('[data-action]');
        if (!el) return;

        const action = el.dataset.action;
        if (action === 'dashboard-run-autofix') {
            runAutoFix(el.dataset.type || '');
            return;
        }
        if (action === 'dashboard-run-visual-audit') {
            runVisualAudit();
            return;
        }
        if (action === 'dashboard-run-performance-audit') {
            runPerformanceAudit();
            return;
        }
        if (action === 'dashboard-run-security-audit') {
            runSecurityAudit();
            return;
        }
        if (action === 'dashboard-run-security-patch') {
            runSecurityPatch();
            return;
        }
        if (action === 'dashboard-run-ai-fix-suggestions') {
            runAIFixSuggestions();
            return;
        }
        if (action === 'dashboard-run-attack-sim') {
            runAttackSim();
            return;
        }
        if (action === 'dashboard-run-autofix-item') {
            runAutoFix(el.dataset.fixId || '', el.dataset.target || '', el);
            return;
        }
        if (action === 'dashboard-biolink-remove') {
            const row = el.closest('.biolink-row');
            if (row) row.remove();
            return;
        }
        if (action === 'save-master-json') {
            saveMasterJson();
            return;
        }
    });

    // Content Studio Helper Functions (Phase 6)
    window.loadJsonFile = async function (filePath) {
        document.getElementById('json-editor-title').innerText = "Yükleniyor...";
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/admin/raw-file?path=${encodeURIComponent(filePath)}`);
            if (res.ok) {
                const data = await res.json();
                document.getElementById('json-editor').value = JSON.stringify(data.content, null, 2);
                document.getElementById('json-editor-title').innerText = filePath;
            } else {
                alert("Dosya yüklenemedi: " + res.statusText);
                document.getElementById('json-editor-title').innerText = "Hata oluştu.";
            }
        } catch (e) {
            alert("Bağlantı hatası: " + e.message);
        }
    };

    window.saveMasterJson = async function () {
        const filePath = document.getElementById('json-editor-title').innerText;
        if (!filePath || filePath.includes("Seçiniz") || filePath.includes("Yükleniyor") || filePath.includes("Hata")) {
            alert("Lütfen önce soldaki veritabanlarından birini seçin.");
            return;
        }

        try {
            const updatedContent = JSON.parse(document.getElementById('json-editor').value);

            const res = await fetch(`http://127.0.0.1:8000/api/admin/raw-file`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: filePath, content: updatedContent })
            });

            if (res.ok) {
                alert(`✅ Düzenlemeler ${filePath.split("/").pop()} dosyasına uygulandı.`);
            } else {
                alert("❌ Kayıt edilemedi: " + res.statusText);
            }
        } catch (e) {
            alert("❌ Hatali JSON Formatı: Lütfen eksik virgül veya süslü parantez olmadığını kontrol edin.\n" + e.message);
        }
    };

    // Hook into switchTab
    const tabOracle = document.getElementById('tab-oracle');
    if (tabOracle) tabOracle.addEventListener('click', loadOracleDashboard);

    const tabSocial = document.getElementById('tab-social');
    if (tabSocial) tabSocial.addEventListener('click', loadSocialData);

    // Auto-load social data in background so it's ready
    loadSocialData();

    // Auto-Start View Intelligence poll (handled in setInterval above)
    // Initial calls if active
    if (document.getElementById('view-intelligence') && document.getElementById('view-intelligence').classList.contains('active')) {
        updateToneHealth();
    }

    // Phase 6: Initialize Admin God Mode Simulators
    if (typeof initGodModeSimulators === 'function') {
        initGodModeSimulators();
    }
});

// --- RED TEAM & SECURITY SHIELD (FAZ 10) ---
window.loadRedTeamPanel = function () {
    console.log("🛡️ Red Team panel yüklendi");
};

window.runRedTeamSimulation = async function () {
    const logBox = document.getElementById("redteam-log");
    const scoreBox = document.getElementById("redteam-score");
    if (!logBox) return;

    logBox.innerHTML = "> 🔴 AUTHORIZATION RECEIVED.<br>> EXECUTING ATTACK VECTORS...<br><br>";
    scoreBox.textContent = "--";
    scoreBox.style.color = "#ff4444";

    try {
        const res = await fetch("http://127.0.0.1:8000/api/admin/simulate-attack", { method: 'POST' });
        const data = await res.json();

        if (data.error || data.status === "ERROR") {
            logBox.innerHTML += `<div style='color:red;'>[FATAL] Simulation failed: ${data.detail || 'Internal Backend Error'}</div>`;
            return;
        }

        let html = `> 🎯 MISSION STATUS: <b style="color:#00ff88">${data.status}</b><br><br>`;

        data.results.forEach(item => {
            let color = "#fff";
            if (item.status === "PASS") color = "#00ff88";
            else if (item.status === "WARN") color = "#ffcc00";
            else if (item.status === "FAIL") color = "#ff4444";

            html += `<span style="color:${color}">[${item.status}] ${item.test}</span><br>`;
            html += `<span style="color:#888;">   ↳ ${item.detail}</span><br><br>`;
        });

        html += `> 📡 SIMULATION COMPLETE.`;
        logBox.innerHTML = html;

        // Animate score counting
        let currentScore = 0;
        const targetScore = data.score;
        let scoreColor = targetScore >= 90 ? "#00ff88" : (targetScore >= 70 ? "#ffcc00" : "#ff4444");

        const timer = setInterval(() => {
            currentScore += 2;
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(timer);
            }
            scoreBox.style.color = scoreColor;
            scoreBox.textContent = currentScore;
        }, 20);

    } catch (e) {
        logBox.innerHTML += `<div style='color:red;'>[FATAL] Network error connecting to simulation node: ${e.message}</div>`;
    }
};
