/**
 * santis-oracle-action-memory-client.js
 * Server-side Oracle action memory transport for the Boardroom.
 */
export class SantisOracleActionMemoryClient {
  constructor({
    baseUrl = 'http://localhost:3030/api/v1/oracle/action-memory',
  } = {}) {
    this.baseUrl = baseUrl;
  }

  async readAll() {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Oracle memory read failed: ${response.status}`);
    }

    const body = await response.json();
    return Array.isArray(body.data) ? body.data : [];
  }

  async recordDecision(decisionEvent) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(decisionEvent),
    });

    if (!response.ok) {
      throw new Error(`Oracle memory write failed: ${response.status}`);
    }

    const body = await response.json();
    return body.data;
  }
}
