/**
 * santis-oracle-execution-guard.js
 * Read-only client wrapper for guarded Oracle execution planning.
 */
import { SantisOracleActionMemoryClient } from './santis-oracle-action-memory-client.js';

export class SantisOracleExecutionGuard {
  constructor({
    client = new SantisOracleActionMemoryClient(),
    limit = 250,
  } = {}) {
    this.client = client;
    this.limit = limit;
  }

  async read() {
    return this.client.readExecutionGuard({ limit: this.limit });
  }
}
