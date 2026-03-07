/**
 * SANTIS OS - DOM HYDRATION ENGINE (BLOK F3)
 * Scans the DOM for `data-santis-bind` attributes and links them to the Reactive Store.
 */

(function initSantisHydrator() {
    if (window.SantisHydrator) return;

    console.log("💧 [SANTIS HYDRATOR] Initializing Headless DOM Reactivity...");

    // Object nested property resolver (e.g. 'pricing.value')
    function getNestedProperty(obj, path) {
        return path.split('.').reduce((prev, curr) => (prev && prev[curr] !== undefined) ? prev[curr] : null, obj);
    }

    /**
     * Injects a value into a DOM node based on its tag/type
     */
    function hydrateNode(node, value) {
        if (value === null || value === undefined) return;

        const tag = node.tagName.toLowerCase();

        // Handle images
        if (tag === 'img') {
            node.src = value;
            // Optionally clear the skeleton class when image loads
            node.onload = () => node.classList.remove('santis-skeleton');
            return;
        }

        // Handle specific attributes overrides if specified
        // (e.g. data-santis-attr="href" data-santis-bind="slug:url")
        const attrTarget = node.getAttribute('data-santis-attr');
        if (attrTarget) {
            node.setAttribute(attrTarget, value);
            return;
        }

        // Default: Text Content
        // We use innerHTML if the value explicitly contains HTML tags (danger scale)
        // or textContent for safe text injection.
        if (typeof value === 'string' && (value.includes('<') || value.includes('&'))) {
            node.innerHTML = value;
        } else {
            node.textContent = value;
        }

        // Remove loading skeletons
        node.classList.remove('santis-skeleton');
        node.classList.add('santis-hydrated');
    }

    window.SantisHydrator = {
        /**
         * Scans the document (or a specific root) and wire bindings.
         * Syntax: data-santis-bind="slug:property.path"
         */
        scan: function (root = document) {
            const bindNodes = root.querySelectorAll('[data-santis-bind]');

            if (bindNodes.length === 0) return;
            console.debug(`💧 [SANTIS HYDRATOR] Found ${bindNodes.length} reactive nodes. Securing bindings...`);

            // Group nodes by their Store Key (Slug)
            const bindingsMap = {};

            bindNodes.forEach(node => {
                const bindingDef = node.getAttribute('data-santis-bind');
                if (!bindingDef.includes(':')) {
                    console.warn(`💧 [SANTIS HYDRATOR] Invalid binding syntax: ${bindingDef}. Expected "slug:property"`);
                    return;
                }

                const [storeKey, propertyPath] = bindingDef.split(':');

                if (!bindingsMap[storeKey]) {
                    bindingsMap[storeKey] = [];
                }
                bindingsMap[storeKey].push({ node, propertyPath });
            });

            // Subscribe to each required store key
            Object.keys(bindingsMap).forEach(storeKey => {
                let initialPayload = null;

                // Subscribe to future updates
                window.SantisStore.subscribe(storeKey, (data) => {
                    const targets = bindingsMap[storeKey];
                    targets.forEach(target => {
                        const val = getNestedProperty(data, target.propertyPath);
                        hydrateNode(target.node, val);
                    });
                });

                // Immediately fetch from L1/L2 cache via the Bridge API if missing
                if (!window.SantisStore.get(storeKey)) {
                    // Trigger a fetch to Edge (will hit cache or network via Interceptor)
                    const tempUrl = `/assets/data/content/services/${storeKey}.json`;
                    fetch(tempUrl).catch(() => { }); // Fire and forget. SWR will populate Store.
                }
            });
        }
    };

    // Auto-scan on DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.SantisHydrator.scan());
    } else {
        window.SantisHydrator.scan();
    }

    // Expose a public API to trigger rescans later if Vue/React isn't handling it
    window.addEventListener('santis:dom-mutated', () => window.SantisHydrator.scan());

})();
