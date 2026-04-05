// SANTIS v61.2 — COMMAND PALETTE (DOM FORGE CLEAN)
// NO innerHTML DOM INJECTION

(function () {
  if (window.__SANTIS_PALETTE__) return;
  window.__SANTIS_PALETTE__ = true;

  console.log("⌨️ [CMD] Initializing Clean Neural Interface...");

  const ACTIONS = [
    { 
      id: "nav-godseye", 
      title: "Toggle God's Eye", 
      subtitle: "Global Telemetry & Swarm Map", 
      icon: "👁️", 
      action: () => {
        const existingHud = document.getElementById('gods-eye-hud');
        if (existingHud) {
            // Zaten açıksa kapat (Gözlerini yum - DOM'dan sil)
            existingHud.remove();
            console.log("🌑 [GOD'S EYE] Vision offline.");
        } else {
            // Kapalıysa DOMForge ile şablondan çekip Body'ye yapıştır (Gözlerini aç)
            if(window.DOMForge) {
                window.DOMForge.mount('tpl-gods-eye-hud', document.body, true);
                console.log("👁️ [GOD'S EYE] Vision Synthesized and Online.");
            }
        }
      } 
    },
    { 
      id: "nav-boardroom", 
      title: "Open Boardroom", 
      subtitle: "Financial & Strategic Overview", 
      icon: "🏛️", 
      action: () => window.SovereignRouter?.navigate('/admin/boardroom.html') 
    },
    { 
      id: "nav-crm", 
      title: "CRM & Finans Ağı", 
      subtitle: "Müşteri ve Gelir Akışları", 
      icon: "💎", 
      action: () => window.SovereignRouter?.navigate('/admin/crm.html') 
    },
    {
      id: "mode-calm",
      title: "Quiet Luxury Mode",
      subtitle: "Reduce cognitive load",
      icon: "🧘",
      action: () => window.__SANTIS_ENGINE__?.setMode("calm")
    },
    {
      id: "mode-alert",
      title: "Elevated Alert",
      subtitle: "Increase system awareness",
      icon: "⚠️",
      action: () => window.__SANTIS_ENGINE__?.setMode("alert")
    },
    {
      id: "mode-critical",
      title: "DEFCON Mode",
      subtitle: "Maximum telemetry visibility",
      icon: "🚨",
      action: () => window.__SANTIS_ENGINE__?.setMode("critical")
    },
    {
      id: "role-l1",
      title: "Receptionist Role (L1)",
      subtitle: "Minimal UI exposure",
      icon: "🧑💼",
      action: () => window.__SANTIS_ENGINE__?.setRole("L1")
    },
    {
      id: "role-l3",
      title: "Super Admin (L3)",
      subtitle: "Full system visibility",
      icon: "👑",
      action: () => window.__SANTIS_ENGINE__?.setRole("L3")
    }
  ];

  const state = {
    open: false,
    query: "",
    index: 0,
    filtered: [...ACTIONS]
  };

  // 🧬 ROOT NODE (NO innerHTML)
  const root = document.createElement("div");
  root.id = "santis-cmd-root";
  document.body.appendChild(root);

  // -----------------------------
  // 🧱 BUILD UI (PURE DOM FORGE)
  // -----------------------------
  const backdrop = document.createElement("div");
  backdrop.className = "fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none flex justify-center items-start pt-[12vh]";

  const panel = document.createElement("div");
  panel.className = "w-[600px] bg-[#0b0b0f] border border-gray-800 rounded-xl overflow-hidden transform scale-95 transition";

  const header = document.createElement("div");
  header.className = "p-3 border-b border-gray-800 flex";

  const input = document.createElement("input");
  input.placeholder = "Search command...";
  input.className = "w-full bg-transparent text-white outline-none";

  const list = document.createElement("div");
  list.className = "max-h-[320px] overflow-auto";

  header.appendChild(input);
  panel.appendChild(header);
  panel.appendChild(list);
  backdrop.appendChild(panel);
  root.appendChild(backdrop);

  // -----------------------------
  // 🧠 RENDER
  // -----------------------------
  function render() {
    list.replaceChildren();

    state.filtered.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "px-4 py-3 flex items-center cursor-pointer hover:bg-white/5";

      const icon = document.createElement("span");
      icon.textContent = item.icon;

      const text = document.createElement("div");

      const title = document.createElement("div");
      title.textContent = item.title;

      const sub = document.createElement("div");
      sub.textContent = item.subtitle;
      sub.className = "text-xs opacity-50";

      text.appendChild(title);
      text.appendChild(sub);

      row.appendChild(icon);
      row.appendChild(text);

      row.addEventListener("click", () => execute(item));

      list.appendChild(row);
    });
  }

  function execute(item) {
    item.action?.();
    toggle(false);
  }

  function filter(q) {
    state.filtered = ACTIONS.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.subtitle.toLowerCase().includes(q)
    );
    render();
  }

  function toggle(force) {
    state.open = force ?? !state.open;

    if (state.open) {
      backdrop.classList.remove("opacity-0", "pointer-events-none");
      panel.classList.remove("scale-95");
      input.focus();
      render();
    } else {
      backdrop.classList.add("opacity-0", "pointer-events-none");
      panel.classList.add("scale-95");
    }
  }

  // -----------------------------
  // ⌨️ EVENTS
  // -----------------------------
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      toggle(true);
    }

    if (!state.open) return;

    if (e.key === "Escape") toggle(false);
  });

  input.addEventListener("input", (e) => {
    filter(e.target.value.toLowerCase());
  });

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) toggle(false);
  });

  console.log("✅ [CMD] Clean DOM Forge Active (Unified Engine Bound)");
})();
