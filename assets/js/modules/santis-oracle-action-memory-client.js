/**
 * santis-oracle-action-memory-client.js
 * Server-side Oracle action memory transport for the Boardroom.
 *
 * [SEC-01] URL Resolution:
 * Hardcoded localhost:3030 kaldırıldı. API base URL şu öncelikle çözülür:
 *   1. window.__API_BASE__  — prod/staging'de sayfa render'ı sırasında set edilmeli
 *   2. '/api/v1'            — same-origin fallback (Vercel, Docker, etc.)
 * Geliştirme ortamında window.__API_BASE__ = 'http://localhost:3030/api/v1' set et.
 */

function _resolveApiBase() {
  return (typeof window !== 'undefined' && window.__API_BASE__)
    ? window.__API_BASE__.replace(/\/$/, '')
    : '/api/v1';
}

export class SantisOracleActionMemoryClient {
  constructor({
    baseUrl               = `${_resolveApiBase()}/oracle/action-memory`,
    nodeSyncUrl           = `${_resolveApiBase()}/oracle/node-sync`,
    globalAggregationUrl  = `${_resolveApiBase()}/oracle/global-aggregation`,
    crossNodeLearningUrl  = `${_resolveApiBase()}/oracle/cross-node-learning`,
    strategySimulationUrl = `${_resolveApiBase()}/oracle/strategy-simulation`,
    executionGuardUrl     = `${_resolveApiBase()}/oracle/execution-guard`,
  } = {}) {
    this.baseUrl               = baseUrl;
    this.nodeSyncUrl           = nodeSyncUrl;
    this.globalAggregationUrl  = globalAggregationUrl;
    this.crossNodeLearningUrl  = crossNodeLearningUrl;
    this.strategySimulationUrl = strategySimulationUrl;
    this.executionGuardUrl     = executionGuardUrl;
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

  async readCrossNodeLearning({ limit = 250 } = {}) {
    const url = new URL(this.crossNodeLearningUrl);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Oracle cross-node learning read failed: ${response.status}`);
    }

    const body = await response.json();
    return body.data || null;
  }

  async readStrategySimulation({ limit = 250 } = {}) {
    const url = new URL(this.strategySimulationUrl);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Oracle strategy simulation read failed: ${response.status}`);
    }

    const body = await response.json();
    return body.data || null;
  }

  async readExecutionGuard({ limit = 250 } = {}) {
    const url = new URL(this.executionGuardUrl);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Oracle execution guard read failed: ${response.status}`);
    }

    const body = await response.json();
    return body.data || null;
  }
}
