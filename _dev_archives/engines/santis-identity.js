/**
 * Santis Identity V1 (Sovereign Fingerprint Engine)
 * Zero-dependency, fast device fingerprinting for Omni-Device Protocol.
 * Generates a consistent "ghost_vip_HASH" ID without forcing user login.
 */

window.SantisIdentity = window.SantisIdentity || (function () {

    // Fast 32-bit hash algorithm (DJB2 variant) for high speed in V8/JIT
    function cyrb53(str, seed = 0) {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    }

    // 1. Canvas Font Rendering Profile
    function getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = "#069";
            ctx.fillText("Santis Sovereign 👑", 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText("Santis Sovereign 👑", 4, 17);
            return canvas.toDataURL();
        } catch (e) {
            return "canvas_disabled";
        }
    }

    // 2. GPU / WebGL Hardware Profile
    function getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return "webgl_disabled";
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
            const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
            return `${vendor}~${renderer}`;
        } catch (e) {
            return "webgl_failed";
        }
    }

    // 3. Screen & Device Metrices
    function getDeviceMetrics() {
        return [
            window.screen.width,
            window.screen.height,
            window.screen.colorDepth,
            navigator.hardwareConcurrency || 'unknown',
            navigator.deviceMemory || 'unknown',
            Intl.DateTimeFormat().resolvedOptions().timeZone,
            navigator.language || navigator.userLanguage,
            navigator.userAgent
        ].join('||');
    }

    // Generate Sovereign ID
    function generateSovereignId() {
        const t1 = performance.now();

        // Combine raw vectors
        const vectorCanvas = getCanvasFingerprint();
        const vectorWebGL = getWebGLFingerprint();
        const vectorDevice = getDeviceMetrics();

        const rawString = `${vectorDevice}:::${vectorWebGL}:::${vectorCanvas}`;

        // Generate consistent Hash (Alphanumeric Hex)
        const hash = cyrb53(rawString).toString(16).toUpperCase();
        const finalId = `ghost_vip_${hash}`;

        const t2 = performance.now();
        console.log(`👁️ [Santis Identity] Sovereign Fingerprint Generated in ${(t2 - t1).toFixed(2)}ms -> ${finalId}`);

        return finalId;
    }

    return {
        /**
         * Returns the Sovereign ID (Fingerprint Hash) reliably.
         * Saves to localStorage to ensure absolute persistence unless entirely cleared.
         */
        getSovereignId: async function () {
            // First check persistence
            let id = localStorage.getItem('santis_sovereign_id');
            if (!id) {
                // If missing, generate dynamically
                id = generateSovereignId();
                localStorage.setItem('santis_sovereign_id', id);
            }

            // Sync with sessionStorage for backward compatibility 
            // (so old scripts that expect santis_ghost_id in session still work as fallback)
            sessionStorage.setItem('santis_ghost_id', id);

            return id;
        }
    };
})();
