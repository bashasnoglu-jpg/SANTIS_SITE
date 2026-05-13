/**
 * SANTIS OS — i18n Mirror Dashboard v4.0
 * Language Asset Management Center — HARDENED ACTION PANEL
 * 
 * v4 Fixes:
 *   ✅ DOMParser instead of fragile regex for HTML transformation
 *   ✅ Duplicate draft protection (cannot create twice)
 *   ✅ Canonical fallback (auto-create if missing in source)
 *   ✅ Full hreflang cluster injection in draft pages
 *   ✅ OG tag updates via DOM
 *   ✅ Static hreflang set for all sibling languages
 */
(function () {
    'use strict';

    const LANGS = ['tr', 'en', 'de', 'fr', 'ru'];
    const LANG_LABELS = { tr: '🇹🇷 TR', en: '🇬🇧 EN', de: '🇩🇪 DE', fr: '🇫🇷 FR', ru: '🇷🇺 RU' };
    const LANG_NAMES = { tr: 'Türkçe', en: 'English', de: 'Deutsch', fr: 'Français', ru: 'Русский' };
    const DOMAIN = 'https://santis-club.com';

    const ROUTE_MAP = {
        masajlar: { tr: 'masajlar', en: 'massages', de: 'massagen', fr: 'massages', ru: 'massages' },
        hamam: { tr: 'hamam', en: 'hammam', de: 'hammam', fr: 'hammam', ru: 'hammam' },
        'cilt-bakimi': { tr: 'cilt-bakimi', en: 'services', de: 'services', fr: 'services', ru: 'services' },
        galeri: { tr: 'galeri', en: 'gallery', de: 'gallery', fr: 'gallery', ru: 'gallery' },
        hakkimizda: { tr: 'hakkimizda', en: 'about', de: 'about', fr: 'about', ru: 'about' },
        ekibimiz: { tr: 'ekibimiz', en: 'team', de: 'team', fr: 'team', ru: 'team' },
        blog: { tr: 'blog', en: 'blog', de: 'blog', fr: 'blog', ru: 'blog' },
        bilgelik: { tr: 'bilgelik', en: 'wisdom', de: 'wisdom', fr: 'wisdom', ru: 'wisdom' },
        rezervasyon: { tr: 'rezervasyon', en: 'booking', de: 'booking', fr: 'booking', ru: 'booking' },
        magaza: { tr: 'magaza', en: 'shop', de: 'shop', fr: 'shop', ru: 'shop' },
    };

    let routesData = null;
    let currentFilter = 'all';
    function escapeAttr(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // ═══════════════════════════════════════════════════════════════
    // LOAD DATA
    // ═══════════════════════════════════════════════════════════════
    window.loadI18nDashboard = async function () {
        const container = document.getElementById('i18n-loading');
        if (container) container.textContent = 'Veriler yükleniyor...';

        try {
            const resp = await fetch('/assets/data/available-routes.json?v=' + Date.now());
            if (!resp.ok) throw new Error('Registry not found');
            routesData = await resp.json();
        } catch (e) {
            if (container) container.textContent = '❌ available-routes.json yüklenemedi: ' + e.message;
            return;
        }
        if (container) container.style.display = 'none';

        renderStats();
        renderRiskAlerts();
        renderMatrix();
        renderRouteMap();
    };

    // ═══════════════════════════════════════════════════════════════
    // STATS
    // ═══════════════════════════════════════════════════════════════
    function getStats() {
        const entries = Object.entries(routesData);
        const total = entries.length;
        let full = 0, partial = 0, trOnly = 0, missingEN = 0;

        for (const [, langs] of entries) {
            const count = LANGS.filter(l => langs[l]).length;
            if (count >= 5) full++;
            else if (count === 1) trOnly++;
            else partial++;
            if (!langs.en) missingEN++;
        }
        return { total, full, partial, trOnly, missingEN };
    }

    function renderStats() {
        const s = getStats();
        setText('i18n-stat-total', s.total);
        setText('i18n-stat-full', s.full);
        setText('i18n-stat-partial', s.partial);
        setText('i18n-stat-tronly', s.trOnly);

        const coverage = s.total > 0 ? ((s.full / s.total) * 100).toFixed(0) : 0;
        const el = document.getElementById('i18n-seo-score');
        if (el) {
            el.textContent = coverage + '%';
            el.style.color = coverage >= 80 ? '#00ff88' : coverage >= 50 ? '#ffcc00' : '#ff4444';
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SEO RISK ALERTS
    // ═══════════════════════════════════════════════════════════════
    function renderRiskAlerts() {
        const container = document.getElementById('i18n-risk-alerts');
        if (!container) return;
        container.innerHTML = '';

        const s = getStats();
        const alerts = [];

        const weakCount = Object.values(routesData)
            .filter(langs => { const c = LANGS.filter(l => langs[l]).length; return c >= 2 && c <= 3; }).length;
        if (weakCount > 0) {
            alerts.push({
                level: 'warn', icon: '⚠️',
                text: weakCount + ' sayfa sadece 2-3 dilde — SEO cluster zayıf',
                detail: 'Google, 5 dilli sayfaları daha güçlü sıralar. Bu sayfalar eksik çevirilerle topical authority kaybediyor.'
            });
        }
        if (s.missingEN > 0) {
            alerts.push({
                level: 'danger', icon: '🔴',
                text: s.missingEN + ' sayfa İngilizce\'de yok — global erişim kaybı',
                detail: 'EN dili yoksa Google uluslararası arama sonuçlarında bu sayfaları göstermez.'
            });
        }
        const coveragePct = s.total > 0 ? (s.full / s.total * 100) : 0;
        if (coveragePct < 50) {
            alerts.push({
                level: 'warn', icon: '📉',
                text: 'SEO coverage %' + coveragePct.toFixed(0) + ' — hedef: %80+',
                detail: 'Her 10 sayfadan ' + (10 - Math.round(coveragePct / 10)) + '\'u tam kapsama dışında.'
            });
        }
        if (s.full > 0) {
            alerts.push({
                level: 'ok', icon: '✅',
                text: s.full + ' sayfa tam 5 dil kapsamasında — enterprise SEO hazır',
                detail: 'Bu sayfalar Google\'da tüm dillerde güçlü şekilde indeksleniyor.'
            });
        }

        for (const alert of alerts) {
            const colors = {
                danger: { bg: 'rgba(255,68,68,0.08)', border: '#ff4444', text: '#ff6b6b' },
                warn: { bg: 'rgba(255,204,0,0.08)', border: '#ffcc00', text: '#ffdd44' },
                ok: { bg: 'rgba(0,255,136,0.08)', border: '#00ff88', text: '#00ff88' }
            };
            const c = colors[alert.level];
            const div = document.createElement('div');
            div.style.cssText = 'display:flex; gap:12px; align-items:flex-start; padding:12px 16px; ' +
                'border-radius:8px; margin-bottom:8px; background:' + c.bg + '; border:1px solid ' + c.border + ';';
            div.innerHTML = '<span style="font-size:18px; flex-shrink:0;">' + alert.icon + '</span>' +
                '<div><div style="font-weight:600; color:' + c.text + '; font-size:13px;">' + alert.text + '</div>' +
                '<div style="font-size:11px; color:#888; margin-top:4px;">' + alert.detail + '</div></div>';
            container.appendChild(div);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // MATRIX TABLE (Interactive)
    // ═══════════════════════════════════════════════════════════════
    function renderMatrix() {
        const tbody = document.getElementById('i18n-matrix-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const entries = Object.entries(routesData).sort((a, b) => a[0].localeCompare(b[0]));
        let shown = 0;

        for (const [canonical, langs] of entries) {
            const langCount = LANGS.filter(l => langs[l]).length;
            if (currentFilter === 'missing' && langCount >= 5) continue;
            if (currentFilter === 'tr-only' && langCount > 1) continue;
            if (currentFilter === 'full' && langCount < 5) continue;

            shown++;
            const tr = document.createElement('tr');

            const tdPage = document.createElement('td');
            tdPage.textContent = canonical;
            tdPage.style.fontFamily = "'Consolas', monospace";
            tdPage.style.fontSize = '12px';
            tr.appendChild(tdPage);

            for (const lang of LANGS) {
                const td = document.createElement('td');
                td.style.textAlign = 'center';
                td.style.fontSize = '14px';
                td.id = 'cell-' + canonical.replace(/[\/\.]/g, '-') + '-' + lang;

                if (langs[lang]) {
                    td.textContent = '✅';
                    td.title = lang.toUpperCase() + ': /' + lang + '/' + langs[lang];
                    td.style.cursor = 'help';
                } else {
                    const btn = document.createElement('button');
                    btn.textContent = '❌';
                    btn.title = LANG_NAMES[lang] + ' dilinde yok — tıkla';
                    btn.style.cssText = 'background:none; border:none; font-size:14px; cursor:pointer; ' +
                        'opacity:0.5; transition:all 0.2s; padding:4px 8px; border-radius:4px;';
                    btn.onmouseenter = function () { this.style.opacity = '1'; this.style.background = 'rgba(255,68,68,0.15)'; this.style.transform = 'scale(1.2)'; };
                    btn.onmouseleave = function () { this.style.opacity = '0.5'; this.style.background = 'none'; this.style.transform = 'scale(1)'; };
                    btn.onclick = function () { showCreatePageModal(canonical, lang, langs); };
                    td.appendChild(btn);
                }
                tr.appendChild(td);
            }

            const tdStatus = document.createElement('td');
            tdStatus.style.fontSize = '12px';
            tdStatus.style.whiteSpace = 'nowrap';
            if (langCount >= 5) tdStatus.innerHTML = '<span style="color:#00ff88;">✅ Tam</span>';
            else if (langCount === 1) tdStatus.innerHTML = '<span style="color:#4488ff;">🔵 TR-Only</span>';
            else tdStatus.innerHTML = '<span style="color:#ffcc00;">⚠ Eksik (' + (5 - langCount) + ')</span>';
            tr.appendChild(tdStatus);
            tbody.appendChild(tr);
        }

        setText('i18n-matrix-count', shown + ' / ' + Object.keys(routesData).length + ' sayfa');
    }

    // ═══════════════════════════════════════════════════════════════
    // RESOLVE TARGET PATH
    // ═══════════════════════════════════════════════════════════════
    function resolveTargetPath(canonical, targetLang) {
        const parts = canonical.split('/');
        const category = parts[0];
        const routeEntry = ROUTE_MAP[category];
        const targetDir = routeEntry ? (routeEntry[targetLang] || category) : category;
        return targetDir + '/' + parts.slice(1).join('/');
    }

    // ═══════════════════════════════════════════════════════════════
    // CREATE PAGE MODAL
    // ═══════════════════════════════════════════════════════════════
    function showCreatePageModal(canonical, targetLang, existingLangs) {
        // ─── FIX #2: Duplicate protection ───
        if (existingLangs[targetLang]) {
            showToast('⚠️ Bu dil için sayfa zaten var: ' + existingLangs[targetLang], 'error');
            return;
        }

        var sourceLang = existingLangs.tr ? 'tr' : (existingLangs.en ? 'en' : LANGS.find(function (l) { return existingLangs[l]; }) || 'tr');
        var sourceRelPath = existingLangs[sourceLang] || canonical;
        var sourcePath = '/' + sourceLang + '/' + sourceRelPath;
        var targetRelPath = resolveTargetPath(canonical, targetLang);
        var targetPath = '/' + targetLang + '/' + targetRelPath;

        document.getElementById('i18n-create-modal')?.remove();

        var overlay = document.createElement('div');
        overlay.id = 'i18n-create-modal';
        overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.7); ' +
            'backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:2000;';

        overlay.innerHTML = '<div style="width:580px; max-height:85vh; overflow-y:auto; background:#111; border:1px solid #333; ' +
            'border-radius:16px; padding:28px; box-shadow:0 40px 80px rgba(0,0,0,0.6);">' +

            '<div class="flex" style="justify-content:space-between; align-items:center; margin-bottom:20px;">' +
            '<h3 style="margin:0; color:#00d9ff; font-size:16px;">📝 Yeni Dil Sayfası Oluştur</h3>' +
            '<button class="cursor-pointer" data-action="i18n-modal-close" style="background:none; border:none; color:#888; font-size:20px;">✕</button>' +
            '</div>' +

            '<div style="background:#0a0a0a; border:1px solid #222; border-radius:8px; padding:16px; margin-bottom:16px;">' +
            '<div class="flex" style="gap:20px;">' +
            '<div style="flex:1;">' +
            '<div style="font-size:10px; text-transform:uppercase; color:#888; letter-spacing:1px; margin-bottom:6px;">Kaynak</div>' +
            '<div style="font-size:14px; font-weight:600; color:#00ff88;">' + LANG_LABELS[sourceLang] + '</div>' +
            '<code style="font-size:11px; color:#aaa; display:block; margin-top:4px;">' + sourcePath + '</code>' +
            '</div>' +
            '<div class="flex text-[#d4af37]" style="align-items:center; font-size:24px;">→</div>' +
            '<div style="flex:1;">' +
            '<div style="font-size:10px; text-transform:uppercase; color:#888; letter-spacing:1px; margin-bottom:6px;">Hedef</div>' +
            '<div style="font-size:14px; font-weight:600; color:#ff4444;">' + LANG_LABELS[targetLang] + '</div>' +
            '<code style="font-size:11px; color:#aaa; display:block; margin-top:4px;">' + targetPath + '</code>' +
            '</div>' +
            '</div>' +
            '</div>' +

            '<div style="font-size:12px; color:#ccc; margin-bottom:12px; line-height:1.6;">' +
            '<strong class="text-[#d4af37]">🚀 v4 Otomatik İşlemler (DOMParser):</strong>' +
            '<ol style="margin:8px 0 0 0; padding-left:20px; color:#aaa;">' +
            '<li>Kaynak HTML DOM olarak parse edilir</li>' +
            '<li><code>lang</code> attribute güncellenir</li>' +
            '<li><code>noindex, nofollow</code> meta eklenir</li>' +
            '<li>Title\'a <code>[DRAFT]</code> prefix eklenir</li>' +
            '<li>Canonical URL oluşturulur/güncellenir</li>' +
            '<li>Tüm kardeş diller için hreflang seti yazılır</li>' +
            '<li>OG URL güncellenir</li>' +
            '<li>Registry otomatik güncellenir</li>' +
            '</ol>' +
            '</div>' +

            '<div class="flex" style="gap:20px; margin-top:16px; padding-top:16px; border-top:1px solid #222;">' +
            '<div style="flex:1;">' +
            '<div style="font-size:10px; text-transform:uppercase; color:#888; margin-bottom:6px;">Mevcut Diller</div>' +
            '<div class="flex" style="gap:6px; flex-wrap:wrap;">' +
            LANGS.map(function (l) {
                return existingLangs[l]
                    ? '<span style="padding:2px 8px; border-radius:4px; font-size:11px; background:rgba(0,255,136,0.1); border:1px solid #00ff88; color:#00ff88;">' + l.toUpperCase() + '</span>'
                    : '<span style="padding:2px 8px; border-radius:4px; font-size:11px; background:rgba(255,68,68,0.1); border:1px solid #ff4444; color:#ff4444; opacity:0.5;">' + l.toUpperCase() + '</span>';
            }).join('') +
            '</div>' +
            '</div>' +
            '</div>' +

            '<div class="hidden" id="i18n-draft-progress" style="margin-top:16px; padding:12px; background:#0a0a0a; border:1px solid #222; border-radius:8px; max-height:200px; overflow-y:auto;">' +
            '<pre id="i18n-draft-status" style="font-size:11px; color:#888; font-family:monospace; margin:0; white-space:pre-wrap;"></pre>' +
            '</div>' +

            '<div class="flex" style="gap:10px; margin-top:20px; justify-content:flex-end;">' +
            '<button class="cursor-pointer" data-action="i18n-modal-close" style="padding:8px 20px; background:transparent; border:1px solid #444; border-radius:8px; color:#888; font-size:12px;">Kapat</button>' +
            '<button data-action="i18n-copy-create" data-canonical="' + escapeAttr(canonical) + '" data-target-lang="' + escapeAttr(targetLang) + '" data-source-path="' + escapeAttr(sourcePath) + '" data-target-path="' + escapeAttr(targetPath) + '" ' +
            'style="padding:8px 20px; background:transparent; border:1px solid #666; border-radius:8px; color:#aaa; cursor:pointer; font-size:12px;">📋 Kopyala</button>' +
            '<button id="i18n-draft-btn" data-action="i18n-create-draft" data-canonical="' + escapeAttr(canonical) + '" data-target-lang="' + escapeAttr(targetLang) + '" data-source-lang="' + escapeAttr(sourceLang) + '" data-source-rel-path="' + escapeAttr(sourceRelPath) + '" data-target-rel-path="' + escapeAttr(targetRelPath) + '" ' +
            'style="padding:8px 20px; background:rgba(0,255,136,0.15); border:1px solid #00ff88; border-radius:8px; color:#00ff88; cursor:pointer; font-size:12px; font-weight:bold;">🚀 Taslak Oluştur</button>' +
            '</div>' +

            '</div>';

        document.body.appendChild(overlay);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                overlay.remove();
                return;
            }

            var actionEl = e.target.closest('[data-action]');
            if (!actionEl || !overlay.contains(actionEl)) return;

            var action = actionEl.getAttribute('data-action');
            if (action === 'i18n-modal-close') {
                overlay.remove();
                return;
            }
            if (action === 'i18n-copy-create') {
                window.copyCreateInstructions(
                    actionEl.getAttribute('data-canonical') || '',
                    actionEl.getAttribute('data-target-lang') || '',
                    actionEl.getAttribute('data-source-path') || '',
                    actionEl.getAttribute('data-target-path') || ''
                );
                return;
            }
            if (action === 'i18n-create-draft') {
                window.createDraftPage(
                    actionEl.getAttribute('data-canonical') || '',
                    actionEl.getAttribute('data-target-lang') || '',
                    actionEl.getAttribute('data-source-lang') || '',
                    actionEl.getAttribute('data-source-rel-path') || '',
                    actionEl.getAttribute('data-target-rel-path') || ''
                );
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // CREATE DRAFT PAGE v4 (DOMParser Engine)
    // ═══════════════════════════════════════════════════════════════
    window.createDraftPage = async function (canonical, targetLang, sourceLang, sourceRelPath, targetRelPath) {
        var btn = document.getElementById('i18n-draft-btn');
        var progress = document.getElementById('i18n-draft-progress');
        var statusEl = document.getElementById('i18n-draft-status');

        // ─── FIX #2: Duplicate protection (runtime check) ───
        if (routesData[canonical] && routesData[canonical][targetLang]) {
            showToast('⚠️ Bu dil için sayfa zaten kayıtlı!', 'error');
            return;
        }

        if (btn) { btn.disabled = true; btn.textContent = '⏳ Oluşturuluyor...'; btn.style.opacity = '0.5'; }
        if (progress) progress.style.display = 'block';

        function log(msg) { if (statusEl) { statusEl.textContent += msg + '\n'; statusEl.scrollTop = statusEl.scrollHeight; } }

        try {
            // ───────────────────────────────────────────────────
            // STEP 1: Fetch source HTML
            // ───────────────────────────────────────────────────
            log('📥 Kaynak sayfa yükleniyor...');
            var sourcePath = '/' + sourceLang + '/' + sourceRelPath;
            var resp = await fetch(sourcePath);
            if (!resp.ok) throw new Error('Kaynak bulunamadı: ' + sourcePath + ' (' + resp.status + ')');
            var rawHtml = await resp.text();
            log('✅ Kaynak yüklendi (' + rawHtml.length + ' karakter)');

            // ───────────────────────────────────────────────────
            // STEP 2: Parse with DOMParser (FIX #1)
            // ───────────────────────────────────────────────────
            log('🔧 DOMParser ile HTML dönüşümü...');
            var parser = new DOMParser();
            var doc = parser.parseFromString(rawHtml, 'text/html');
            var targetFullPath = '/' + targetLang + '/' + targetRelPath;
            var canonicalUrl = DOMAIN + targetFullPath;

            // 2a. Update <html lang>
            doc.documentElement.lang = targetLang;
            log('   ✓ lang="' + targetLang + '"');

            // 2b. Add noindex meta (FIX: check if already exists)
            var existingRobots = doc.querySelector('meta[name="robots"]');
            if (existingRobots) {
                existingRobots.content = 'noindex, nofollow';
            } else {
                var metaRobots = doc.createElement('meta');
                metaRobots.name = 'robots';
                metaRobots.content = 'noindex, nofollow';
                // Insert after charset
                var charset = doc.querySelector('meta[charset]');
                if (charset && charset.nextSibling) {
                    charset.parentNode.insertBefore(metaRobots, charset.nextSibling);
                } else {
                    doc.head.insertBefore(metaRobots, doc.head.firstChild);
                }
            }
            log('   ✓ noindex, nofollow');

            // 2c. [DRAFT] title prefix
            if (!doc.title.startsWith('[DRAFT]')) {
                doc.title = '[DRAFT] ' + doc.title;
            }
            log('   ✓ title: ' + doc.title.substring(0, 60));

            // 2d. Canonical URL (FIX #3: create if missing)
            var canonLink = doc.querySelector('link[rel="canonical"]');
            if (!canonLink) {
                canonLink = doc.createElement('link');
                canonLink.rel = 'canonical';
                doc.head.appendChild(canonLink);
                log('   ✓ canonical oluşturuldu (kaynak sayfada yoktu)');
            }
            canonLink.href = canonicalUrl;
            log('   ✓ canonical: ' + canonicalUrl);

            // 2e. OG URL
            var ogUrl = doc.querySelector('meta[property="og:url"]');
            if (ogUrl) {
                ogUrl.content = canonicalUrl;
                log('   ✓ og:url güncellendi');
            }

            // 2f. OG Title (add [DRAFT])
            var ogTitle = doc.querySelector('meta[property="og:title"]');
            if (ogTitle && !ogTitle.content.startsWith('[DRAFT]')) {
                ogTitle.content = '[DRAFT] ' + ogTitle.content;
            }

            // ───────────────────────────────────────────────────
            // STEP 3: Hreflang Cluster (FIX #4)
            // ───────────────────────────────────────────────────
            log('🌐 Hreflang cluster oluşturuluyor...');

            // Remove ALL existing static hreflang links
            doc.querySelectorAll('link[rel="alternate"][hreflang]').forEach(function (el) { el.remove(); });

            // Build complete hreflang set from registry + new page
            var siblings = routesData[canonical] || {};
            // Include the new draft too
            siblings[targetLang] = targetRelPath;

            var hreflangCount = 0;
            for (var i = 0; i < LANGS.length; i++) {
                var lang = LANGS[i];
                if (!siblings[lang]) continue;
                var link = doc.createElement('link');
                link.rel = 'alternate';
                link.hreflang = lang;
                link.href = DOMAIN + '/' + lang + '/' + siblings[lang];
                link.setAttribute('data-static-hreflang', lang === targetLang ? 'self' : 'sibling');
                doc.head.appendChild(link);
                hreflangCount++;
            }

            // x-default → TR or first available
            var defaultLang = siblings.tr ? 'tr' : LANGS.find(function (l) { return siblings[l]; });
            if (defaultLang && siblings[defaultLang]) {
                var xdefLink = doc.createElement('link');
                xdefLink.rel = 'alternate';
                xdefLink.hreflang = 'x-default';
                xdefLink.href = DOMAIN + '/' + defaultLang + '/' + siblings[defaultLang];
                xdefLink.setAttribute('data-static-hreflang', 'default');
                doc.head.appendChild(xdefLink);
                hreflangCount++;
            }
            log('   ✓ ' + hreflangCount + ' hreflang tag eklendi (tam cluster)');

            // ───────────────────────────────────────────────────
            // STEP 4: Serialize back to HTML
            // ───────────────────────────────────────────────────
            var outputHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
            log('✅ HTML dönüşümü tamamlandı (' + outputHtml.length + ' karakter)');

            // ───────────────────────────────────────────────────
            // STEP 5: Save draft via bridge
            // ───────────────────────────────────────────────────
            log('💾 Dosya kaydediliyor: ' + targetFullPath);
            var saveResp = await fetch('/api/bridge/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: targetLang + '/' + targetRelPath,
                    content: outputHtml
                })
            });

            if (!saveResp.ok) {
                var err = await saveResp.json().catch(function () { return { detail: 'Unknown' }; });
                throw new Error('Kayıt başarısız: ' + (err.detail || saveResp.status));
            }
            log('✅ Dosya kaydedildi');

            // ───────────────────────────────────────────────────
            // STEP 6: Update registry
            // ───────────────────────────────────────────────────
            log('📝 Registry güncelleniyor...');
            if (!routesData[canonical]) routesData[canonical] = {};
            routesData[canonical][targetLang] = targetRelPath;

            var registryResp = await fetch('/api/bridge/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: 'assets/data/available-routes.json',
                    content: JSON.stringify(routesData, null, 2)
                })
            });

            if (!registryResp.ok) {
                log('⚠️ Registry güncellenemedi (dosya yine de oluşturuldu)');
            } else {
                log('✅ Registry güncellendi');
            }

            // ───────────────────────────────────────────────────
            // STEP 7: Update matrix cell
            // ───────────────────────────────────────────────────
            var cellId = 'cell-' + canonical.replace(/[\/\.]/g, '-') + '-' + targetLang;
            var cell = document.getElementById(cellId);
            if (cell) {
                cell.innerHTML = '<span title="DRAFT: ' + targetFullPath + '" style="cursor:help; opacity:0.7;">🕓</span>';
            }

            log('');
            log('═══════════════════════════════════════');
            log('🎉 TASLAK SAYFA BAŞARIYLA OLUŞTURULDU!');
            log('   Path: ' + targetFullPath);
            log('   Lang: ' + LANG_NAMES[targetLang]);
            log('   Cluster: ' + hreflangCount + ' hreflang');
            log('   Guard: noindex + [DRAFT]');
            log('═══════════════════════════════════════');

            if (btn) { btn.textContent = '✅ Oluşturuldu!'; btn.style.background = 'rgba(0,255,136,0.3)'; }
            showToast('🎉 Taslak oluşturuldu: ' + targetFullPath, 'success');

            renderStats();
            renderRiskAlerts();

        } catch (e) {
            log('');
            log('❌ HATA: ' + e.message);
            if (btn) { btn.disabled = false; btn.textContent = '🚀 Taslak Oluştur'; btn.style.opacity = '1'; }
            showToast('❌ ' + e.message, 'error');
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // COPY INSTRUCTIONS
    // ═══════════════════════════════════════════════════════════════
    window.copyCreateInstructions = function (canonical, lang, src, dest) {
        var text = [
            '=== i18n Mirror v4 — Sayfa Talimatı ===', '',
            'Canonical: ' + canonical,
            'Hedef Dil: ' + LANG_NAMES[lang] + ' (' + lang + ')',
            'Kaynak:    ' + src,
            'Hedef:     ' + dest, '',
            '1. Taslak Oluştur butonuna bas (otomatik)',
            '2. Çevirileri yap (title, h1, p, meta)',
            '3. noindex kaldır → yayına al',
        ].join('\n');

        navigator.clipboard.writeText(text).then(function () {
            showToast('📋 Kopyalandı!', 'success');
        }).catch(function () {
            showToast('⚠️ Kopyalama başarısız', 'error');
        });
    };

    // ═══════════════════════════════════════════════════════════════
    // TOAST
    // ═══════════════════════════════════════════════════════════════
    function showToast(msg, type) {
        var color = type === 'success' ? '#00ff88' : '#ff4444';
        var toast = document.createElement('div');
        toast.style.cssText = 'position:fixed; top:20px; right:20px; padding:12px 20px; ' +
            'background:rgba(0,0,0,0.9); border:1px solid ' + color + '; ' +
            'border-radius:8px; color:' + color + '; font-size:13px; z-index:3000; max-width:400px;';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(function () { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; }, 2500);
        setTimeout(function () { toast.remove(); }, 3000);
    }

    // ═══════════════════════════════════════════════════════════════
    // FILTER
    // ═══════════════════════════════════════════════════════════════
    window.setI18nFilter = function (filter) {
        currentFilter = filter;
        document.querySelectorAll('.i18n-filter-btn').forEach(function (btn) {
            var isActive = btn.dataset.filter === filter;
            btn.style.background = isActive ? 'rgba(212,175,55,0.2)' : 'transparent';
            btn.style.borderColor = isActive ? '#d4af37' : '#333';
            btn.style.color = isActive ? '#d4af37' : '#888';
        });
        renderMatrix();
    };

    // ═══════════════════════════════════════════════════════════════
    // ROUTE MAP
    // ═══════════════════════════════════════════════════════════════
    function renderRouteMap() {
        var tbody = document.getElementById('i18n-route-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        for (var _i = 0, _a = Object.entries(ROUTE_MAP); _i < _a.length; _i++) {
            var entry = _a[_i];
            var key = entry[0], translations = entry[1];
            var tr = document.createElement('tr');
            var tdKey = document.createElement('td');
            tdKey.textContent = key;
            tdKey.style.fontWeight = 'bold';
            tdKey.style.color = '#d4af37';
            tdKey.style.fontFamily = "'Consolas', monospace";
            tr.appendChild(tdKey);

            for (var j = 0; j < LANGS.length; j++) {
                var td = document.createElement('td');
                td.textContent = translations[LANGS[j]] || '—';
                td.style.fontFamily = "'Consolas', monospace";
                td.style.fontSize = '12px';
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════
    function setText(id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
    }

})();
