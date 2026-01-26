(() => {
  try {
    const head = document.head;
    if (!head) return;

    // perf-head.js'in konumundan site root'unu bul (GitHub Pages repo path uyumlu)
    const cs = document.currentScript;
    const base = cs && cs.src ? new URL("../..", cs.src) : new URL(location.href);

    const ensureLink = (attrs) => {
      const rel = attrs.rel;
      const href = attrs.href;
      if (rel && href) {
        const exists = head.querySelector(`link[rel="${rel}"][href="${href}"]`);
        if (exists) return;
      }
      const link = document.createElement("link");
      Object.entries(attrs).forEach(([k, v]) => {
        if (v == null) return;
        if (k === "crossorigin") link.crossOrigin = v;
        else if (k === "fetchpriority") link.setAttribute("fetchpriority", String(v));
        else link.setAttribute(k, String(v));
      });
      head.appendChild(link);
    };

    // Fonts: connection warm-up
    ensureLink({ rel: "preconnect", href: "https://fonts.googleapis.com" });
    ensureLink({ rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" });


    // Placeholders: varsayılan olarak preload etme; gerekirse <html data-preload-placeholders="true"> ile aç
    const allowPages = new Set([]);
    const datasetFlag =
      document.documentElement &&
      document.documentElement.dataset &&
      document.documentElement.dataset.preloadPlaceholders;

    const rawPath = (location.pathname || "/").replace(/\/+$/, "");
    const lastSegment = rawPath.split("/").pop() || "";
    const pageName = lastSegment.includes(".")
      ? lastSegment.toLowerCase()
      : "index.html";
    const shouldPreloadPlaceholders =
      datasetFlag === "true" || allowPages.has(pageName);

    if (shouldPreloadPlaceholders) {
      // Page-specific placeholder needs
      const placeholderMap = {};

      const list =
        placeholderMap[pageName] ||
        (datasetFlag === "true"
          ? [
              "/images/placeholders/service-hero.svg",
              "/images/placeholders/service-card.svg",
              "/images/placeholders/category-hero.svg",
            ]
          : []);

      list.forEach((href) => {
        ensureLink({ rel: "preload", href, as: "image", type: "image/svg+xml" });
      });
    }

    // Opsiyonel: sayfa özel hero preload (ileride gerçek foto gelince)
    // <html data-hero-preload="images/hero/home.jpg"> gibi.
    const customHero = document.documentElement && document.documentElement.dataset
      ? document.documentElement.dataset.heroPreload
      : "";
    if (customHero) {
      const href = new URL(customHero, base).href;

      // Basit MIME tespiti (minimal, güvenli)
      const lower = String(customHero).toLowerCase();
      let mime = "";
      if (lower.endsWith(".webp")) mime = "image/webp";
      else if (lower.endsWith(".png")) mime = "image/png";
      else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) mime = "image/jpeg";
      else if (lower.endsWith(".svg")) mime = "image/svg+xml";

      const attrs = { rel: "preload", href, as: "image", fetchpriority: "high" };
      if (mime) attrs.type = mime;
      ensureLink(attrs);
    }
  } catch (e) {
    console.warn("perf-head init failed", e);
  }
})();
