/**
 * 🦅 Santis OS - Sovereign Debt Matrix Engine
 * V1.0 - Production-grade Persistence, Guard & Sorter
 * Architecture: Deterministic, SSR-Safe, Local-First
 */

// 🛡️ 1. Validator Guard (Memory Corruption Shield)
export function normalizeDebtRecord(record) {
  if (!record || typeof record !== 'object') {
     console.warn('⚠️ [Sovereign Debt] Invalid record dropped:', record);
     record = {};
  }

  return {
    id: String(record.id ?? `DEBT-GHOST-${Math.floor(Math.random()*10000)}`),
    title: String(record.title ?? 'Untitled Autonomous Debt'),
    category: record.category ?? 'Hygiene',
    severity: record.severity ?? 'P4',
    status: record.status ?? 'OPEN',
    owner: record.owner ?? 'Unassigned',
    reason: String(record.reason ?? 'Automatically generated/Fallback reason'),
    impact: String(record.impact ?? 'Undefined impact contour'),
    nextAction: String(record.nextAction ?? 'Investigate origin'),
    evidence: Array.isArray(record.evidence) ? record.evidence : [],
    scope: Array.isArray(record.scope) ? record.scope : [],
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    resolvedAt: record.resolvedAt ?? null,
    discoveredBy: String(record.discoveredBy ?? 'Shadow Cluster Observer'),
    priorityScore: Number.isFinite(record.priorityScore) ? record.priorityScore : 0,
  };
}

// 🧮 2. Deterministic Sorter
export function sortDebtRecords(records) {
  // Sort by priorityScore DESC. If score limits collide -> order by Age (Newest first)
  return [...records].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// 💾 3. Persistence Layer & IO Loader
export const SovereignDebtEngine = {
  MANIFEST: 'SANTIS_V1.1_DEBT_MATRIX',
  SEED_ENDPOINT: '/assets/json/debt-seed.json',

  /**
   * Initializes Sovereign Debt Board context.
   * Order of truth: LocalStorage -> Fetch Seed -> Empty array mitigation.
   */
  async loadMatrix() {
    try {
      const memory = localStorage.getItem(this.MANIFEST);
      
      if (memory) {
        console.log('🛡️ [Sovereign Debt] Restoring from offline persistence (Ghost Memory)...');
        const parsed = JSON.parse(memory);
        const normalized = parsed.map(normalizeDebtRecord);
        return sortDebtRecords(normalized);
      }

      console.warn('🌱 [Sovereign Debt] No local memory footprint found. Bootstrapping Seed Identity...');
      const response = await fetch(this.SEED_ENDPOINT);
      
      if (!response.ok) {
          throw new Error(`HTTP ${response.status} resolving Seed endpoint`);
      }
      
      const data = await response.json();
      const recordsToProcess = data.records || [];
      const normalizedMatrix = recordsToProcess.map(normalizeDebtRecord);
      const sortedMatrix = sortDebtRecords(normalizedMatrix);
      
      // Commit original seed to persistence
      this.commit(sortedMatrix);
      
      return sortedMatrix;
      
    } catch (err) {
      console.error('🔥 [Sovereign Debt] FATAL ERROR IN LOADER MATRIX:', err);
      return []; // Time-travel UI must NOT crash, return empty sealed array.
    }
  },

  /**
   * Immutable commit. Flushes new Debt state to local memory.
   * Crucial for bridging "Time Travel" to actual Disk IO logic limits.
   */
  commit(records) {
    try {
      if (!Array.isArray(records)) throw new Error('Data is not iterable');
      localStorage.setItem(this.MANIFEST, JSON.stringify(records));
      console.log(`💾 [Sovereign Debt] State sealed. ${records.length} tactical records preserved.`);
    } catch (err) {
      console.error('🔥 [Sovereign Debt] FAILED TO WRITE, QUOTA EXCEEDED OR DOM ERROR:', err);
    }
  },

  /**
   * Factory Reset (In case Ghost rendering or Time Travel corrupts the matrix completely)
   */
  async purgeAndReset() {
      console.warn('☢️ [Sovereign Debt] PURGE SEQUENCE INITIATED. Restoring to Original Seed...');
      localStorage.removeItem(this.MANIFEST);
      return await this.loadMatrix();
  }
};
