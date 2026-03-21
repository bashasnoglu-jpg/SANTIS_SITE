// ===============================
// 👁️ GOD'S EYE DASHBOARD
// ===============================

import * as echarts from 'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.esm.min.js';
import { SantisBus, CHANNELS } from "../../assets/js/core/santis-bus.js";
import { recallLast } from "../../assets/js/core/aurelia-memory.js";

let chart;
let ws;
let revenueData = [];
let labels = [];

export function initBoardroom() {
  const el = document.getElementById("santis-pulse-canvas");
  if (!el) return;
  chart = echarts.init(el);
  initChart();
  connectSocket();
}

function initChart() {
  chart.setOption({
    backgroundColor: "transparent",
    xAxis: { type: "category", data: [] },
    yAxis: { type: "value" },
    series: [{ 
      name: "Revenue", 
      type: "line", 
      smooth: true, 
      data: [],
      itemStyle: { color: '#D4AF37' },
      lineStyle: { width: 3, shadowBlur: 10, shadowColor: 'rgba(212, 175, 55, 0.5)' }
    }]
  });
}

function connectSocket() {
  ws = new WebSocket("ws://localhost:8080/ws/god-mode");

  ws.onopen = () => {
    console.log("🟢 God Mode Connected");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "LIVE_PULSE") {
      SantisBus.emit("metrics:update", data);
    }
  };

  ws.onclose = () => {
    console.warn("🔴 Socket closed. Reconnecting...");
    setTimeout(connectSocket, 2000);
  };
}

function updateAureliaPanel(aurelia) {
  const statusEl = document.getElementById("aurelia-status") || document.getElementById("insights-status");
  const intentEl = document.getElementById("aurelia-intent");
  const heardEl = document.getElementById("aurelia-heard");
  
  if (statusEl) statusEl.innerText = aurelia.status;
  if (intentEl) intentEl.innerText = aurelia.lastIntent || "-";
  if (heardEl) heardEl.innerText = aurelia.lastHeardText || "-";
}

// Visual Intelligence Reaction
SantisBus.on("aurelia:intent", ({ intent }) => {
  const el = document.body;
  el.classList.add("intent-flash");
  
  setTimeout(() => {
    el.classList.remove("intent-flash");
  }, 300);
});

// System Alert
SantisBus.on("system:alert", (alert) => {
  console.log("🦅 SYSTEM AWARENESS:", alert.type);
});

SantisBus.on("metrics:update", (payload) => {
  const { metrics, aurelia } = payload;
  if (!metrics) return;

  if (aurelia && aurelia.status === "PROCESSING") {
    SantisBus.emit("aurelia:status", { status: "RESPONDING" });
  }

  // Anomaly alert loop
  if (metrics.revenue > 10000) {
    SantisBus.emit("system:alert", { type: "REVENUE_SPIKE" });
  }

  if (aurelia) updateAureliaPanel(aurelia);

  const recentCommands = recallLast(5);
  const memEl = document.getElementById("aurelia-memory");
  if (memEl && recentCommands.length > 0) {
    memEl.innerHTML = recentCommands
      .map(cmd => `<span style="color:#00FFC2;">${new Date(cmd.timestamp).toLocaleTimeString('tr-TR', {hour12:false})}</span> → ${cmd.text} <span style="opacity:0.5">(${cmd.intent})</span>`)
      .join("<br>");
  }

  const time = new Date(payload.timestamp).toLocaleTimeString('tr-TR', { hour12: false });
  labels.push(time);
  revenueData.push(metrics.revenue);

  if (labels.length > 20) {
    labels.shift();
    revenueData.shift();
  }

  if (chart) {
    chart.setOption({
      xAxis: { data: labels },
      series: [{ data: revenueData }]
    });
  }

  updateHeader(metrics);
});

function updateHeader(metrics) {
  const revEl = document.getElementById("global-revenue");
  if (revEl) {
    revEl.innerText = "€" + metrics.revenueForecast.toLocaleString('en-US', {minimumFractionDigits: 2});
  }
}

// Auto init if loaded independently
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBoardroom);
} else {
    initBoardroom();
}

export const mount = initBoardroom;
