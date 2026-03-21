// assets/js/core/aurelia-voice.js

import { SantisBus, CHANNELS } from "./santis-bus.js";
import "./aurelia-router.js"; // Boot intention routing
import { storeIntent } from "./aurelia-memory.js";

SantisBus.on(CHANNELS.AURELIA_INTENT, (payload) => {
  storeIntent(payload);
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  console.warn("❌ Web Speech API desteklenmiyor");
}

const recognition = new SpeechRecognition();
recognition.lang = "tr-TR";
recognition.continuous = true;
recognition.interimResults = false;

// 🎯 STATUS EVENTS
recognition.onstart = () => {
  SantisBus.emit(CHANNELS.AURELIA_STATUS, { status: "LISTENING" });
};

recognition.onend = () => {
  SantisBus.emit(CHANNELS.AURELIA_STATUS, { status: "IDLE" });
  recognition.start(); // auto-restart
};

// 🎙️ HEARING
recognition.onresult = (event) => {
  const text = event.results[event.results.length - 1][0].transcript.trim();

  SantisBus.emit(CHANNELS.AURELIA_HEARD, {
    text,
    timestamp: Date.now()
  });

  parseIntent(text);
};

// 🧠 INTENT ENGINE (V1)
function parseIntent(text) {
  const t = text.toLowerCase();

  let intent = null;

  if (t.includes("dashboard")) intent = "navigate:dashboard";
  else if (t.includes("rezervasyon")) intent = "open:reservations";
  else if (t.includes("masaj")) intent = "list:services";
  else if (t.includes("god mode") || t.includes("tanrı modu")) intent = "activate:godmode";

  if (!intent) return;

  const payload = {
    intent,
    text,
    confidence: 0.91,
    timestamp: Date.now()
  };

  // Local bus
  SantisBus.emit(CHANNELS.AURELIA_INTENT, payload);

  // Backend sync (fire-and-forget)
  navigator.sendBeacon(
    "/api/v1/aurelia/intent",
    JSON.stringify(payload)
  );
}

// 🚀 START
export function startAurelia() {
  try {
    recognition.start();
  } catch (e) {
    console.warn("Aurelia already running");
  }
}

// Attach to window for arbitrary testing natively via developer tools
window.AureliaVoice = { startAurelia };
