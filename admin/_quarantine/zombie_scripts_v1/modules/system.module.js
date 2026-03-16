/**
 * SANTIS OS — System Module v1.0
 * Build/Backup/Shutdown shims, CityOS cleanup, settings, AI engine, hero preview.
 * Phase 2 Modularization (2026.02.14)
 */
(function () {
    'use strict';

    // --- SYSTEM ACTION SHIMS ---
    window.triggerBuild = function () {
        alert("Build tetikleme bu panel sürümünde devre dışı. Yayına almak için CI/bridge servisini kullanın.");
    };

    window.triggerBackup = function () {
        alert("Yedek alma köprüsü (/backup) etkin değil. Bridge/Server tarafını başlatıp tekrar deneyin.");
    };

    window.shutdownSystem = function () {
        alert("Güvenlik nedeniyle uzaktan kapatma bu arayüzde devre dışı bırakıldı.");
    };

    // --- CITY OS CLEANUP (Active) ---
    window.triggerFix = async function (type) {
        if (!type) {
            console.error("triggerFix called without a type");
            showToast("❌ Fix type missing", "error");
            return;
        }

        var btn = document.getElementById('btn-fix-' + type);
        var originalText = btn ? btn.innerText : "EXECUTE";

        if (btn) {
            btn.disabled = true;
            btn.innerText = "⏳...";
        } else {
            console.warn('Fix button not found for type: ' + type);
        }

        try {
            var endpoints = [
                '/admin/fix/' + type,
                '/api/fix/' + type,
                '/fix/' + type
            ];

            var res, lastStatus;
            for (var i = 0; i < endpoints.length; i++) {
                res = await fetch(endpoints[i], { method: 'POST' });
                lastStatus = res.status;
                if (res.ok) break;
            }

            if (!res || !res.ok) {
                throw new Error('No fix endpoint accepted POST (' + (lastStatus || "n/a") + ')');
            }

            var data = await res.json();

            if (data.total_fixed !== undefined) {
                showToast('✅ ' + type.toUpperCase() + ' Fixed: ' + data.total_fixed + ' items', 'success');
                if (data.fixed_files && data.fixed_files.length > 0) {
                    console.log('[' + type + '] Fixed Files:', data.fixed_files);
                }
            } else if (data.issues) {
                showToast('ℹ️ ' + type.toUpperCase() + ' Scan: ' + data.issues.length + ' issues found', 'info');
            } else {
                showToast('✅ ' + type.toUpperCase() + ' Complete', 'success');
            }
        } catch (err) {
            console.error(err);
            showToast('❌ Error: ' + err.message, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        }
    };

    window.triggerMasterClean = function () {
        var term = document.getElementById('city-terminal');
        var log = function (msg) {
            if (term) {
                var div = document.createElement('div');
                div.textContent = '> ' + msg;
                term.appendChild(div);
                term.scrollTop = term.scrollHeight;
            }
            console.log(msg);
        };

        if (confirm("⚠️ START MASTER CLEAN PROTOCOL?\nThis will modify files to fix Ghost Layers and UTF-8 issues.")) {
            log("🚀 MASTER CLEAN INITIATED...");

            log("👻 STEP 1: Ghost Layer Hunter...");
            triggerFix('ghost').then(function () {
                log("✅ Ghost Scan Complete.");
                log("🧹 STEP 2: UTF-8 Sanitizer...");
                return triggerFix('utf8');
            }).then(function () {
                log("✅ UTF-8 Scan Complete.");
                log("🏁 MASTER CLEAN SEQUENCE FINISHED.");
                alert("Master Clean Sequence Completed.");
            });
        }
    };

    // --- SETTINGS ---
    window.initSettings = function () {
        if (typeof SITE_SETTINGS === 'undefined') return;
        var el = document.getElementById('set-whatsapp');
        if (el) el.value = SITE_SETTINGS.contact.whatsapp;
    };

    window.saveSettings = function () {
        showToast("Ayarlar geçici olarak kaydedildi (Server kaydı eklenecek).");
    };

    // --- AI ENGINE ---
    window.generateAIContent = async function (targetId, type, contextKey) {
        if (!window.SantisCurator) {
            alert("AI Motoru (SantisCurator) henüz yüklenmedi veya pasif.");
            return;
        }

        var targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        var originalText = targetEl.value;
        targetEl.value = "AI yazıyor...";
        targetEl.disabled = true;

        try {
            var context = { type: type, text: originalText, productKey: contextKey };
            var generated = await window.SantisCurator.generate(context);
            targetEl.value = generated;
        } catch (e) {
            console.error("AI Error:", e);
            targetEl.value = originalText;
            alert("AI Hatası: " + e.message);
        } finally {
            targetEl.disabled = false;
        }
    };

    // --- HERO PREVIEW ---
    window.updateHeroPreview = function () {
        var title = (document.getElementById('hero-title-inp') || {}).value;
        var subtitle = (document.getElementById('hero-sub-inp') || {}).value;

        var previewEl = document.getElementById('hero-preview-frame');
        if (previewEl && title) {
            var doc = previewEl.contentDocument || previewEl.contentWindow.document;
            if (doc) {
                var h1 = doc.querySelector('h1');
                var p = doc.querySelector('p');
                if (h1) h1.innerText = title;
                if (p) p.innerText = subtitle;
            }
        }
    };

    // --- SLOT LOGIC ---
    window.addNewSlot = function () {
        var container = document.getElementById('slots-container');
        if (!container) return;

        var div = document.createElement('div');
        div.className = "slot-card fade-in";
        div.innerHTML =
            '<div class="slot-header">New Slot <span class="close-btn" data-action="slot-remove">×</span></div>' +
            '<div class="slot-body">' +
            '<input type="text" placeholder="Slot Title" class="os-input">' +
            '<button class="os-btn-sm" data-action="slot-upload">Upload Image</button>' +
            '</div>';
        container.appendChild(div);
    };

    // --- COMMAND PALETTE (Placeholder) ---
    window.initCommandPalette = function () {
        // Placeholder for command palette integration
    };

    // --- SOCIAL (Placeholder) ---
    window.initSocial = function () {
        // Placeholder
    };

    console.log('⚙️ [Module] System v1.0 loaded');
})();
