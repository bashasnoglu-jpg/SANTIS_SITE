(function () {
    "use strict";

    // Keep relative-root behavior for this nested page.
    window.SITE_ROOT = "../../";

    function initHammamPage() {
        if (typeof window.Engine !== "undefined" && typeof window.Engine.init === "function") {
            window.Engine.init("HAMMAM");
        }

        var scrollTrigger = document.querySelector(".nv-scroll-indicator[data-scroll-target]");
        if (scrollTrigger && scrollTrigger.dataset.scrollBound !== "1") {
            scrollTrigger.dataset.scrollBound = "1";
            scrollTrigger.addEventListener("click", function () {
                var targetId = scrollTrigger.getAttribute("data-scroll-target");
                if (!targetId) {
                    return;
                }
                var target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: "smooth" });
                }
            });
        }

        if (typeof window.loadComp === "function") {
            if (document.getElementById("navbar-container")) {
                window.loadComp("../../components/navbar.html", "navbar-container");
            }
            if (document.getElementById("footer-container")) {
                window.loadComp("../../components/footer.html", "footer-container");
            }
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initHammamPage);
    } else {
        initHammamPage();
    }
})();
