// assets/js/core/aurelia-memory.js

import { SantisBus, CHANNELS } from "./santis-bus.js";

// Hafıza limiti
const SHORT_TERM_LIMIT = 20; // son 20 komut
const memoryQueue = [];

export function storeIntent(intentPayload) {
  // Zaman damgası ile birlikte sakla
  memoryQueue.push({ ...intentPayload, storedAt: Date.now() });

  if (memoryQueue.length > SHORT_TERM_LIMIT) {
    memoryQueue.shift(); // FIFO
  }

  // Bus üzerinden güncelle
  SantisBus.emit(CHANNELS.SYSTEM_ALERT, {
    type: "MEMORY_UPDATE",
    memoryCount: memoryQueue.length
  });
}

// Hafızadaki son komutları getir
export function recallLast(n = 5) {
  return memoryQueue.slice(-n);
}

// ✅ Dynamic UI Injection for memory panel
if (typeof document !== 'undefined') {
  const injectMemoryPanel = () => {
    if (!document.getElementById("memory-panel")) {
        const panel = document.createElement("div");
        panel.id = "memory-panel";
        panel.innerHTML = `<div style="margin-bottom: 6px; font-weight: bold; border-bottom: 1px solid rgba(0,255,194,0.3); padding-bottom: 4px;">🧠 Aurelia Memory Core</div><div id="aurelia-memory" style="font-size: 10px; line-height: 1.4; color: rgba(255,255,255,0.7);">Awaiting context...</div>`;
        document.body.appendChild(panel);
    }
  };
  
  if (document.body) injectMemoryPanel();
  else document.addEventListener("DOMContentLoaded", injectMemoryPanel);
}
