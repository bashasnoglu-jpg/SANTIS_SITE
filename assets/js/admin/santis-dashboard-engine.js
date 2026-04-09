/**
 * ⚰️ DECOMMISSIONED — Sovereign Boardroom V4 replaced this module.
 * Kept as a no-op to prevent errors from stale HTML references.
 * Safe to delete after 2026-05-08 (30-day grace period).
 */
class SantisDashboardEngine {
  constructor() {
    console.warn("⚰️ [Dashboard Engine] Bu modül devre dışı bırakıldı. Yeni adres → /admin/boardroom");
  }
  async init() {}
  async fetchData() {}
  updateUI() {}
  drawSimpleChart() {}
  render() {}
}

window.onload = () => {
  new SantisDashboardEngine().init();
};
