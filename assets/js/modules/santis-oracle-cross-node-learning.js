/**
 * santis-oracle-cross-node-learning.js
 * Read-only client wrapper for Oracle cross-node learning.
 */
import { SantisOracleActionMemoryClient } from './santis-oracle-action-memory-client.js';

export class SantisOracleCrossNodeLearning {
  constructor({
    client = new SantisOracleActionMemoryClient(),
    limit = 250,
  } = {}) {
    this.client = client;
    this.limit = limit;
  }

  async read() {
    return this.client.readCrossNodeLearning({ limit: this.limit });
  }
}
