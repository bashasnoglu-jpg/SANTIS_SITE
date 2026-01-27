// Global state (tek yerde dursun)
window.__NV_COMP_STATE = window.__NV_COMP_STATE || {
    tokenByTarget: new Map(), // target -> token
    abortByTarget: new Map(), // target -> AbortController
    injectedByTarget: new Map(), // target -> [scriptNodes]
};

function withCacheBust(url, enabled = true) {
    if (!enabled) return url;
    const u = new URL(url, window.location.href);
    u.searchParams.set("v", Date.now().toString());
    return u.toString();
}

function waitScriptLoad(scriptEl) {
    // Inline script => append edince çalışır; resolve hemen
    if (!scriptEl.src) return Promise.resolve();

    return new Promise((resolve) => {
        scriptEl.addEventListener("load", resolve, { once: true });
        scriptEl.addEventListener("error", resolve, { once: true }); // hata olsa da akış devam
    });
}

function cleanupInjectedScripts(targetEl) {
    const st = window.__NV_COMP_STATE;
    const oldList = st.injectedByTarget.get(targetEl);
    if (oldList?.length) {
        for (const node of oldList) {
            try {
                node.remove();
            } catch (_) { }
        }
    }
    st.injectedByTarget.set(targetEl, []);
}

/**
 * Safer component loader
 * @param {string} url - component html url (navbar.html, footer.html, vb.)
 * @param {string|HTMLElement} target - selector veya element
 * @param {object} opts
 * @param {boolean} opts.cacheBust - dev'de true (default true)
 * @param {boolean} opts.runScripts - component içindeki scriptleri çalıştır (default true)
 */
async function loadComp(url, target, opts = {}) {
    const { cacheBust = true, runScripts = true } = opts;

    const targetEl = typeof target === "string" ? document.getElementById(target) || document.querySelector(target) : target;
    if (!targetEl) {
        console.warn("loadComp: Target not found", target);
        return;
    }

    const st = window.__NV_COMP_STATE;

    // Önceki fetch varsa iptal et (race azaltır)
    const prevAbort = st.abortByTarget.get(targetEl);
    if (prevAbort) prevAbort.abort();
    const ac = new AbortController();
    st.abortByTarget.set(targetEl, ac);

    // Bu çağrıya özel token (stale response'u discard edeceğiz)
    const token = Symbol("loadComp");
    st.tokenByTarget.set(targetEl, token);

    const fetchUrl = withCacheBust(url, cacheBust);

    let htmlText;
    try {
        const res = await fetch(fetchUrl, { signal: ac.signal, cache: "no-store" });
        if (!res.ok) throw new Error(`loadComp fetch failed: ${res.status} ${res.statusText}`);
        htmlText = await res.text();
    } catch (err) {
        // Abort normal: sessiz geç
        if (err?.name !== "AbortError") console.warn("loadComp warning:", err);
        return;
    }

    // Eğer bu hedefe daha yeni bir load başladıysa, bunu çöpe at
    if (st.tokenByTarget.get(targetEl) !== token) return;

    // HTML parse
    const tpl = document.createElement("template");
    tpl.innerHTML = htmlText;

    // Scriptleri yakala ve template’ten çıkar (innerHTML ile çalışmazlar zaten)
    const scripts = runScripts ? Array.from(tpl.content.querySelectorAll("script")) : [];
    for (const s of scripts) s.remove();

    // DOM’a bas
    targetEl.innerHTML = "";
    targetEl.appendChild(tpl.content);

    // Daha önce bu target’a enjekte edilen scriptleri temizle
    cleanupInjectedScripts(targetEl);

    if (!runScripts || scripts.length === 0) return;

    // Scriptleri SIRALI çalıştır (dependency bozulmasın)
    const injected = [];
    for (const oldScript of scripts) {
        // Target hala DOM’a bağlı mı? Değilse hiç uğraşma
        if (!targetEl.isConnected) return;

        // Token değiştiyse (yeni load başladıysa) dur
        if (st.tokenByTarget.get(targetEl) !== token) return;

        const newScript = document.createElement("script");

        // Attributes kopyala
        for (const attr of Array.from(oldScript.attributes)) {
            newScript.setAttribute(attr.name, attr.value);
        }

        newScript.dataset.compScript = "1";
        newScript.dataset.compFrom = url;

        if (oldScript.src) {
            newScript.src = withCacheBust(oldScript.src, cacheBust);
        } else {
            // Inline script - Try/Catch bloklu çalıştıramayız ama hata olursa yakalayalım
            newScript.textContent = oldScript.textContent || "";
        }

        try {
            targetEl.appendChild(newScript);
            injected.push(newScript);
            // External scriptler için load bekle
            if (newScript.src) await waitScriptLoad(newScript);
        } catch (err) {
            console.error("loadComp: Script injection failed", url, err);
        }
    }

    st.injectedByTarget.set(targetEl, injected);
}

// Expose globally
window.loadComp = async function (url, target, opts) {
    await loadComp(url, target, opts);
    // Auto-init Navbar if we just injected it
    if (url.includes("navbar.html") && typeof window.NV_INIT_NAVBAR === "function") {
        window.NV_INIT_NAVBAR();
    }
};
