// assets/js/core/santis-neural-state.js
// SDCR V63.0 - SOVEREIGN NEURAL STATE (Zero-vDOM Liquid Memory)

(function () {
    if (window.SovereignState) return;

    // The raw data structure
    const stateCore = {
        revenue: { mrr: 0 },
        metrics: { active_users: 0, friction: 0 },
        system: { status: 'ONLINE' }
    };

    // Apoptosis-safe requestAnimationFrame throttling
    let rafQueue = new Set();
    let isTicking = false;

    const tick = () => {
        isTicking = false;
        rafQueue.forEach(key => {
            const val = getNestedValue(stateCore, key);
            const elements = document.querySelectorAll(`[data-neural="${key}"]`);
            
            elements.forEach(node => {
                // Formatting Intelligence
                let formattedVal = val;
                const format = node.getAttribute('data-format');
                if (format === 'currency') {
                    formattedVal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
                } else if (format === 'number') {
                    formattedVal = new Intl.NumberFormat('en-US').format(val);
                }

                // Node Type Check
                if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
                    if (node.value !== String(formattedVal)) node.value = String(formattedVal);
                } else {
                    if (node.textContent !== String(formattedVal)) node.textContent = String(formattedVal);
                }
            });
        });
        rafQueue.clear();
    };

    const scheduleUpdate = (path) => {
        rafQueue.add(path);
        if (!isTicking) {
            isTicking = true;
            requestAnimationFrame(tick);
        }
    };

    function getNestedValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    // The Recursive Proxy Handler
    const handler = (path = '') => ({
        get(target, property) {
            if (typeof target[property] === 'object' && target[property] !== null) {
                return new Proxy(target[property], handler(path ? `${path}.${property}` : property));
            }
            return target[property];
        },
        set(target, property, value) {
            target[property] = value;
            const fullPath = path ? `${path}.${property}` : property;
            scheduleUpdate(fullPath);
            return true;
        }
    });

    // Generate the Liquid Proxy
    window.SovereignState = new Proxy(stateCore, handler());

    // Auto-Hydration Method (Amnesia Firewall)
    window.SovereignState.hydrate = () => {
        const nodes = document.querySelectorAll('[data-neural]');
        nodes.forEach(node => {
            const path = node.getAttribute('data-neural');
            scheduleUpdate(path);
        });
    };

    // Auto-Hydrate when the Router changes views
    document.addEventListener('santis:route-changed', () => {
        console.log("🧬 [NEURAL STATE] Kuantum Boyut Değişti. Amnesia Kalkanı Aktif (Auto-Hydrating).");
        window.SovereignState.hydrate();
    });

    console.log("🧠 [NEURAL STATE] Sıfır-vDOM Likit Hafıza (Proxy Tracker) Çevrimiçi.");
})();
