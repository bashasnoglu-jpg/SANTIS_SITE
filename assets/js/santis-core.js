/**
 * SANTIS CORE ENGINE v1.3 (Final - Stable)
 * - 5 Moods
 * - Theme switcher
 * - Intro overlay (first visit)
 * - CSP-safe (no inline onclick)
 * - Component-loader safe (overlay late-load supported)
 * - Does NOT wipe body classes
 */

const SANTIS_CORE = {
    state: {
        currentMood: "fatigued",
        isFirstVisit: true,
        _lastFocus: null,
    },

    moods: {
        fatigued: {
            id: "fatigued",
            name: "Yorgun",
            subtitle: "Derin Dinlenme",
            theme: {
                "--bg-main": "#1a1a1a",
                "--bg-section": "#222",
                "--text-main": "#e0e0e0",
                "--gold": "#d4af37",
            },
        },
        stressed: {
            id: "stressed",
            name: "Stresli",
            subtitle: "Dinginleş & Rahatla",
            theme: {
                "--bg-main": "#1e2424",
                "--bg-section": "#252b2b",
                "--text-main": "#dcecec",
                "--gold": "#a0c0c0",
            },
        },
        drained: {
            id: "drained",
            name: "Enerjisiz",
            subtitle: "Canlan & Tazelen",
            theme: {
                "--bg-main": "#ffffff",
                "--bg-section": "#f4f4f4",
                "--text-main": "#222",
                "--gold": "#ff8c00",
            },
        },
        sensitive: {
            id: "sensitive",
            name: "Hassas",
            subtitle: "Nazik Dokunuş",
            theme: {
                "--bg-main": "#f9f7f7",
                "--bg-section": "#fff",
                "--text-main": "#555",
                "--gold": "#e6b3b3",
            },
        },
        care: {
            id: "care",
            name: "Bakım",
            subtitle: "Sothys Uzmanlığı",
            theme: {
                "--bg-main": "#fff",
                "--bg-section": "#fff",
                "--text-main": "#333",
                "--gold": "#333",
            },
        },
    },

    init() {
        const storedMood = localStorage.getItem("santis_mood");
        if (storedMood && this.moods[storedMood]) {
            this.setMood(storedMood, false);
            this.state.isFirstVisit = false;
        } else {
            this.showIntroWhenReady();
        }
    },

    setMood(moodId, save = true) {
        if (!this.moods[moodId]) return;

        const theme = this.moods[moodId].theme;
        const root = document.documentElement;

        for (const [key, value] of Object.entries(theme)) {
            root.style.setProperty(key, value);
        }

        this.state.currentMood = moodId;

        // ✅ Body class'larını SİLME — sadece mood class yönet
        document.body.dataset.mood = moodId;

        const allMoodClasses = [
            "mood-fatigued",
            "mood-stressed",
            "mood-drained",
            "mood-sensitive",
            "mood-care",
        ];
        document.body.classList.remove(...allMoodClasses);
        document.body.classList.add(`mood-${moodId}`);

        if (save) localStorage.setItem("santis_mood", moodId);
    },

    showIntroWhenReady() {
        const tryOpen = () => {
            const overlay = document.getElementById("santisIntro");
            const grid = overlay?.querySelector(".mood-grid");
            if (!overlay || !grid) return false;

            this.openIntro(overlay, grid);
            return true;
        };

        if (tryOpen()) return;

        // Overlay component loader ile sonradan gelirse yakala
        const obs = new MutationObserver(() => {
            if (tryOpen()) obs.disconnect();
        });
        obs.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        // Fail-safe: sonsuz izleme yok
        setTimeout(() => obs.disconnect(), 4000);
    },

    openIntro(overlay, grid) {
        // already open
        if (overlay.classList.contains("active")) return;

        this.state._lastFocus = document.activeElement;

        overlay.classList.add("active");
        overlay.removeAttribute("aria-hidden");
        document.body.style.overflow = "hidden";

        this.renderIntroOptions(grid);
        this.bindIntroEvents(overlay);

        // focus first card
        const firstBtn = overlay.querySelector("[data-mood]");
        if (firstBtn) firstBtn.focus();
    },

    renderIntroOptions(grid) {
        const icons = {
            fatigued: "🌿",
            stressed: "☁️",
            drained: "⚡",
            sensitive: "🌸",
            care: "🧴",
        };

        const moodList = [
            "fatigued",
            "stressed",
            "drained",
            "sensitive",
            "care"
        ];

        grid.innerHTML = moodList
            .map((id) => {
                const m = this.moods[id];
                return `
          <button type="button" class="mood-card" data-mood="${id}">
            <span class="mood-icon" aria-hidden="true">${icons[id]}</span>
            <span class="mood-title">${m.name}</span>
            <span class="mood-sub">${m.subtitle}</span>
          </button>
        `;
            })
            .join("");

        grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(140px, 1fr))";
    },

    bindIntroEvents(overlay) {
        // Delegated click
        const grid = overlay.querySelector(".mood-grid");
        if (grid && !grid.dataset.bound) {
            grid.dataset.bound = "1";
            grid.addEventListener("click", (e) => {
                const btn = e.target.closest("[data-mood]");
                if (!btn) return;
                this.selectMood(btn.dataset.mood);
            });
        }
        // Close / Skip buttons
        const closeBtn = overlay.querySelector("[data-intro-close]");
        const skipBtn = overlay.querySelector("[data-intro-skip]");

        const closeOnce = () => this.hideIntro();
        closeBtn?.addEventListener("click", closeOnce, {
            once: true
        });
        skipBtn?.addEventListener("click", closeOnce, {
            once: true
        });

        // ESC
        if (!overlay.dataset.escBound) {
            overlay.dataset.escBound = "1";
            document.addEventListener("keydown", (e) => {
                if (!overlay.classList.contains("active")) return;
                if (e.key === "Escape") this.hideIntro();
            });
        }
        // Click outside panel closes (optional, luxe)
        const panel = overlay.querySelector(".intro-panel");
        if (!overlay.dataset.outsideBound) {
            overlay.dataset.outsideBound = "1";
            overlay.addEventListener("click", (e) => {
                if (!overlay.classList.contains("active")) return;
                if (panel && !panel.contains(e.target)) this.hideIntro();
            });
        }
    },

    hideIntro() {
        const overlay = document.getElementById("santisIntro");
        if (!overlay) return;

        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");

        setTimeout(() => {
            overlay.style.display = "none";
            document.body.style.overflow = "";
            // restore focus
            const prev = this.state._lastFocus;
            if (prev && typeof prev.focus === "function") prev.focus();
        }, 250);
    },

    selectMood(moodId) {
        this.setMood(moodId, true);
        this.hideIntro();
    },
};

// Boot (CSP-safe)
(function boot() {
    window.SANTIS_CORE = SANTIS_CORE;
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => SANTIS_CORE.init());
    } else {
        SANTIS_CORE.init();
    }
})();
