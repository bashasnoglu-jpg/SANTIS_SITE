async function loadHealthScore() {
  try {
    const res = await fetch("/api/health-score");
    if (!res.ok) return;
    const data = await res.json();
    showHealthScore(data.score ?? 100);
  } catch (e) {
    console.warn("Health score alınamadı", e);
  }
}

async function loadHealthHistory() {
  try {
    const res = await fetch("/api/health-history");
    if (!res.ok) return;
    const data = await res.json();
    drawHealthSparkline(data.scores || [], data.reports || []);
  } catch (e) {
    console.warn("Health history alınamadı", e);
  }
}

function drawHealthSparkline(scores, reports = []) {
  if (!scores || !scores.length) return;
  if (document.getElementById("healthSparkline")) return;
  const canvas = document.createElement("canvas");
  canvas.id = "healthSparkline";
  canvas.width = 140;
  canvas.height = 50;
  canvas.style.position = "fixed";
  canvas.style.top = "60px";
  canvas.style.left = "20px";
  canvas.style.zIndex = "9999";
  canvas.style.cursor = "crosshair";
  canvas.title = "Site sağlık trendi";

  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const max = 100;
  const min = 0;
  const stepX = scores.length === 1 ? 0 : canvas.width / (scores.length - 1);

  // Çizgi
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#38bdf8";

  scores.forEach((score, i) => {
    const x = i * stepX;
    const y = canvas.height - ((score - min) / (max - min)) * canvas.height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  // Kırmızı alarm noktaları (10 puandan fazla düşüş)
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] < scores[i - 1] - 10) {
      const x = i * stepX;
      const y = canvas.height - ((scores[i] - min) / (max - min)) * canvas.height;
      ctx.beginPath();
      ctx.fillStyle = "#ef4444";
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Hover tooltip (title)
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.max(0, Math.min(scores.length - 1, Math.round(x / stepX)));
    if (scores[index] !== undefined) {
      canvas.title = `Tarama #${index + 1} → Skor: ${scores[index]}`;
    }
  });

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.max(0, Math.min(scores.length - 1, Math.round(x / stepX)));
    const report = reports[index];
    if (report) {
      window.open(`/reports/${report}`, "_blank");
    } else {
      window.open("/reports/link_audit_report.html", "_blank");
    }
  });
}

function showHealthScore(score) {
  if (document.getElementById("healthScoreBox")) return;
  const box = document.createElement("div");
  box.id = "healthScoreBox";
  box.style.position = "fixed";
  box.style.top = "15px";
  box.style.left = "20px";
  box.style.padding = "10px 14px";
  box.style.borderRadius = "12px";
  box.style.fontWeight = "bold";
  box.style.zIndex = "9999";
  box.style.boxShadow = "0 0 10px rgba(0,0,0,0.35)";
  box.style.color = "white";
  let color = "#16a34a";
  let text = "Mükemmel";
  if (score < 80) { color = "#eab308"; text = "Orta"; }
  if (score < 55) { color = "#dc2626"; text = "Riskli"; }
  box.style.background = color;
  box.innerHTML = `Site Sağlığı: ${score}/100 – ${text}`;
  box.onclick = () => window.location.href = "/admin/audit-history.html";
  document.body.appendChild(box);
}

document.addEventListener("DOMContentLoaded", () => {
  loadHealthScore();
  loadHealthHistory();
});
