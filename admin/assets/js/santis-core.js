/**
 * SANTIS OS - CORE ENGINE v1 (Hardened Edition)
 * Phases 8.1 + 8.2 + 8.3
 * Architecture: State-Driven, Zero-Leak Enforcement, Elite Lifecycle, Priority Scheduler
 */

// ==========================================
// A. MINI SCHEDULER (Priority System)
// ==========================================
class Scheduler {
  static post(task, priority = 'low') {
    if (priority === 'high') {
      // 🔴 HIGH: Immediate UI updates, Input handling
      queueMicrotask(task);
    } else if (priority === 'medium') {
      // 🟡 MEDIUM: Socket updates, Smooth Transitions
      requestAnimationFrame(task);
    } else {
      // 🟢 LOW: Analytics, Pre-fetching, Background Sync
      if (window.requestIdleCallback) {
          window.requestIdleCallback(task);
      } else {
          setTimeout(task, 0);
      }
    }
  }

  static safeRender(fn) {
    if (this._locked) return;
    this._locked = true;
    requestAnimationFrame(() => {
      fn();
      this._locked = false;
    });
  }
}
Scheduler._locked = false;

// ==========================================
// B. STATE LAYER (Strict Unsubscribe + Scheduler)
// ==========================================
class State {
  constructor() {
    this.store = {};
    this.subscribers = {};
  }

  subscribe(key, fn) {
    if (!this.subscribers[key]) {
      this.subscribers[key] = new Set();
    }
    
    this.subscribers[key].add(fn);

    // Immediate emit if state exists
    if (this.store[key] !== undefined) {
      fn(this.store[key]);
    }
    
    // Return explicit unsubscribe function
    return () => {
      this.subscribers[key].delete(fn);
    };
  }

  set(key, value) {
    this.store[key] = value;
    // Route state updates through medium priority scheduler (AnimationFrame)
    // Ensures we don't block the main thread with too many simultaneous socket updates
    if (this.subscribers[key]) {
        Scheduler.post(() => {
             this.subscribers[key].forEach(fn => fn(value));
        }, 'medium');
    }
  }

  get(key) {
    return this.store[key];
  }
}

// ==========================================
// C. CORE LAYER (Lifecycle Enforcement)
// ==========================================
class SantisCore {
  constructor() {
    this.state = new State();
    this.modules = new Map();
    this.activeModule = null;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnect = 5;
    
    // Router config
    this.routes = {
        "/admin/boardroom.html": "boardroom",
        "/admin/command-center.html": "command_center",
        "/admin/gods-eye-vision.html": "gods_eye",
        "/admin/index.html": "hub",
        "/admin/": "hub",
        "/admin": "hub"
    };
    
    // Global Error & Memory Leak Monitor
    window.addEventListener('unhandledrejection', this.handleCoreError.bind(this));

    // Zero-Drift Seal: Expose as global for SSE consumer
    window.SantisCore = this;
    this.injectZeroDriftStyles();
  }

  injectZeroDriftStyles() {
    const style = document.createElement('style');
    style.id = 'santis-zero-drift-styles';
    style.textContent = `
        @keyframes gold-flash-anim {
            0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
            30% { box-shadow: 0 0 30px 5px rgba(212, 175, 55, 0.6); border-color: rgba(212, 175, 55, 0.8); }
            100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
        }
        .gold-flash {
            animation: gold-flash-anim 1s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            z-index: 50;
        }
    `;
    document.head.appendChild(style);
  }

  // ----------------------------------------
  // State Enforcement Proxy
  // ----------------------------------------
  subscribe(key, fn) {
    // 1. Core Subscribe
    const unsub = this.state.subscribe(key, fn);

    // 2. Tie it to Active Module (Zero-Leak Enforcement)
    if (this.activeModule) {
       this.activeModule.__subscriptions.push(unsub);
    }

    return unsub;
  }

  setState(key, value) {
      this.state.set(key, value);
  }
  
  getState(key) {
      return this.state.get(key);
  }

  // ----------------------------------------
  // Zero-Drift Strategy Feedback Loop
  // ----------------------------------------
  async rehydrate() {
    console.log('♻️ [Santis Core] Rehydrating state from Sovereign Kernel...');
    try {
        const response = await fetch('/api/v1/core-state');
        if (response.ok) {
            const data = await response.json();
            // CoreState flattening or deep injection logic
            Object.entries(data).forEach(([key, value]) => {
                this.setState(key, value);
            });
            
            // Explicitly sync metrics if present
            if (data.revenue) {
                this.setState('metrics', {
                    revenueToday: data.revenue.today,
                    abandonRisk: (data.sessions || {}).conversionRisk === 'high' ? 0.8 : 0.1
                });
            }

            console.log('✅ [Santis Core] Sovereign State synchronized.');
        }
    } catch (e) {
        console.error('Rehydration failed:', e);
    }
  }

  triggerVisualFeedback(scope) {
    // 1. Emit Global Event for specific modules
    const event = new CustomEvent('santis:visual-feedback', { detail: { scope } });
    window.dispatchEvent(event);

    // 2. Apply Gold-Flash to relevant UI markers
    let target = null;
    if (scope === 'revenue' || scope === 'revenue_update') {
        target = document.getElementById('global-revenue') || document.querySelector('.bento-card[data-revenue]');
    } else if (scope === 'core_state' || scope === 'risk_signal') {
        target = document.getElementById('santis-focus-card') || document.getElementById('score-radar-panel');
    } else if (scope === 'strategy' || scope === 'strategy_apply_ack') {
        target = document.getElementById('sovereign-insights');
    }

    if (target) this.applyGoldFlash(target);
  }

  applyGoldFlash(el) {
    if (!el) return;
    el.classList.add('gold-flash');
    setTimeout(() => el.classList.remove('gold-flash'), 1000);
  }

  // ----------------------------------------
  // Socket Layer
  // ----------------------------------------
  initSocket(url) {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      Scheduler.post(() => {
          console.log('🔥 [Santis Core] V8 Socket Connected');
      }, 'high');
      this.reconnectAttempts = 0;
      this.setState('networkStatus', 'online');
    };

    this.socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.key && data.value) {
            this.setState(data.key, data.value);
        } else if (data.type) {
            this.setState('__WS_MSG', data);
        }
      } catch (err) {
        console.error('Socket Parse Error:', err);
      }
    };

    this.socket.onclose = () => {
      this.setState('networkStatus', 'offline');
      this.handleSocketReconnect(url);
    };
  }

  handleSocketReconnect(url) {
    if (this.reconnectAttempts < this.maxReconnect) {
      this.reconnectAttempts++;
      const timeout = Math.pow(2, this.reconnectAttempts) * 1000;
      console.warn(`[Santis Core] Socket lost. Reconnecting in ${timeout}ms...`);
      setTimeout(() => this.initSocket(url), timeout);
    } else {
      console.error('[Santis Core] Socket dead. Max attempts reached.');
    }
  }

  // ----------------------------------------
  // Lifecycle Registry & Execution
  // ----------------------------------------
  registerModule(name, moduleClass) {
    this.modules.set(name, moduleClass);
  }

  async loadDynamicModule(name) {
    if(!this.modules.has(name)) {
       try {
           console.log(`[Santis Core] Fetching blueprint: ${name}.js...`);
           const mod = await import(`/admin/modules/${name}.js`);
           if(mod.default) {
               this.registerModule(name, mod.default);
           } else if (mod.mount) {
               // Support functional ES6 modules like command_center.js
               this.registerModule(name, mod);
           }
       } catch(e) {
           console.error(`Dynamic import failed for ${name}:`, e);
       }
    }
  }

  async loadModule(name, containerSelector = '#santis-master-viewport') {
    const container = document.querySelector(containerSelector);
    if (!container) throw new Error('Master viewport not found');
    
    // Transition OUT
    container.classList.remove('opacity-100');
    container.classList.add('opacity-0');
    await new Promise(r => setTimeout(r, 150));

    // ==========================================
    // 1. OLD MODULE EXECUTION (Clean Kill)
    // ==========================================
    if (this.activeModule) {
      // Strict Cleanup
      if (typeof this.activeModule.__cleanup === 'function') {
          this.activeModule.__cleanup();
      }
      if (typeof this.activeModule.unmount === 'function') {
          this.activeModule.unmount();
      }
      if (this.activeModule.abortController) {
          this.activeModule.abortController.abort();
      }
      this.activeModule = null;
    }

    // ==========================================
    // 2. NEW MODULE INIT (Guarded Setup)
    // ==========================================
    await this.loadDynamicModule(name);
    const ModuleClass = this.modules.get(name);
    if (!ModuleClass) {
      container.innerHTML = `<div class="p-8 text-red-500 font-mono">Kernel Error: Component ${name} missing.</div>`;
      container.classList.remove('opacity-0');
      container.classList.add('opacity-100');
      throw new Error(`Module ${name} not registered`);
    }

    let module;
    if (typeof ModuleClass === 'function' && ModuleClass.prototype && typeof ModuleClass.prototype.mount === 'function') {
        module = new ModuleClass(this); 
    } else {
        // Universal Wrapper for Functional Modules
        module = {
            render: typeof ModuleClass.render === 'function' ? ModuleClass.render : () => '',
            mount: async () => {
                const innerContainer = document.querySelector(containerSelector);
                if (ModuleClass.mount) await ModuleClass.mount(innerContainer, this);
            },
            unmount: typeof ModuleClass.unmount === 'function' ? ModuleClass.unmount : () => {}
        };
    }
    
    // 🔥 Lifecycle tracking injection (Engine enforces this, module cannot skip)
    module.__subscriptions = [];
    module.__cleanup = () => {
      module.__subscriptions.forEach(unsub => unsub());
      module.__subscriptions = [];
    };
    module.__mounted = false;
    module.abortController = new AbortController();

    this.activeModule = module;

    // ==========================================
    // 3. RENDER & MOUNT (High Priority)
    // ==========================================
    container.innerHTML = typeof module.render === 'function' ? module.render() : '';
    
    if (typeof module.mount === 'function') {
      Scheduler.post(async () => {
          // Double Mount Guard
          if (module.__mounted) return;
          module.__mounted = true;

          // Dead Module Protection wrapper context for inner module logic
          module.isAlive = () => this.activeModule === module;

          await module.mount();
      }, 'high');
    }

    console.log(`🚀 [Santis OS] Node Online: ${name}`);
    
    // Transition IN
    requestAnimationFrame(() => {
        container.classList.remove('opacity-0');
        container.classList.add('opacity-100', 'transition-opacity', 'duration-300');
    });
  }

  async navigate(url) {
      if (window.location.pathname === url) return; // Anti-spam
      window.history.pushState({}, "", url);
      await this.handleRoute();
  }

  async handleRoute() {
      const path = window.location.pathname;
      const moduleName = this.routes[path] || this.routes["/admin"] || "boardroom";
      
      // Infinite Loop & Double Load Guardian
      if (this._currentModule === moduleName) return;
      this._currentModule = moduleName;

      await this.loadModule(moduleName);
  }

  init() {
      document.body.addEventListener("click", e => {
          // Priority routing override
          const link = e.target.closest("[data-link]");
          if (link) {
              e.preventDefault();
              const url = link.getAttribute("href");
              if (url && url !== "#") Scheduler.post(() => this.navigate(url), 'high');
          } else {
              const aTAG = e.target.closest("a");
              if (aTAG && aTAG.href && aTAG.origin === window.location.origin && aTAG.target !== "_blank") {
                  const urlPath = new URL(aTAG.href).pathname;
                  if (urlPath.startsWith("/admin/") || urlPath === "/admin") {
                      if (this.routes[urlPath] || urlPath === "/admin" || urlPath === "/admin/") {
                          e.preventDefault();
                          Scheduler.post(() => this.navigate(urlPath), 'high');
                      }
                  }
              }
          }
      });

      window.addEventListener("popstate", () => this.handleRoute());
      this.handleRoute();
  }

  handleCoreError(event) {
    if (event.reason && event.reason.name === 'AbortError') {
        event.preventDefault(); // Tarayıcının kırmızı "Uncaught (in promise)" logunu basmasını kesin olarak engelle
        return; 
    }
    console.error('[Santis OS Panic]', event.reason);
  }
}

// Global Singleton Instance
export const Engine = new SantisCore();

// Exporting Scheduler for potential module usage
export { Scheduler };

// Legacy Namespace Compatibility
window.SantisState = {
    subscribe: (key, fn) => Engine.subscribe(key, fn),
    set: (prop, val) => Engine.setState(prop, val),
    get: (prop) => Engine.getState(prop)
};

// Start OS
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        const wsScheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        Engine.initSocket(`${wsScheme}//${window.location.host}/ws`);
        Engine.init();
    });
} else {
    const wsScheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    Engine.initSocket(`${wsScheme}//${window.location.host}/ws`);
    Engine.init();
}

// ════════════════════════════════════════════════════════════
// ⚡ SOVEREIGN CORE BOOTSTRAP — Phase 54-61
// Bu blok Admin panelinin garantili ES modülünden çalışır.
// Promise.allSettled: bir modül fail etse diğerleri yüklenir.
// ════════════════════════════════════════════════════════════
const SOVEREIGN_CORE_MODULES = [
    '/assets/js/core/santis-governance-engine.js',
    '/assets/js/core/santis-phygital-bridge.js',
    '/assets/js/core/santis-vocal-dna.js',
    '/assets/js/core/santis-semantic-engine.js',
    '/assets/js/core/santis-edge-pipeline.js',
    '/assets/js/core/santis-live-feed.js',
];

Promise.allSettled(
    SOVEREIGN_CORE_MODULES.map(src =>
        import(src).catch(err => console.warn(`⚠️ [Sovereign Bootstrap] ${src} yüklenemedi:`, err))
    )
).then(results => {
    const loaded = results.filter(r => r.status === 'fulfilled').length;
    console.log(`⚡ [Sovereign Bootstrap] ${loaded}/${SOVEREIGN_CORE_MODULES.length} modül yüklendi.`);
});

