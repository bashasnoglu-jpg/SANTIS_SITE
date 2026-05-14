import {
  OracleActionMemoryRecord,
  DefaultOracleNodeContext,
} from "./oracle-action-memory.contract.js";
import {
  OracleNodeContext,
  OracleNodeSyncSnapshot,
} from "./oracle-node.contract.js";

export class OracleNodeSyncStore {
  buildSnapshots(records: OracleActionMemoryRecord[]): OracleNodeSyncSnapshot[] {
    const snapshots = new Map<string, OracleNodeSyncSnapshot>();

    records.forEach((record) => {
      const node = record.node || DefaultOracleNodeContext;
      const existing = snapshots.get(node.nodeId) || this.createSnapshot(node);

      existing.decisionCount += 1;
      if (record.decision === "approved") existing.approvedCount += 1;
      if (record.decision === "dismissed") existing.dismissedCount += 1;
      if (record.decision === "escalated") existing.escalatedCount += 1;

      const currentLatest = existing.latestDecisionAt ? Date.parse(existing.latestDecisionAt) : 0;
      const candidateLatest = Date.parse(record.recordedAt || record.timestamp);
      if (candidateLatest > currentLatest) {
        existing.latestDecisionAt = record.recordedAt || record.timestamp;
      }

      snapshots.set(node.nodeId, existing);
    });

    return Array.from(snapshots.values())
      .sort((a, b) => Date.parse(b.latestDecisionAt || "0") - Date.parse(a.latestDecisionAt || "0"));
  }

  filterByNode(records: OracleActionMemoryRecord[], nodeId?: string): OracleActionMemoryRecord[] {
    if (!nodeId || nodeId === "global") return records;

    return records.filter((record) => (record.node?.nodeId || DefaultOracleNodeContext.nodeId) === nodeId);
  }

  createSnapshot(node: OracleNodeContext): OracleNodeSyncSnapshot {
    return {
      node,
      decisionCount: 0,
      approvedCount: 0,
      dismissedCount: 0,
      escalatedCount: 0,
      latestDecisionAt: null,
    };
  }
}

export const oracleNodeSyncStore = new OracleNodeSyncStore();
