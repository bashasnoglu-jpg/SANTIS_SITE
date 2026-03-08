/* =====================================================
SANTIS SENTINEL – CLS VISUALIZER
Real-time Layout Shift Detector
===================================================== */

(function () {

    if (!window.SANTIS_DEBUG) return;

    if (!('PerformanceObserver' in window)) {
        console.warn("CLS Observer not supported");
        return;
    }

    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.hadRecentInput) return;

            entry.sources.forEach(source => {
                const el = source.node;

                // Source guard against non-element nodes
                if (!el || el.nodeType !== 1) return;

                el.style.outline = "3px solid red";
                el.style.outlineOffset = "2px";

                console.warn(
                    "[CLS DETECTED]",
                    "Shift:", entry.value.toFixed(4),
                    el
                );

                setTimeout(() => {
                    el.style.outline = "";
                }, 2000);
            });
        }
    });

    observer.observe({
        type: "layout-shift",
        buffered: true
    });

    console.log("🛰 Santis CLS Visualizer Active");

})();
