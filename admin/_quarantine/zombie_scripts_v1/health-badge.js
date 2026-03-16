async function checkSiteHealthAlert() {
  try {
    const res = await fetch("/api/audit-history");
    if (!res.ok) return;
    const data = await res.json();
    const alert = data.alert || data?.data?.alert;
    if (alert) {
      showHealthBadge();
    }
  } catch (e) {
    console.warn("Health check failed", e);
  }
}

function showHealthBadge() {
  if (document.getElementById("healthAlertBadge")) return;
  const badge = document.createElement("div");
  badge.id = "healthAlertBadge";
  badge.innerHTML = "🔴 Site Sağlığı Riskli";
  badge.style.position = "fixed";
  badge.style.top = "15px";
  badge.style.right = "20px";
  badge.style.background = "#b91c1c";
  badge.style.color = "white";
  badge.style.padding = "10px 14px";
  badge.style.borderRadius = "12px";
  badge.style.fontWeight = "bold";
  badge.style.boxShadow = "0 0 10px rgba(0,0,0,0.4)";
  badge.style.zIndex = "9999";
  badge.style.cursor = "pointer";
  badge.onclick = () => window.location.href = "/admin/audit-history.html";
  document.body.appendChild(badge);
}

document.addEventListener("DOMContentLoaded", checkSiteHealthAlert);
