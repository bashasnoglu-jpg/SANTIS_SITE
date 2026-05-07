/**
 * santis-oracle-execution-outcome-client.js
 * Transport for Oracle execution outcome feedback.
 * [SEC-01] localhost:3030 kaldırıldı — window.__API_BASE__ veya relative path kullanılır.
 */
function _resolveApiBase() {
  return (typeof window !== 'undefined' && window.__API_BASE__)
    ? window.__API_BASE__.replace(/\/$/, '')
    : '/api/v1';
}

export class SantisOracleExecutionOutcomeClient {
  constructor({
    baseUrl = `${_resolveApiBase()}/oracle/execution-outcomes`,
  } = {}) {
    this.baseUrl = baseUrl;
  }

  async readSummary({ limit = 50 } = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Oracle outcome summary read failed: ${response.status}`);
    }

    const body = await response.json();
    return body.data || null;
  }

  async record(outcome) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(outcome),
    });

    if (!response.ok) {
      throw new Error(`Oracle outcome write failed: ${response.status}`);
    }

    const body = await response.json();
    return body.data;
  }
}
