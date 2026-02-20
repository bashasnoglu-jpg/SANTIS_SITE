/**
 * SANTIS OS — UI Engine v1.0
 * Centralized UI utilities: toast, modal, confirm.
 * Phase 2 Modularization (2026.02.14)
 */
(function () {
    'use strict';

    /**
     * Show a toast notification.
     * @param {string} msg - Message text
     * @param {string} type - 'info' | 'success' | 'error' | 'warning'
     * @param {number} duration - Auto-dismiss in ms (default 3000)
     */
    window.showToast = function (msg, type, duration) {
        type = type || 'info';
        duration = duration || 3000;

        const el = document.createElement('div');
        el.className = 'os-toast ' + type;
        el.innerText = msg;
        el.style.cssText = [
            'position:fixed', 'bottom:20px', 'right:20px',
            'background:#1a1a1a', 'border:1px solid #d4af37',
            'color:#eee', 'padding:12px 20px', 'border-radius:8px',
            'box-shadow:0 5px 15px rgba(0,0,0,0.5)',
            'z-index:9999', 'font-size:13px',
            'animation:fadeIn 0.3s ease'
        ].join(';');

        // Type-specific border colors
        if (type === 'success') el.style.borderColor = '#00ff88';
        if (type === 'error') el.style.borderColor = '#ff4444';
        if (type === 'warning') el.style.borderColor = '#ffaa00';

        document.body.appendChild(el);
        setTimeout(function () {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.3s';
            setTimeout(function () { el.remove(); }, 300);
        }, duration);
    };

    /**
     * Bind a click event to an element by ID (safe).
     * @param {string} id - Element ID
     * @param {Function} fn - Click handler
     */
    window.bind = function (id, fn) {
        var el = document.getElementById(id);
        if (el && typeof fn === 'function') el.addEventListener('click', fn);
    };

    /**
     * Utility: slugify text.
     */
    window.slugify = function (text) {
        if (!text) return '';
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    };

    console.log('🎨 [Core] UI Engine v1.0 loaded');
})();
