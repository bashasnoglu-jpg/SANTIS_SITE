(function () {
    "use strict";

    var maxAttempts = 20;
    var attempt = 0;

    function initChipFilter() {
        var sections = document.querySelectorAll(".nv-massage-category");
        var chipBar = document.getElementById("nvChips");

        if (!sections.length || !chipBar) {
            attempt += 1;
            if (attempt < maxAttempts) {
                setTimeout(initChipFilter, 500);
            } else {
                console.warn("[ChipFilter] No sections found after 10s");
            }
            return;
        }

        if (chipBar.dataset.chipFilterBound === "1") {
            return;
        }
        chipBar.dataset.chipFilterBound = "1";

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

            var freshSections = document.querySelectorAll(".nv-massage-category");
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

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            setTimeout(initChipFilter, 1000);
        });
    } else {
        setTimeout(initChipFilter, 1000);
    }
})();
