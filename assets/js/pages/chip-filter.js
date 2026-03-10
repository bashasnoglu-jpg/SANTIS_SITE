(function () {
    "use strict";

    function initChipFilter() {
        var chipBar = document.getElementById("nvChips");
        if (!chipBar) return;

        var sections = document.querySelectorAll(".nv-massage-category, .rail-section, [data-category]");

        if (!sections.length) {
            // console.warn("[ChipFilter] Sections not ready yet. Motor bekliyor.");
            return;
        }

        if (chipBar.dataset.chipFilterBound === "1") {
            return;
        }
        chipBar.dataset.chipFilterBound = "1";

        console.log("[ChipFilter] Bound to", sections.length, "sections.");

        chipBar.addEventListener("click", function (event) {
            var chip = event.target.closest(".nv-chip");
            if (!chip) {
                return;
            }

            var catId = chip.getAttribute("data-target");
            if (!catId) {
                return;
            }

            var allChips = chipBar.querySelectorAll(".nv-chip");
            for (var i = 0; i < allChips.length; i += 1) {
                allChips[i].classList.remove("is-active");
            }
            chip.classList.add("is-active");

            var freshSections = document.querySelectorAll(".nv-massage-category, .rail-section, [data-category]");
            for (var j = 0; j < freshSections.length; j += 1) {
                var section = freshSections[j];
                if (catId === "all") {
                    section.style.display = "";
                } else if (section.getAttribute("data-category") === catId) {
                    section.style.display = "";
                    section.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                    section.style.display = "none";
                }
            }
        });
    }

    // Sovereign Renderer (Enterprise Event Driven)
    document.addEventListener("santis:cards-rendered", initChipFilter);

    // Fallback
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initChipFilter);
    } else {
        initChipFilter();
    }
})();
