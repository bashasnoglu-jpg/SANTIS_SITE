(function () {
    "use strict";

    setTimeout(function () {
        var preloader = document.getElementById("preloader");
        if (!preloader) {
            return;
        }

        console.warn("[Preloader] Failsafe triggered, forcing unlock.");
        preloader.style.opacity = "0";
        preloader.style.pointerEvents = "none";
        setTimeout(function () {
            preloader.style.display = "none";
        }, 500);
    }, 4000);
})();
