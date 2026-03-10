(function () {
    "use strict";

    // Keep root-based asset resolution stable for nested language pages.
    window.SITE_ROOT = "/";

    function initSkincarePage() {
        console.log("⚡ [Skincare Detail] Initializing V10 Engine Routing...");

        // 1. DATA BRIDGE INJECTION (V10 CORE)
        if (typeof SovereignDataBridge !== "undefined" && typeof SovereignDataBridge.injectMatrix === "function") {
            SovereignDataBridge.injectMatrix("/assets/data/services.json", ".nv-product-grid", "skincare");
        } else {
            console.error("🚨 [Skincare Detail] SovereignDataBridge is missing! Cards will not load.");
        }

        // 2. SCROLL INDICATOR
        var scrollTrigger = document.querySelector(".nv-scroll-indicator[data-scroll-target]");
        if (scrollTrigger && scrollTrigger.dataset.scrollBound !== "1") {
            scrollTrigger.dataset.scrollBound = "1";
            scrollTrigger.addEventListener("click", function () {
                var targetId = scrollTrigger.getAttribute("data-scroll-target");
                if (!targetId) return;

                // For target like "#skincare", parse without '#'
                if (targetId.startsWith("#")) {
                    targetId = targetId.substring(1);
                }

                var target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: "smooth" });
                }
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSkincarePage);
    } else {
        initSkincarePage();
    }
})();
