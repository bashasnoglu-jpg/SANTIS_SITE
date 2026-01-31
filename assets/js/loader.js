/**
 * SANTIS CORE LOADER v2.1
 * - Component Loading (Navbar/Footer)
 * - Cache Busting
 * - Retry Logic
 * - Preloader Management
 */

// Global state for retries
const __NV_LOADCOMP_RETRY = new Map();

// Helper for cache busting
function withCacheBust(url, enabled = true) {
    if (!enabled) return url;
    const u = new URL(url, window.location.href);
    u.searchParams.set("v", Date.now().toString());
    return u.toString();
}

/**
 * Safer component loader with Retry Map & setTimeout (Stack Safe)
 * @param {string} url - component html url (navbar.html, footer.html, vb.)
 * @param {string|HTMLElement} target - selector veya element
 * @param {object} opts
 */
async function loadComp(url, target, opts = {}) {
    // 1. Resolve Target
    let targetEl = null;
    let targetId = "";

    if (typeof target === "string") {
        targetId = target;
        targetEl = document.getElementById(target) || document.querySelector(target);
    } else if (target instanceof HTMLElement) {
        targetEl = target;
        targetId = target.id || "unknown-target";
    }

    // 2. Options
    const maxRetry = Number.isFinite(opts.retry) ? opts.retry : 3;
    const retryDelay = 250;
    const { cacheBust = true, runScripts = true } = opts;

    if (!url || !targetEl) {
        console.warn("[loadComp] invalid args or target not found:", { url, target: targetId });
        return;
    }

    // 2.1 Protocol Check (CORS Guard)
    if (window.location.protocol === 'file:') {
        console.error(`[loadComp] CORS Error: Cannot fetch '${url}' via file:// protocol.`);
        if (targetEl) {
            targetEl.innerHTML = `
                <div style="padding:20px; text-align:center; border:1px dashed #ccc; color:#888; font-family:sans-serif; font-size:12px;">
                    ⚠️ <strong>Component Load Failed</strong><br>
                    Browsers block 'fetch' on local files (CORS).<br>
                    Please run this project using a Local Server (e.g. <code>test-project.ps1</code>).
                </div>`;
        }
        return;
    }

    // 3. Retry Key
    const key = `${url}__${targetId}`;
    const attempt = (__NV_LOADCOMP_RETRY.get(key) ?? 0);

    try {
        const fetchUrl = withCacheBust(url, cacheBust);
        const res = await fetch(fetchUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);

        const htmlText = await res.text();

        // Success
        targetEl.innerHTML = htmlText;
        __NV_LOADCOMP_RETRY.delete(key); // Reset retry count on success

        // Run Scripts if needed
        if (runScripts) {
            const scripts = Array.from(targetEl.querySelectorAll("script"));
            for (const s of scripts) {
                const newScript = document.createElement("script");
                Array.from(s.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.appendChild(document.createTextNode(s.innerHTML)); // Inline
                if (s.src) newScript.src = s.src; // External
                s.parentNode.replaceChild(newScript, s);
            }
            // Auto-init Navbar
            if (url.includes("navbar.html") && typeof window.NV_INIT_NAVBAR === "function") {
                window.NV_INIT_NAVBAR();
            }
        }

    } catch (err) {
        if (attempt >= maxRetry) {
            console.error(`[loadComp] FAILED after ${attempt} retries:`, url, err);
            return; // STOP
        }

        __NV_LOADCOMP_RETRY.set(key, attempt + 1);
        console.warn(`[loadComp] retry ${attempt + 1}/${maxRetry} -> ${url}`);

        // Recursive call via setTimeout (Stack Safe)
        setTimeout(() => loadComp(url, target, opts), retryDelay);
    }
}

// Fail-safe Preloader Removal (Independent of app.js)
(function () {
    const hidePreloader = () => {
        const p = document.getElementById('preloader');
        if (p) {
            p.classList.add('hidden');
            setTimeout(() => {
                if (p) p.style.display = 'none';
            }, 600); // Wait for transition
            console.log("🌊 [Loader] Preloader forced to hide.");
        }
    };

    // Attempt standard DomContentLoaded
    window.addEventListener('DOMContentLoaded', () => setTimeout(hidePreloader, 1500));

    // Backup: window.load
    window.addEventListener('load', () => setTimeout(hidePreloader, 2500));
})();

// Expose globally
window.loadComp = loadComp;
