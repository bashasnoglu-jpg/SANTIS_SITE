// 🧠 Santis God Mode Dashboard
(function () {

    const ENABLED =
      location.search.includes("admin=true") ||
      localStorage.getItem("SANTIS_GODMODE") === "1";
  
    if (!ENABLED) return;
  
    console.log("👁️ [God Mode] Activated");
  
    // 🎯 ROOT PANEL
    const panel = document.createElement("div");
    panel.id = "santis-godmode";
    document.body.appendChild(panel);
  
    panel.innerHTML = `
      <div class="gm-title">SANTIS • GOD MODE</div>
      <div class="gm-row">FPS: <span id="gm-fps">-</span></div>
      <div class="gm-row">MEM: <span id="gm-mem">-</span></div>
      <div class="gm-row">DOM: <span id="gm-dom">-</span></div>
      <div class="gm-row">TASK:<span id="gm-task">-</span></div>
      <div class="gm-row">WS:  <span id="gm-ws">-</span></div>
      <div class="gm-row">STATE:<span id="gm-state">-</span></div>
    `;
  
    // 🎨 STYLE
    const style = document.createElement("style");
    style.innerHTML = `
      #santis-godmode {
        position: fixed;
        bottom: 12px;
        right: 12px;
        width: 180px;
        padding: 12px;
        background: rgba(0,0,0,0.85);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        font-family: monospace;
        font-size: 12px;
        color: #00ffcc;
        z-index: 999999;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0,255,200,0.2);
        pointer-events: none;
        user-select: none;
        transition: opacity 0.3s ease;
      }
      .gm-title {
        font-weight: bold;
        margin-bottom: 8px;
        color: #00ffaa;
        border-bottom: 1px solid rgba(0,255,200,0.3);
        padding-bottom: 4px;
        text-align: center;
      }
      .gm-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 2px;
      }
      #santis-godmode span {
        font-weight: bold;
        color: #fff;
      }
    `;
    document.head.appendChild(style);
  
    // 🧠 METRICS
    let fps = 0;
    let frames = 0;
    let last = performance.now();
  
    function loop(now) {
      frames++;
      if (now - last >= 1000) {
        fps = frames;
        frames = 0;
        last = now;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  
    // 🔥 LONG TASK TRACKER
    window.__LONG_TASKS__ = 0;
  
    try {
      new PerformanceObserver((list) => {
        list.getEntries().forEach(e => {
          if (e.duration > 50) window.__LONG_TASKS__++;
        });
      }).observe({ entryTypes: ["longtask"] });
    } catch {}
  
    // 🌐 WS TRACK
    window.__WS_COUNT__ = 0;
    const OriginalWS = window.WebSocket;
  
    window.WebSocket = function (...args) {
      window.__WS_COUNT__++;
      const ws = new OriginalWS(...args);
  
      ws.addEventListener("close", () => {
        window.__WS_COUNT__--;
      });
  
      return ws;
    };
  
    // 🔄 UPDATE LOOP
    function update() {
      const mem = performance.memory?.usedJSHeapSize;
  
      const fpsEl = document.getElementById("gm-fps");
      if (fpsEl) {
          fpsEl.textContent = fps;
          fpsEl.style.color = fps < 40 ? '#ff4444' : fps < 55 ? '#ffaa00' : '#00ffcc';
      }

      document.getElementById("gm-mem").textContent =
        mem ? (mem / 1048576).toFixed(1) + "MB" : "n/a";
  
      document.getElementById("gm-dom").textContent =
        document.getElementsByTagName('*').length;
  
      const taskEl = document.getElementById("gm-task");
      if (taskEl) {
          taskEl.textContent = window.__LONG_TASKS__;
          if (window.__LONG_TASKS__ > 5) taskEl.style.color = '#ff4444';
      }
  
      document.getElementById("gm-ws").textContent =
        window.__WS_COUNT__ || 0;
  
      let stateStr = "IDLE";
      if (window.SantisGhostEngine?.isAnimating) stateStr = "GHOST_SYNC";
      else if (window.SovereignKineticEngine?._isHeightUpdating) stateStr = "REFLOW";
      else if (window.SovereignCursorEngine) stateStr = "CURSOR_ACT";
      
      document.getElementById("gm-state").textContent = stateStr;
  
      requestAnimationFrame(update);
    }
  
    update();

    // 🧬 AUTO-HEALING TRIGGER (FAZ 2)
    function autoHeal() {
        const memMB = performance.memory?.usedJSHeapSize / 1048576;
        const domCount = document.getElementsByTagName('*').length;
      
        if (memMB > 500) {
          console.warn("🛡️ [God Mode] Memory Critical (>500MB) → Soft Reset tetikleniyor.");
          location.reload();
        }
      
        if (domCount > 4000) {
          console.warn("🛡️ [God Mode] DOM Overflow (>4000 node) → Garbage Cleanup Trigger!");
          const ghosts = document.querySelectorAll('.santis-ghost, .sovereign-morph-clone');
          ghosts.forEach(n => n.remove());
          if (ghosts.length > 0) {
              console.log(`🛡️ [God Mode] Cleared ${ghosts.length} orphan ghost nodes.`);
          }
        }
    }
      
    // Her 5 saniyede bir sağlık kontrolü yap
    setInterval(autoHeal, 5000);
      
    // Sağlık raporunu dışarıya aç
    window.SantisHealth = function () {
        const mem = performance.memory || {};
        const state = document.getElementById("gm-state")?.textContent || "unknown";
      
        const health = {
          kernel: !!window.__SANTIS_KERNEL_BOOTED__,
          ghostEngine: !!window.SantisGhostEngine,
          state: state,
          wsConnections: window.__WS_COUNT__ || 0,
          memoryMB: mem.usedJSHeapSize ? (mem.usedJSHeapSize / 1048576).toFixed(1) : "n/a",
          domNodes: document.getElementsByTagName('*').length,
          longTasks: window.__LONG_TASKS__ || 0
        };
      
        console.table(health);
        return health;
    };

})();
