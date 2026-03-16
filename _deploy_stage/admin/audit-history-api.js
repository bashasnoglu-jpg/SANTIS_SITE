// Lightweight helper to fetch audit history (JSON array) for charts
async function fetchAuditHistory() {
  const path = "/admin/audit-history";
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
