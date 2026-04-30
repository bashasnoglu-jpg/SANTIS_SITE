/**
 * santis-oracle-node-context.js
 * Resolves the local Oracle node identity for multi-node learning sync.
 */
export class SantisOracleNodeContext {
  constructor(storageKey = 'santis_oracle_node_context_v1') {
    this.storageKey = storageKey;
    this.defaultNode = {
      nodeId: 'budva-primary',
      nodeCode: 'BUDVA',
      location: 'Budva',
      region: 'Montenegro',
      role: 'primary',
    };
  }

  resolve() {
    return {
      ...this.defaultNode,
      ...this.readStoredNode(),
      ...this.readDomNode(),
    };
  }

  readStoredNode() {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      return this.sanitize(parsed);
    } catch (error) {
      console.warn('[Santis Oracle Node] Could not read stored node context.', error);
      return {};
    }
  }

  readDomNode() {
    const source = document.documentElement.dataset;
    return this.sanitize({
      nodeId: source.oracleNodeId,
      nodeCode: source.oracleNodeCode,
      location: source.oracleNodeLocation,
      region: source.oracleNodeRegion,
      role: source.oracleNodeRole,
    });
  }

  sanitize(candidate) {
    return Object.fromEntries(
      Object.entries(candidate || {}).filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
    );
  }
}
