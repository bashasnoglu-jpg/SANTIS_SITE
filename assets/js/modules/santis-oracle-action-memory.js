/**
 * santis-oracle-action-memory.js
 * Local Boardroom memory for human decisions on Oracle actions.
 */
import { SantisOracleActionMemoryClient } from './santis-oracle-action-memory-client.js';

export class SantisOracleActionMemory {
  constructor(storageKey = 'santis_oracle_action_memory_v1', client = new SantisOracleActionMemoryClient()) {
    this.storageKey = storageKey;
    this.client = client;
    this.hydrateFromServer();
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

    this.client.recordDecision(decisionEvent)
      .then((serverRecord) => {
        if (!serverRecord) return;

        this.upsertLocal(serverRecord);
        window.dispatchEvent(new CustomEvent('santis:oracle:action-memory:synced', {
          detail: {
            record: serverRecord,
            memory: this.readAll(),
          },
        }));
      })
      .catch((error) => {
        console.warn('[Santis Oracle Memory] Server sync failed. Local memory retained.', error);
      });

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

  hydrateFromServer() {
    this.client.readAll()
      .then((serverMemory) => {
        if (!Array.isArray(serverMemory)) return;

        this.writeAll(this.mergeMemory(serverMemory, this.readAll()).slice(0, 50));
        window.dispatchEvent(new CustomEvent('santis:oracle:action-memory:hydrated', {
          detail: {
            memory: this.readAll(),
          },
        }));
      })
      .catch((error) => {
        console.warn('[Santis Oracle Memory] Server hydration failed. Using local memory.', error);
      });
  }

  upsertLocal(record) {
    const memory = this.readAll();
    const existingIndex = memory.findIndex((entry) => entry.actionId === record.actionId);

    if (existingIndex >= 0) {
      memory[existingIndex] = record;
    } else {
      memory.unshift(record);
    }

    this.writeAll(memory.slice(0, 50));
  }

  mergeMemory(primaryMemory, fallbackMemory) {
    const merged = new Map();

    [...fallbackMemory, ...primaryMemory].forEach((record) => {
      if (!record?.actionId) return;
      merged.set(record.actionId, record);
    });

    return Array.from(merged.values())
      .sort((a, b) => Date.parse(b.recordedAt || b.timestamp || 0) - Date.parse(a.recordedAt || a.timestamp || 0));
  }
}
