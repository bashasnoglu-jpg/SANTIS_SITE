// assets/js/core/aurelia-router.js

import { SantisBus, CHANNELS } from "./santis-bus.js";
import { recallLast } from "./aurelia-memory.js";

SantisBus.on(CHANNELS.AURELIA_INTENT, () => {
  const lastCommands = recallLast(2);

  // Multi-step Memory Logic
  if (
    lastCommands.length === 2 &&
    lastCommands[0].intent === "open:reservations" &&
    lastCommands[1].intent === "navigate:dashboard"
  ) {
    SantisBus.emit(CHANNELS.SYSTEM_ALERT, {
      type: "MULTI_STEP_TRIGGER",
      message: "VIP rezervasyon & dashboard sequence activated!"
    });
  }
});

SantisBus.on(CHANNELS.AURELIA_INTENT, ({ intent }) => {

  switch (intent) {

    case "navigate:dashboard":
      window.location.href = "/admin/boardroom.html";
      break;

    case "activate:godmode":
      document.body.classList.add("god-mode");
      break;

    case "open:reservations":
      document.dispatchEvent(new Event("openReservations"));
      break;

    case "list:services":
      window.location.href = "/masaj.html";
      break;
  }

});

// ✨ VOICE OVERLAY (JARVIS EFFECT)
SantisBus.on(CHANNELS.AURELIA_HEARD, ({ text }) => {
  const el = document.createElement("div");
  el.className = "voice-overlay";
  el.innerText = "🎙️ " + text;

  document.body.appendChild(el);

  setTimeout(() => el.remove(), 2000);
});

// Visual Intent Flash logic is natively handled by the primary boardroom hook
// but could be included here as global standard fallback
SantisBus.on(CHANNELS.AURELIA_INTENT, () => {
    if (!document.body.classList.contains("intent-flash")) {
        document.body.classList.add("intent-flash");
        setTimeout(() => {
          document.body.classList.remove("intent-flash");
        }, 300);
    }
});
