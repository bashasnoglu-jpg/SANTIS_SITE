/**
 * santis-oracle-action-memory.js
 * Local Boardroom memory for human decisions on Oracle actions.
 */
export class SantisOracleActionMemory {
  constructor(storageKey = 'santis_oracle_action_memory_v1') {
    this.storageKey = storageKey;
  }

  recordDecision(decisionEvent) {
    const memory = this.readAll();
    const nextRecord = {
      ...decisionEvent,
      recordedAt: new Date().toISOString(),
    };

    const existingIndex = memory.findIndex((entry) => entry.actionId === nextRecord.actionId);

    if (existingIndex >= 0) {
      memory[existingIndex] = nextRecord;
    } else {
      memory.unshift(nextRecord);
    }

    this.writeAll(memory.slice(0, 50));

    window.dispatchEvent(new CustomEvent('santis:oracle:action-memory:updated', {
      detail: {
        record: nextRecord,
        memory: this.readAll(),
      },
    }));

    return nextRecord;
  }

  getDecision(actionId) {
    return this.readAll().find((entry) => entry.actionId === actionId) || null;
  }

  readAll() {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('[Santis Oracle Memory] Could not read action memory.', error);
      return [];
    }
  }

  writeAll(memory) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(memory));
    } catch (error) {
      console.warn('[Santis Oracle Memory] Could not write action memory.', error);
    }
  }
}
