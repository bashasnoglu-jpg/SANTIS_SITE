(function () {
    "use strict";

    function initChipFilter() {
        var chipBar = document.getElementById("nvChips");
        if (!chipBar) return;

        var sections = document.querySelectorAll(".nv-massage-category, .rail-section, [data-category]");
        var cards = document.querySelectorAll(".santis-card, .nv-matrix-card, .matrix-service-card");

        if (!sections.length && !cards.length) {
            // console.warn("[ChipFilter] Sections/Cards not ready yet. Motor bekliyor.");
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

            // OMNI-OS V10: THE QUANTUM AMNESIA INTEGRATION
            console.log(`[ChipFilter] Kuantum Hedef: ${catId}`);

            // Eğer sayfa Hamam-V10 motoru (SovereignEngineInstance - Quantum Sieve) kullanıyorsa:
            if (window.SovereignEngineInstance && typeof window.SovereignEngineInstance.applyCategoryFilter === 'function') {
                window.SovereignEngineInstance.applyCategoryFilter(catId);
                return; // DOM manipülasyonunu atla
            } else if (window.SovereignEngineInstance && typeof window.SovereignEngineInstance.applyQuantumSieve === 'function') {
                // FALLBACK ESKİ KOD (Silinmemesi için güvence)
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
                return;
            }

            // 🎯 SMART FILTER: Kart seviyesi + Section seviyesi hibrit filtreleme
            var freshSections = document.querySelectorAll(".nv-massage-category, .rail-section, [data-category]");
            var freshCards = document.querySelectorAll(".santis-card, .nv-matrix-card, .matrix-service-card");

            // Kart seviyesi filtreleme (öncelikli)
            if (freshCards.length > 0) {
                var visibleCount = 0;
                for (var j = 0; j < freshCards.length; j += 1) {
                    var cardEl = freshCards[j];
                    var cardCat = (cardEl.getAttribute("data-category") || "").toLowerCase();
                    var cardCatId = (cardEl.getAttribute("data-category-id") || "").toLowerCase();
                    var cardTags = (cardEl.getAttribute("data-tags") || "").toLowerCase();

                    var isMatch = catId === "all" ||
                        cardCat === catId ||
                        cardCat.includes(catId) ||
                        cardCatId.includes(catId) ||
                        cardTags.includes(catId);

                    if (isMatch) {
                        cardEl.style.display = "";
                        cardEl.style.opacity = "1";
                        cardEl.style.transform = "scale(1)";
                        cardEl.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                        visibleCount++;
                    } else {
                        cardEl.style.opacity = "0";
                        cardEl.style.transform = "scale(0.95)";
                        cardEl.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                        (function(el) {
                            setTimeout(function() { el.style.display = "none"; }, 300);
                        })(cardEl);
                    }
                }
                console.log(`🔮 [Filter Engine] ${catId} → ${visibleCount}/${freshCards.length} kart görünür`);
            }
            // Section seviyesi fallback (eski sayfalar)
            else if (freshSections.length > 0) {
                for (var k = 0; k < freshSections.length; k += 1) {
                    var section = freshSections[k];
                    if (catId === "all") {
                        section.style.display = "";
                    } else if (section.getAttribute("data-category") === catId) {
                        section.style.display = "";
                        section.scrollIntoView({ behavior: "smooth", block: "start" });
                    } else {
                        section.style.display = "none";
                    }
                }
            }

            // 📡 God's Eye Radarına Telemetri Gönder
            if (window.SovereignBus && typeof SovereignBus.send === 'function') {
                SovereignBus.send("telemetry", {
                    action: "filter_used",
                    payload: { filter: catId, timestamp: Date.now() }
                });
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
