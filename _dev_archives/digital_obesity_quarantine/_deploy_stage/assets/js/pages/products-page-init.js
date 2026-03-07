(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        // Init Category Engine for Products page when available.
        if (typeof window.Engine !== "undefined" && typeof window.Engine.init === "function") {
            window.Engine.init("PRODUCTS");
        }

        // Components (navbar + footer) are loaded globally by santis-nav.js
    });
})();
