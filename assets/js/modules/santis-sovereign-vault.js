const STORAGE_KEY = "santis:journey:v1";

export class SantisSovereignVault {
  static saveJourney(payload) {
    try {
      const data = {
        ...payload,
        updatedAt: Date.now()
      };

      window.__SANTIS_VAULT_CACHE__ = data;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("[Vault] save failed", error);
    }
  }

  static loadJourney() {
    try {
      if (window.__SANTIS_VAULT_CACHE__) {
        return window.__SANTIS_VAULT_CACHE__;
      }

      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) return null;

      const parsed = JSON.parse(raw);

      window.__SANTIS_VAULT_CACHE__ = parsed;

      return parsed;
    } catch (error) {
      console.warn("[Vault] load failed", error);
      return null;
    }
  }

  static clearJourney() {
    window.__SANTIS_VAULT_CACHE__ = null;
    localStorage.removeItem(STORAGE_KEY);
  }
}
