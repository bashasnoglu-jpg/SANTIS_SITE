/**
 * santis-oracle-statistical-forecast-client.js
 * Read-only client for Oracle statistical forecast baseline.
 * [SEC-01] localhost:3030 kaldırıldı — window.__API_BASE__ veya relative path kullanılır.
 */
function _resolveApiBase() {
  return (typeof window !== 'undefined' && window.__API_BASE__)
    ? window.__API_BASE__.replace(/\/$/, '')
    : '/api/v1';
}

export class SantisOracleStatisticalForecastClient {
  constructor({
    baseUrl = `${_resolveApiBase()}/oracle/statistical-forecast`,
  } = {}) {
    this.baseUrl = baseUrl;
  }

  async read({ limit = 90 } = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Oracle statistical forecast read failed: ${response.status}`);
    }

    const body = await response.json();
    return body.data || null;
  }
}
