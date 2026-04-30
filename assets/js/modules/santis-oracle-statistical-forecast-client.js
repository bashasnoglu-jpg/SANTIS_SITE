/**
 * santis-oracle-statistical-forecast-client.js
 * Read-only client for Oracle statistical forecast baseline.
 */
export class SantisOracleStatisticalForecastClient {
  constructor({
    baseUrl = 'http://localhost:3030/api/v1/oracle/statistical-forecast',
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
