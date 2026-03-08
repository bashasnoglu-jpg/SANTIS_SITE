/**
 * SANTIS OS - THE QUANTUM EVENT BUS V1.0 (Enterprise Priority Queue)
 * Based on 'mitt' but with internal priority queuing, debouncing, and state awareness.
 * Used for orchestration of data, rendering, physics, and revenue events (like exit-intent).
 */

class SovereignEventBus {
    constructor() {
        this.all = new Map();
        this.history = new Set(); // To remember fired events like 'santis:rail-ready'
    }

    on(type, handler) {
        const handlers = this.all.get(type);
        if (handlers) {
            handlers.push(handler);
        } else {
            this.all.set(type, [handler]);
        }

        // If it's a lifecycle event that already fired, trigger immediately for late-binders
        if (type.startsWith('santis:') && type.endsWith('-ready') && this.history.has(type)) {
            handler({ _retroactive: true });
        }
    }

    off(type, handler) {
        const handlers = this.all.get(type);
        if (handlers) {
            if (handler) {
                handlers.splice(handlers.indexOf(handler) >>> 0, 1);
            } else {
                this.all.set(type, []);
            }
        }
    }

    emit(type, evt) {
        let handlers = this.all.get(type);
        if (handlers) {
            // Sort by priority if metadata exists (Priority 1 is highest)
            const sortedHandlers = [...handlers].sort((a, b) => {
                const pA = a.priority || 99;
                const pB = b.priority || 99;
                return pA - pB;
            });

            sortedHandlers.forEach(handler => handler(evt));
        }
        this.history.add(type);
    }

    // Debounce Helper for High-Frequency Triggering (like mouseleave or scroll)
    debounceEmit(type, evt, delay = 500) {
        if (!this._timers) this._timers = {};
        if (this._timers[type]) clearTimeout(this._timers[type]);

        this._timers[type] = setTimeout(() => {
            this.emit(type, evt);
        }, delay);
    }
}

// Global Singleton Setup
if (!window.SantisBus) {
    window.SantisBus = new SovereignEventBus();
    console.log("📡 [Sovereign Bus] Enterprise Priority Queue Orchestrator Online.");
}

export default window.SantisBus;
