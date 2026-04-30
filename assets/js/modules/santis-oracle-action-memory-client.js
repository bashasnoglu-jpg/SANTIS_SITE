/**
 * santis-oracle-action-memory-client.js
 * Server-side Oracle action memory transport for the Boardroom.
 */
export class SantisOracleActionMemoryClient {
  constructor({
    baseUrl = 'http://localhost:3030/api/v1/oracle/action-memory',
    nodeSyncUrl = 'http://localhost:3030/api/v1/oracle/node-sync',
    globalAggregationUrl = 'http://localhost:3030/api/v1/oracle/global-aggregation',
  } = {}) {
    this.baseUrl = baseUrl;
    this.nodeSyncUrl = nodeSyncUrl;
    this.globalAggregationUrl = globalAggregationUrl;
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

  async readNodeSync({ nodeId = 'global', limit = 250 } = {}) {
    const url = new URL(this.nodeSyncUrl);
    url.searchParams.set('nodeId', nodeId);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Oracle node sync read failed: ${response.status}`);
    }

    const body = await response.json();
    return body.data || { nodes: [], decisions: [] };
  }

  async readGlobalAggregation({ limit = 250 } = {}) {
    const url = new URL(this.globalAggregationUrl);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Oracle global aggregation read failed: ${response.status}`);
    }

    const body = await response.json();
    return body.data || null;
  }
}
