/**
 * santis-oracle-global-context.js
 * Network-level Oracle context for cross-node aggregation.
 */
export class SantisOracleGlobalContext {
  constructor({
    storageKey = 'santis_oracle_global_context_v1',
    defaults = {},
  } = {}) {
    this.storageKey = storageKey;
    this.defaults = {
      networkId: 'santis-global',
      homeNodeId: 'budva-primary',
      launchNodeIds: ['dubai-launch', 'partner-spa-network'],
      ...defaults,
    };
  }

  resolve() {
    return {
      ...this.defaults,
      ...this.readDomContext(),
      ...this.readStoredContext(),
    };
  }

  readStoredContext() {
    try {
      const raw = window.localStorage?.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.warn('[Oracle Global Context] Failed to read stored context.', error);
      return {};
    }
  }

  readDomContext() {
    const dataset = document.documentElement?.dataset || {};

    return {
      ...(dataset.oracleNetworkId ? { networkId: dataset.oracleNetworkId } : {}),
      ...(dataset.oracleHomeNodeId ? { homeNodeId: dataset.oracleHomeNodeId } : {}),
      ...(dataset.oracleLaunchNodes ? { launchNodeIds: this.parseNodeList(dataset.oracleLaunchNodes) } : {}),
    };
  }

  parseNodeList(value) {
    return String(value)
      .split(',')
      .map((nodeId) => nodeId.trim())
      .filter(Boolean);
  }
}
