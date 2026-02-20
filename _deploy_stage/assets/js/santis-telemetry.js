/**
 * SANTIS TELEMETRY ENGINE v1.0
 * ----------------------------
 * Privacy-first, lightweight event bus for "Conversion Machine" analytics.
 * Pushes structured events to window.dataLayer (GA4 standard).
 */

(function (window) {
    'use strict';

    const SantisTelemetry = {
        config: {
            debug: true, // Set to false in production via build process if needed
            scrollThresholds: [50, 90],
            trackedThresholds: new Set()
        },

        /**
         * Initialize the telemetry engine
         */
        init: function () {
            this.log('🚀 Santis Telemetry Initialized');
            this.trackPageView();
            this.initScrollTracking();
            this.initClickTracking();
        },

        /**
         * Core Event Pusher
         * @param {string} eventName - Snake_case event name (e.g., 'service_view')
         * @param {object} params - Additional event parameters
         */
        pushEvent: function (eventName, params = {}) {
            const eventData = {
                event: eventName,
                timestamp: new Date().toISOString(),
                page_path: window.location.pathname,
                lang: (window.SITE_LANG || 'tr').toLowerCase(),
                ...params
            };

            // 1. Push to DataLayer (GTM/GA4)
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push(eventData);

            // 2. Console Debug (if enabled)
            if (this.config.debug) {
                console.groupCollapsed(`📊 [Telemetry] ${eventName}`);
                console.log(eventData);
                console.groupEnd();
            }
        },

        /**
         * Track Page View (Virtual or Real)
         */
        trackPageView: function () {
            // Determine page type
            let pageType = 'other';
            const path = window.location.pathname;

            if (path === '/' || path.includes('index.html')) pageType = 'home';
            else if (path.includes('masaj') || path.includes('massage')) pageType = 'massage_detail';
            else if (path.includes('hamam') || path.includes('hammam')) pageType = 'hammam_detail';
            else if (path.includes('cilt') || path.includes('skincare')) pageType = 'skincare_detail';

            this.pushEvent('page_view_santis', {
                page_type: pageType,
                page_title: document.title
            });
        },

        /**
         * Scroll Depth Tracking
         */
        initScrollTracking: function () {
            let maxScroll = 0;
            const _this = this;

            window.addEventListener('scroll', this.throttle(function () {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = Math.round((scrollTop / docHeight) * 100);

                _this.config.scrollThresholds.forEach(threshold => {
                    if (scrollPercent >= threshold && !_this.config.trackedThresholds.has(threshold)) {
                        _this.config.trackedThresholds.add(threshold);
                        _this.pushEvent('scroll_depth', {
                            depth: threshold + '%',
                            page_height: docHeight
                        });
                    }
                });
            }, 500));
        },

        /**
         * Automated Click Tracking for annotated elements
         * Add 'data-track="intent_name"' to any HTML element to track it.
         */
        initClickTracking: function () {
            document.addEventListener('click', (e) => {
                const target = e.target.closest('[data-track]');
                if (target) {
                    const intent = target.getAttribute('data-track');
                    const label = target.getAttribute('data-track-label') || target.innerText;

                    this.pushEvent('ui_interaction', {
                        action: 'click',
                        intent: intent,
                        label: label.substring(0, 50) // Truncate long text
                    });
                }
            });
        },

        /**
         * Utility: Throttle function
         */
        throttle: function (func, limit) {
            let inThrottle;
            return function () {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            }
        },

        /**
         * Internal logger
         */
        log: function (msg) {
            if (this.config.debug) console.log(`%c [Telemetry] ${msg}`, 'color: #9b59b6; font-weight: bold;');
        }
    };

    // Expose to window
    window.SantisTelemetry = SantisTelemetry;

    // Optional: Auto-init if not deferred
    // SantisTelemetry.init(); 

})(window);
