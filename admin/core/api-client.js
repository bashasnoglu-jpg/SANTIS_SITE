/**
 * SANTIS OS — API Client v1.0
 * Centralized server communication: save, download, fetch wrapper.
 * Phase 2 Modularization (2026.02.14)
 */
(function () {
    'use strict';

    /**
     * Download content as UTF-8 file with BOM for Excel/Windows compatibility.
     * @param {string} content - File content
     * @param {string} filename - Download filename
     * @param {string} mimeType - MIME type
     */
    window.downloadUTF8 = function (content, filename, mimeType) {
        var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        var blob = new Blob([bom, content], { type: mimeType + ';charset=utf-8' });

        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
        showToast('💾 ' + filename + ' indirildi (UTF-8).', 'success');
    };

    /**
     * Save data to server via Bridge API. Falls back to download on failure.
     * @param {string} path - Server file path (e.g. "assets/data/product-data.json")
     * @param {*} data - Data to save
     * @param {string|null} varName - JS variable name wrapper (null for raw JSON)
     * @param {boolean} isRawJson - If true, save as raw JSON
     */
    window.saveToServer = async function (path, data, varName, isRawJson) {
        isRawJson = isRawJson || false;

        try {
            var content = '';
            if (isRawJson) {
                content = JSON.stringify(data, null, 4);
            } else {
                content = 'const ' + varName + ' = ' + JSON.stringify(data, null, 4) + ';';
            }

            var payload = { path: path, content: content };

            var res = await fetch('/api/bridge/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast('✅ Sunucuya Kaydedildi!', 'success');
            } else {
                showToast('⚠️ Sunucu kaydı başarısız, dosya indiriliyor...', 'warning');
                downloadUTF8(content, path.split('/').pop(), isRawJson ? 'application/json' : 'application/javascript');
            }
        } catch (e) {
            console.warn('Server save failed, falling back to download', e);
            var fallbackContent = isRawJson
                ? JSON.stringify(data, null, 4)
                : 'const ' + varName + ' = ' + JSON.stringify(data, null, 4) + ';';
            downloadUTF8(fallbackContent, path.split('/').pop(), isRawJson ? 'application/json' : 'application/javascript');
        }
    };

    /**
     * Alias: bridgeSave → raw JSON save via Bridge API.
     * Used by Commerce module (cosmetics/atelier).
     */
    window.bridgeSave = async function (path, jsonString) {
        try {
            var res = await fetch('/api/bridge/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: path, content: jsonString })
            });
            if (res.ok) {
                showToast('✅ Sunucuya Kaydedildi!', 'success');
            } else {
                showToast('⚠️ Sunucu kaydı başarısız', 'warning');
            }
        } catch (e) {
            console.warn('bridgeSave failed:', e);
            showToast('❌ Kayıt hatası: ' + e.message, 'error');
        }
    };

    console.log('🌐 [Core] API Client v1.0 loaded');
})();
