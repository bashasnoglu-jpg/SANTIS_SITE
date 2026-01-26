(() => {
  try {
    if (typeof PerformanceObserver !== "function") return;

    const isFirefox =
      typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent || "");

    const supported = (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes) ? PerformanceObserver.supportedEntryTypes : [];
    const canObserve = (type) => supported.includes(type);

    const round = (n) => (typeof n === "number" ? Math.round(n) : n);
    const state = { lcp: null, cls: 0, inp: null };

    // CLS (layout shift) — Firefox/WebKit uyumluluk guard’ı (warning üretmesin)
    if (canObserve("layout-shift")) {
      let clsValue = 0;
      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) clsValue += entry.value || 0;
        }
        state.cls = clsValue;
      });
      try {
        clsObs.observe({ type: "layout-shift", buffered: true });
      } catch (e) {
        try { clsObs.observe({ entryTypes: ["layout-shift"] }); } catch (e2) { }
      }
    }

    // LCP
    try {
      if (!canObserve("largest-contentful-paint")) throw new Error("lcp not supported");
      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) state.lcp = last.startTime;
      });
      lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
    } catch { }

    // INP (yoksa FID/ETP yok; minimal)
    try {
      if (!canObserve("event")) throw new Error("event not supported");
      const inpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) state.inp = last.duration;
      });
      inpObs.observe({ type: "event", buffered: true, durationThreshold: 40 });
    } catch { }

    const report = () => {
      // CLS 3 ondalık
      const cls = Math.round((state.cls || 0) * 1000) / 1000;
      const lcp = state.lcp != null ? `${round(state.lcp)}ms` : "n/a";
      const inp = state.inp != null ? `${round(state.inp)}ms` : "n/a";
      console.info(`[perf] LCP=${lcp} CLS=${cls} INP=${inp}`);
    };

    // Sayfa kapanırken raporla (LCP finalize)
    addEventListener("pagehide", report, { capture: true });
    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") report();
    });
  } catch (e) {
    console.warn("perf-metrics init failed", e);
  }
})();

