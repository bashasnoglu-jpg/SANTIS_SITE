// SANTIS v61.2 — SINGLE ENGINE CONTRACT
// Unified Consciousness Layer (UCL)
// NO GHOST STATE ALLOWED

(function () {
  if (window.__SANTIS_ENGINE__) return;

  const Engine = {
    state: {
      mode: "calm",
      role: "L1"
    },

    // 🧘 MODE CONTROL
    setMode(mode) {
      this.state.mode = mode;

      const root = document.documentElement;
      root.classList.remove("ui-calm", "ui-alert", "ui-critical");
      root.classList.add(`ui-${mode}`);

      console.log(`🧠 [ENGINE] Mode → ${mode}`);
    },

    // 🧠 ROLE CONTROL
    setRole(role) {
      this.state.role = role;

      document.querySelectorAll("[data-role]").forEach(el => {
        const required = el.dataset.role;
        if (!required) return;

        el.style.display = (required <= role) ? "" : "none";
      });

      console.log(`🧠 [ENGINE] Role → ${role}`);
    },

    // 🧬 READ STATE
    getState() {
      return this.state;
    }
  };

  window.__SANTIS_ENGINE__ = Engine;

  console.log("✅ [ENGINE] Single Consciousness Contract Active");
})();
