/**
 * SANTIS RUNTIME ENGINE (Master Core - v2)
 * The Single Shell Architecture Execution Controller
 */

// 1. Singleton Guard
if (window.__SANTIS_BOOTED__) {
    console.warn("🛡️ [Santis Runtime] Boot prevented. System already active.");
} else {
    window.__SANTIS_BOOTED__ = true;

    console.log("🚀 [Santis Runtime] Boot sequence initiated (Single Shell).");

    // Initialize the Santis State Engine (Cortex) globally
    import('./santis-state.js').then(({ SantisState, StateObserver }) => {
        window.SantisState = SantisState;
        window.StateObserver = StateObserver;
        console.log("🧠 [State Engine] Cortex Active globally.");
    }).catch(err => {
        console.error("🚨 [State Engine] Failed to mount Cortex:", err);
    });

    // 2. Execution Controller & Module Cache
    window.SantisRuntime = {
        currentModule: null,
        cache: {},
        routes: {
            "/admin/boardroom.html": "boardroom",
            "/admin/command-center.html": "command_center",
            "/admin/gods-eye-vision.html": "gods_eye",
            "/admin/index.html": "hub",
            "/admin/": "hub",
            "/admin": "hub" // Default Route
        },

        async load(name) {
            if (!this.cache[name]) {
                try {
                    console.log(`📡 [Santis Runtime] Fetching module: ${name}`);
                    const module = await import(`/admin/modules/${name}.js`);
                    this.cache[name] = module;
                } catch (err) {
                    console.error(`🚨 [Santis Runtime] Failed to load module ${name}:`, err);
                    return null;
                }
            }
            return this.cache[name];
        },

        async run(moduleName, ctx = {}) {
            const viewport = document.getElementById('santis-master-viewport');
            if (!viewport) {
                console.error("🚨 [Santis Runtime] Fatal: #santis-master-viewport not found.");
                return;
            }

            // A. "Quiet Luxury" Transition OUT
            viewport.classList.remove('opacity-100');
            viewport.classList.add('opacity-0');
            
            // Allow 150ms for fade out transition
            await new Promise(resolve => setTimeout(resolve, 150));

            // B. Unmount previous module safely (Memory Leak Prevention)
            if (this.currentModule && this.currentModule.unmount) {
                try {
                    console.log(`🧹 [Santis Runtime] Unmounting previous view...`);
                    await this.currentModule.unmount();
                } catch (e) {
                    console.error("🚨 [Santis Runtime] Unmount execution failed:", e);
                }
            }

            // Cleanup any global DOM intervals/listeners strictly tied to views
            // (Note: Core services like WebSocket, V8, and Worker Fabric are persistent)

            // C. Load new module
            const module = await this.load(moduleName);
            if (!module) {
                viewport.innerHTML = `<div class="p-8 text-red-500 font-mono">MODULE NOT FOUND: ${moduleName}</div>`;
                viewport.classList.remove('opacity-0');
                viewport.classList.add('opacity-100');
                return;
            }

            this.currentModule = module;

            // D. Execute Mount
            if (module.mount) {
                try {
                    console.log(`⚡ [Santis Runtime] Mounting ${moduleName}...`);
                    await module.mount(viewport, ctx);
                } catch (e) {
                    console.error(`🚨 [Santis Runtime] Mount execution failed for ${moduleName}:`, e);
                }
            }

            // E. "Quiet Luxury" Transition IN
            requestAnimationFrame(() => {
                viewport.classList.remove('opacity-0');
                viewport.classList.add('opacity-100', 'transition-opacity', 'duration-300');
            });
        },

        navigate(url) {
            // Update URL
            window.history.pushState({}, "", url);
            this.handleRoute();
        },

        handleRoute() {
            const path = window.location.pathname;
            const moduleName = this.routes[path] || this.routes["/admin"] || "boardroom";
            this.run(moduleName);
        },

        init() {
            // Intercept clicks on links inside the Master Shell
            document.body.addEventListener("click", e => {
                const link = e.target.closest("[data-link]");
                
                if (link) {
                    e.preventDefault();
                    const url = link.getAttribute("href");
                    if (url && url !== "#") {
                        this.navigate(url);
                    }
                } else {
                    // Fallback for legacy links without data-link (prevent refresh if internal /admin/ without target="_blank")
                    const aTAG = e.target.closest("a");
                    if (aTAG && aTAG.href && aTAG.origin === window.location.origin && aTAG.target !== "_blank") {
                        const urlPath = new URL(aTAG.href).pathname;
                        if (urlPath.startsWith("/admin/") || urlPath === "/admin") {
                            // Only intercept if we have a mapped route for it
                            if (this.routes[urlPath] || urlPath === "/admin" || urlPath === "/admin/") {
                                e.preventDefault();
                                this.navigate(urlPath);
                            }
                        }
                    }
                }
            });

            // Handle back/forward arrows (popstate)
            window.addEventListener("popstate", () => {
                this.handleRoute();
            });

            // Initial Route
            this.handleRoute();
        }
    };

    // Initialize Router Strategy once DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            window.SantisRuntime.init();
        });
    } else {
        window.SantisRuntime.init();
    }
}
