/**
 * SANTIS OS — Event Bus v1.0
 * Loose coupling pub-sub pattern for module communication.
 * Phase 2 Modularization (2026.02.14)
 */
(function () {
    'use strict';

    const _listeners = {};

    window.EventBus = {
        /**
         * Subscribe to an event.
         * @param {string} event - Event name (e.g. "audit:completed")
         * @param {Function} handler - Callback function
         */
        on: function (event, handler) {
            if (!_listeners[event]) _listeners[event] = [];
            _listeners[event].push(handler);
        },

        /**
         * Unsubscribe from an event.
         */
        off: function (event, handler) {
            if (!_listeners[event]) return;
            _listeners[event] = _listeners[event].filter(h => h !== handler);
        },

        /**
         * Emit an event with optional data.
         * @param {string} event - Event name
         * @param {*} data - Payload
         */
        emit: function (event, data) {
            if (!_listeners[event]) return;
            _listeners[event].forEach(handler => {
                try {
                    handler(data);
                } catch (e) {
                    console.error(`[EventBus] Error in handler for "${event}":`, e);
                }
            });
        },

        /**
         * Subscribe once — handler auto-removes after first call.
         */
        once: function (event, handler) {
            const wrapper = function (data) {
                handler(data);
                window.EventBus.off(event, wrapper);
            };
            this.on(event, wrapper);
        }
    };

    console.log('🔌 [Core] EventBus v1.0 loaded');
})();
