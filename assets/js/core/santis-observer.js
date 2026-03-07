/**
 * ════════════════════════════════════════════════════════════════
 * SANTIS CORE OBSERVER v1.2 — Sovereign Shadow Lab Edition
 * ════════════════════════════════════════════════════════════════
 *
 * Zero-Leak, High-Performance Entity Tracking.
 * Mega Rapor Bulgu #2 (Observer sızıntısı) ve #9 (IntersectionObserver)
 * çözümü olarak tasarlandı.
 *
 * API:
 *   SantisObserver.init(threshold)  — başlat / yeniden başlat
 *   SantisObserver.observe(el)      — element izlemeye al
 *   SantisObserver.clear()          — tüm izlemeyi bırak + bellek temizle
 *   SantisObserver.status()         — { tracked, active } diagnostik
 *
 * Entegrasyon:
 *   - window.triggerPulse()  → Canvas Pulse tetikler
 *   - window.SantisEventBus → entity_discovered event yayını
 *
 * @since v12.2 (Sovereign Recovery)
 */
const SantisObserver = (() => {
    "use strict";

    let _observer = null;
    const _seen = new Set();
    let _onDiscover = null;
    let _initialized = false; // Singleton guard

    /**
     * Initialize or reinitialize the observer.
     * Calling this again safely disconnects the previous instance.
     * @param {number} threshold — visibility ratio (0.0–1.0)
     * @param {Function} [onDiscover] — optional callback(id, el)
     */
    const init = (threshold = 0.3, onDiscover = null) => {
        // Singleton guard — prevent re-init loop
        if (_initialized && _observer) {
            return;
        }

        // Clean up previous instance (prevents memory leak)
        if (_observer) {
            _observer.disconnect();
            _observer = null;
        }

        _onDiscover = onDiscover;

        _observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const el = entry.target;
                const id = el.dataset.id || el.id || `anon_${Math.random().toString(36).substr(2, 8)}`;

                if (_seen.has(id)) return;
                _seen.add(id);

                const score = parseFloat(el.dataset.score) || 1;

                if (typeof _onDiscover === "function") {
                    _onDiscover(id, el, score);
                }

                if (typeof window.triggerPulse === "function") {
                    window.triggerPulse();
                }

                if (window.SantisEventBus && typeof window.SantisEventBus.publish === "function") {
                    window.SantisEventBus.publish("entity_discovered", {
                        id,
                        type: el.dataset.type || "unknown",
                        score
                    });
                }

                _observer.unobserve(el);
            });
        }, {
            threshold: Math.max(0, Math.min(1, threshold)),
            rootMargin: "50px 0px"
        });

        _initialized = true;
        console.log(`🦅 SantisObserver: initialized (threshold=${threshold}, rootMargin=50px)`);
    };

    /**
     * Begin observing an element.
     * @param {HTMLElement} el
     */
    const observe = (el) => {
        if (!_observer) {
            console.warn("🦅 SantisObserver: call init() before observe()");
            return;
        }
        if (!el || !(el instanceof HTMLElement)) return;
        _observer.observe(el);
    };

    /**
     * Observe all matching elements.
     * @param {string} selector — CSS selector
     * @param {HTMLElement} [root=document] — search root
     */
    const observeAll = (selector, root = document) => {
        const els = root.querySelectorAll(selector);
        els.forEach(el => observe(el));
        return els.length;
    };

    /**
     * Disconnect observer and clear tracked set.
     * Safe to call multiple times.
     */
    const clear = () => {
        if (_observer) {
            _observer.disconnect();
        }
        // Note: _seen preserved to avoid re-triggering discoveries
    };

    /** Full clear including seen set — use for actual resets only */
    const fullClear = () => {
        _seen.clear();
        if (_observer) {
            _observer.disconnect();
        }
        _initialized = false;
        console.log("🧹 SantisObserver: full reset, memory cleared.");
    };

    /**
     * Full teardown — disconnect, clear, nullify.
     * Use when navigating away or destroying a view.
     */
    const destroy = () => {
        fullClear();
        _observer = null;
        _onDiscover = null;
        _initialized = false;
        console.log("💀 SantisObserver: destroyed.");
    };

    /**
     * Diagnostic status.
     * @returns {{ tracked: number, active: boolean }}
     */
    const status = () => ({
        tracked: _seen.size,
        active: _observer !== null
    });

    // Public API
    return Object.freeze({
        init,
        observe,
        observeAll,
        clear,
        fullClear,
        destroy,
        status
    });
})();

// Make available globally
if (typeof window !== "undefined") {
    window.SantisObserver = SantisObserver;
}
