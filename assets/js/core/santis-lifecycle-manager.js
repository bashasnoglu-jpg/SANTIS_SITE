/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🧠 SANTIS OS v4 — LIFECYCLE GOVERNANCE BLUEPRINT          ║
 * ║  Deterministic Registry for Intervals, Observers & Teardowns║
 * ╚══════════════════════════════════════════════════════════════╝
 */

class SantisLifecycleManager {
    constructor() {
        // Registries
        this._intervals = new Map();
        this._observers = new Map();
        this._teardowns = new Map();

        // Scope Indexing for fast scope-based teardowns
        this._scopes = {
            intervals: new Map(), // scopeName -> Set<id>
            observers: new Map(), // scopeName -> Set<id>
            teardowns: new Map()  // scopeName -> Set<id>
        };

        console.log("🛡️ [Santis Lifecycle] Governance Engine Initialized.");
    }

    // --- HELPER: Index by Scope ---
    _addToScope(type, scope, id) {
        if (!scope) return;
        if (!this._scopes[type].has(scope)) {
            this._scopes[type].set(scope, new Set());
        }
        this._scopes[type].get(scope).add(id);
    }

    _removeFromScope(type, scope, id) {
        if (!scope || !this._scopes[type].has(scope)) return;
        this._scopes[type].get(scope).delete(id);
    }

    // --- INTERVAL MANAGEMENT ---
    registerInterval(id, callback, ms, options = {}) {
        if (!id || typeof callback !== 'function') return null;

        this.clearInterval(id); // Ensure no duplicate leaks

        const timerId = setInterval(callback, ms);
        const record = { id, timerId, ms, scope: options.scope || 'GLOBAL' };

        this._intervals.set(id, record);
        this._addToScope('intervals', record.scope, id);

        return timerId;
    }

    clearInterval(id) {
        if (this._intervals.has(id)) {
            const record = this._intervals.get(id);
            clearInterval(record.timerId);
            this._removeFromScope('intervals', record.scope, id);
            this._intervals.delete(id);
        }
    }

    clearAllIntervals(targetScope = null) {
        if (targetScope) {
            const scopeSet = this._scopes.intervals.get(targetScope);
            if (scopeSet) {
                // clone set to avoid iteration issues during deletion
                const idsToClear = Array.from(scopeSet);
                idsToClear.forEach(id => this.clearInterval(id));
            }
        } else {
            // clear all
            const allIds = Array.from(this._intervals.keys());
            allIds.forEach(id => this.clearInterval(id));
        }
    }

    // --- OBSERVER MANAGEMENT ---
    registerObserver(id, observer, options = {}) {
        if (!id || !observer) return null;

        this.disconnectObserver(id);

        const record = { id, observer, scope: options.scope || 'GLOBAL' };
        this._observers.set(id, record);
        this._addToScope('observers', record.scope, id);

        return observer;
    }

    disconnectObserver(id) {
        if (this._observers.has(id)) {
            const record = this._observers.get(id);
            if (record.observer && typeof record.observer.disconnect === 'function') {
                record.observer.disconnect();
            } else if (record.observer && typeof record.observer.kill === 'function') {
                // GSAP Observer fallback
                record.observer.kill();
            }
            this._removeFromScope('observers', record.scope, id);
            this._observers.delete(id);
        }
    }

    disconnectAllObservers(targetScope = null) {
        if (targetScope) {
            const scopeSet = this._scopes.observers.get(targetScope);
            if (scopeSet) {
                const idsToClear = Array.from(scopeSet);
                idsToClear.forEach(id => this.disconnectObserver(id));
            }
        } else {
            const allIds = Array.from(this._observers.keys());
            allIds.forEach(id => this.disconnectObserver(id));
        }
    }

    // --- TEARDOWN MANAGEMENT ---
    registerTeardown(id, fn, options = {}) {
        if (!id || typeof fn !== 'function') return false;

        const record = { id, fn, scope: options.scope || 'GLOBAL' };
        this._teardowns.set(id, record);
        this._addToScope('teardowns', record.scope, id);
        return true;
    }

    executeTeardown(id) {
        if (this._teardowns.has(id)) {
            const record = this._teardowns.get(id);
            try {
                record.fn();
            } catch (e) {
                console.error(`[Lifecycle] Teardown failed for ${id}:`, e);
            }
            this._removeFromScope('teardowns', record.scope, id);
            this._teardowns.delete(id);
        }
    }

    teardownScope(targetScope = null) {
        if (targetScope) {
            const scopeSet = this._scopes.teardowns.get(targetScope);
            if (scopeSet) {
                const idsToClear = Array.from(scopeSet);
                idsToClear.forEach(id => this.executeTeardown(id));
            }
            // Chain clear observers and intervals in this scope
            this.clearAllIntervals(targetScope);
            this.disconnectAllObservers(targetScope);

            console.log(`[Lifecycle] Scope '${targetScope}' has been torn down.`);
        } else {
            const allIds = Array.from(this._teardowns.keys());
            allIds.forEach(id => this.executeTeardown(id));
            this.clearAllIntervals();
            this.disconnectAllObservers();
            console.log(`[Lifecycle] All scopes have been torn down.`);
        }
    }

    // --- DIAGNOSTICS ---
    getDiagnostics() {
        const scopesIntervals = {};
        for (const [k, v] of this._scopes.intervals.entries()) scopesIntervals[k] = v.size;

        const scopesObservers = {};
        for (const [k, v] of this._scopes.observers.entries()) scopesObservers[k] = v.size;

        const scopesTeardowns = {};
        for (const [k, v] of this._scopes.teardowns.entries()) scopesTeardowns[k] = v.size;

        return {
            activeIntervals: this._intervals.size,
            activeObservers: this._observers.size,
            activeTeardowns: this._teardowns.size,
            scopes: {
                intervals: scopesIntervals,
                observers: scopesObservers,
                teardowns: scopesTeardowns
            }
        };
    }
}

// Expose Single Instance
window.SantisLifecycle = new SantisLifecycleManager();
