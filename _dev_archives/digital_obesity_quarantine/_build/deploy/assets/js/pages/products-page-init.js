(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        // Init Category Engine for Products page when available.
        if (typeof window.Engine !== "undefined" && typeof window.Engine.init === "function") {
            window.Engine.init("PRODUCTS");
        }

        if (typeof window.loadComp === "function") {
            if (document.getElementById("navbar-container")) {
                window.loadComp("/components/navbar.html", "navbar-container");
            }
            if (document.getElementById("footer-container")) {
                window.loadComp("/components/footer.html", "footer-container");
            }
        }
    });
})();
