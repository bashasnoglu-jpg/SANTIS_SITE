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

            // OMNI-OS V10: THE QUANTUM SIEVE INTEGRATION
            console.log(`[ChipFilter] Kuantum Hedef: ${catId}`);

            // Eğer sayfa Hamam-V10 motoru (SovereignEngineInstance) kullanıyorsa:
            if (window.SovereignEngineInstance && typeof window.SovereignEngineInstance.applyQuantumSieve === 'function') {
                // Neuro-Sync veya V10 Data'dan orijinal veriyi al (hamam-engine.js'in data array'ı initial'da var, asıl liste süzülmeli)
                // Daha kalıcı çözüm: motorun referans veri kaynağını filtreleyip yollamak
                // (Mevcut 'santis-data-bridge.js' veya 'hamam-engine.js' cache'inden fetchlemek)
                if (window.SovereignEngineInstance._originalData === undefined) {
                    window.SovereignEngineInstance._originalData = [...window.SovereignEngineInstance.data];
                }
                const baseData = window.SovereignEngineInstance._originalData;

                const filtered = catId === 'all'
                    ? baseData
                    : baseData.filter(item => {
                        const c = String(item.category || item.categoryId || '').toLowerCase();
                        return c.includes(catId) || c === catId;
                    });

                window.SovereignEngineInstance.applyQuantumSieve(filtered);
                return; // DOM manipülasyonunu atla
            }

            // Fallback (eski sayfalar için, henüz V10'a geçmediyse çalışsın)
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
