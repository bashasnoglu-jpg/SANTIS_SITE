/**
 * santis-oracle-strategy-simulator.js
 * Read-only client wrapper for Oracle strategy simulation.
 */
import { SantisOracleActionMemoryClient } from './santis-oracle-action-memory-client.js';

export class SantisOracleStrategySimulator {
  constructor({
    client = new SantisOracleActionMemoryClient(),
    limit = 250,
  } = {}) {
    this.client = client;
    this.limit = limit;
  }

  async read() {
    return this.client.readStrategySimulation({ limit: this.limit });
  }
}
