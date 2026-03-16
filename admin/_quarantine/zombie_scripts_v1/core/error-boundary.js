/**
 * SANTIS OS — Error Boundary v1.0
 * Global error handler for uncaught exceptions and unhandled promise rejections.
 * Prevents admin panel crashes, shows user-friendly toasts, and logs errors.
 * 
 * Requires: admin-registry.js (SantisAdmin)
 */
(function () {
    'use strict';

    var MAX_LOG_SIZE = 100;
    var DEDUP_WINDOW_MS = 3000; // suppress identical errors within 3s
    var _lastError = '';
    var _lastErrorTime = 0;

    var errorBoundary = {
        log: [],
        errorCount: 0,

        /**
         * Report an error.
         * @param {Error|string} err
         * @param {Object} [context] - additional info (endpoint, module, etc.)
         */
        report: function (err, context) {
            var msg = (err && err.message) ? err.message : String(err);
            var now = Date.now();

            // Deduplicate rapid-fire errors
            if (msg === _lastError && (now - _lastErrorTime) < DEDUP_WINDOW_MS) {
                return;
            }
            _lastError = msg;
            _lastErrorTime = now;

            // Log entry
            var entry = {
                ts: now,
                time: new Date(now).toLocaleTimeString('tr-TR'),
                msg: msg,
                ctx: context || {},
                stack: (err && err.stack) ? err.stack.split('\n').slice(0, 3).join(' | ') : ''
            };

            this.log.push(entry);
            this.errorCount++;

            // Cap log size
            if (this.log.length > MAX_LOG_SIZE) {
                this.log = this.log.slice(-MAX_LOG_SIZE);
            }

            // Update health overlay indicator if available
            this._updateOverlay();

            // Show toast notification
            this._showToast(msg);
        },

        /**
         * Get recent errors.
         * @param {number} [count=10]
         * @returns {Array}
         */
        recent: function (count) {
            count = count || 10;
            return this.log.slice(-count);
        },

        /**
         * Clear error log.
         */
        clear: function () {
            this.log = [];
            this.errorCount = 0;
            this._updateOverlay();
        },

        /**
         * Show error toast.
         * @private
         */
        _showToast: function (msg) {
            // Use SantisAdmin.ui.showToast if available, otherwise create inline toast
            if (window.SantisAdmin && typeof window.SantisAdmin.ui.showToast === 'function') {
                window.SantisAdmin.ui.showToast('⚠️ ' + msg, 'error');
                return;
            }

            // Fallback inline toast
            var toast = document.createElement('div');
            toast.style.cssText =
                'position:fixed; bottom:20px; right:20px; z-index:10001; ' +
                'background:rgba(255,68,68,0.95); color:#fff; ' +
                'padding:12px 20px; border-radius:10px; font-size:13px; ' +
                'max-width:400px; box-shadow:0 4px 20px rgba(0,0,0,0.4); ' +
                'backdrop-filter:blur(10px); font-family:inherit; ' +
                'animation:slideIn 0.3s ease-out;';
            toast.textContent = '⚠️ ' + msg;
            document.body.appendChild(toast);
            setTimeout(function () {
                toast.style.transition = 'opacity 0.3s, transform 0.3s';
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px)';
            }, 4000);
            setTimeout(function () { toast.remove(); }, 4500);
        },

        /**
         * Update health overlay error indicator.
         * @private
         */
        _updateOverlay: function () {
            var indicator = document.getElementById('sa-health-error-count');
            if (indicator) {
                indicator.textContent = this.errorCount;
                indicator.style.display = this.errorCount > 0 ? 'inline-block' : 'none';
            }
        }
    };

    // ── Register on SantisAdmin ──
    if (window.SantisAdmin) {
        window.SantisAdmin.errors = errorBoundary;
    }

    // ── Global Error Listeners ──
    window.addEventListener('error', function (event) {
        // Ignore script loading errors (CSP, 404)
        if (event.filename && !event.message) return;
        errorBoundary.report(event.error || event.message, {
            source: 'window.onerror',
            file: event.filename,
            line: event.lineno,
            col: event.colno
        });
    });

    window.addEventListener('unhandledrejection', function (event) {
        var reason = event.reason;
        var msg = (reason && reason.message) ? reason.message : String(reason);
        errorBoundary.report(msg, {
            source: 'unhandledrejection'
        });
        // Prevent default browser logging (we handle it)
        event.preventDefault();
    });
})();
