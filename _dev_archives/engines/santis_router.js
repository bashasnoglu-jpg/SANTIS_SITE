/**
 * SANTIS OMNI-OS - EDGE ROUTER (v5.0)
 * Handles Path parsing, Subdomain checking, and URL Param routing for Multi-Hotel environments.
 */

window.SantisRouter = window.SantisRouter || {};
Object.assign(window.SantisRouter, {
    hotelSlug: null,

    parse() {
        // 1. Try Subdomain (e.g., akra.santis.com)
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        if (parts.length > 2 && parts[0] !== 'www') {
            const possibleSlug = parts[0];
            // Filter local dev hosts like 127.0.0.1 or localhost
            if (possibleSlug !== '127' && possibleSlug !== 'localhost') {
                this.hotelSlug = possibleSlug;
                console.log(`[Omni-OS Router] Detected Subdomain Hotel: ${this.hotelSlug}`);
            }
        }

        // 2. Try URL Params fallback (?hotel=akra)
        if (!this.hotelSlug) {
            const params = new URLSearchParams(window.location.search);
            this.hotelSlug = params.get("hotel");
            if (this.hotelSlug) {
                console.log(`[Omni-OS Router] Detected Param Hotel: ${this.hotelSlug}`);
            }
        }

        // 3. Try Path routing (/akra/)
        if (!this.hotelSlug) {
            const pathSegments = window.location.pathname.split('/').filter(p => p !== '');
            // Simple generic catch if the first path is neither tr nor en nor assets
            if (pathSegments.length > 0) {
                const firstSegment = pathSegments[0];
                if (!['tr', 'en', 'components', 'data', 'assets'].includes(firstSegment) && !firstSegment.endsWith('.html')) {
                    this.hotelSlug = firstSegment;
                    console.log(`[Omni-OS Router] Detected Path Hotel: ${this.hotelSlug}`);
                }
            }
        }

        return this.hotelSlug;
    },

    getIdentifiedSlug() {
        return this.hotelSlug || "default";
    }
});

SantisRouter.parse();
