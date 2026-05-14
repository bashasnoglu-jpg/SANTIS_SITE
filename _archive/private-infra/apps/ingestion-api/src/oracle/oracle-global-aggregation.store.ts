import {
  OracleActionMemoryRecord,
  DefaultOracleNodeContext,
} from "./oracle-action-memory.contract.js";
import { OracleNodeSyncSnapshot } from "./oracle-node.contract.js";
import {
  OracleGlobalAggregation,
  OracleGlobalSignal,
} from "./oracle-global-aggregation.contract.js";
import { oracleNodeSyncStore } from "./oracle-node-sync.store.js";

export class OracleGlobalAggregationStore {
  aggregate(records: OracleActionMemoryRecord[]): OracleGlobalAggregation {
    const nodes = oracleNodeSyncStore.buildSnapshots(records);
    const decisionCount = records.length;
    const approvedCount = records.filter((record) => record.decision === "approved").length;
    const escalatedCount = records.filter((record) => record.decision === "escalated").length;
    const globalApprovalRate = this.toPercentage(approvedCount, decisionCount);
    const globalEscalationRate = this.toPercentage(escalatedCount, decisionCount);
    const topApprovalNode = this.resolveTopApprovalNode(nodes);
    const leadingAction = this.resolveLeadingApprovedAction(records);
    const generatedAt = new Date().toISOString();
    const signals = this.buildSignals({
      records,
      nodes,
      topApprovalNode,
      leadingAction,
      globalApprovalRate,
      globalEscalationRate,
      generatedAt,
    });

    return {
      nodeCount: nodes.length,
      decisionCount,
      globalApprovalRate,
      globalEscalationRate,
      topApprovalNode,
      leadingAction,
      crossNodeRecommendation: this.buildCrossNodeRecommendation({
        decisionCount,
        topApprovalNode,
        leadingAction,
        globalApprovalRate,
        globalEscalationRate,
      }),
      nodes,
      signals,
    };
  }

  resolveTopApprovalNode(nodes: OracleNodeSyncSnapshot[]): OracleNodeSyncSnapshot | null {
    const rankedNodes = nodes
      .filter((node) => node.decisionCount > 0)
      .sort((a, b) => {
        const approvalDelta = this.toPercentage(b.approvedCount, b.decisionCount)
          - this.toPercentage(a.approvedCount, a.decisionCount);

        if (approvalDelta !== 0) return approvalDelta;
        return b.decisionCount - a.decisionCount;
      });

    return rankedNodes[0] || null;
  }

  resolveLeadingApprovedAction(records: OracleActionMemoryRecord[]): string | null {
    const counts = new Map<string, number>();

    records
      .filter((record) => record.decision === "approved")
      .forEach((record) => {
        counts.set(record.suggestedAction, (counts.get(record.suggestedAction) || 0) + 1);
      });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }

  buildSignals({
    records,
    nodes,
    topApprovalNode,
    leadingAction,
    globalApprovalRate,
    globalEscalationRate,
    generatedAt,
  }: {
    records: OracleActionMemoryRecord[];
    nodes: OracleNodeSyncSnapshot[];
    topApprovalNode: OracleNodeSyncSnapshot | null;
    leadingAction: string | null;
    globalApprovalRate: number;
    globalEscalationRate: number;
    generatedAt: string;
  }): OracleGlobalSignal[] {
    const signals: OracleGlobalSignal[] = [];
    const recommendedNodeIds = this.resolveRecommendedNodeIds(nodes);

    if (topApprovalNode && leadingAction) {
      const approvalRate = this.toPercentage(topApprovalNode.approvedCount, topApprovalNode.decisionCount);
      signals.push({
        signalId: "global-approval-momentum",
        title: `${topApprovalNode.node.location} approval momentum`,
        detail: `${topApprovalNode.node.nodeCode} is leading with ${approvalRate}% approval. Prioritize "${leadingAction}" as a candidate play for launch and partner nodes.`,
        confidence: Math.min(96, Math.max(62, approvalRate)),
        sourceNodeIds: [topApprovalNode.node.nodeId],
        recommendedNodeIds,
        generatedAt,
      });
    }

    if (globalEscalationRate >= 30) {
      signals.push({
        signalId: "global-risk-sensitivity",
        title: "Cross-node risk sensitivity rising",
        detail: `${globalEscalationRate}% of recent Oracle decisions were escalated. Keep HACI review active before scaling high-risk playbooks.`,
        confidence: Math.min(94, 60 + globalEscalationRate),
        sourceNodeIds: this.resolveSourceNodeIds(records),
        recommendedNodeIds,
        generatedAt,
      });
    }

    if (records.length > 0 && nodes.length <= 1) {
      const node = nodes[0]?.node || DefaultOracleNodeContext;
      signals.push({
        signalId: "single-node-learning-baseline",
        title: "Single-node learning baseline ready",
        detail: `${node.location} has ${records.length} replayable Oracle decisions. Future nodes can bootstrap from this memory before local traffic matures.`,
        confidence: Math.min(90, Math.max(55, globalApprovalRate || 55)),
        sourceNodeIds: [node.nodeId],
        recommendedNodeIds,
        generatedAt,
      });
    }

    if (signals.length === 0) {
      signals.push({
        signalId: "global-aggregation-standby",
        title: "Global aggregation standing by",
        detail: "Oracle memory has no decision density yet. Approvals, dismissals, and escalations will become cross-node learning signals as they arrive.",
        confidence: 50,
        sourceNodeIds: [],
        recommendedNodeIds,
        generatedAt,
      });
    }

    return signals.slice(0, 3);
  }

  buildCrossNodeRecommendation({
    decisionCount,
    topApprovalNode,
    leadingAction,
    globalApprovalRate,
    globalEscalationRate,
  }: {
    decisionCount: number;
    topApprovalNode: OracleNodeSyncSnapshot | null;
    leadingAction: string | null;
    globalApprovalRate: number;
    globalEscalationRate: number;
  }): string {
    if (decisionCount === 0) {
      return "Await more human decisions before promoting network-level strategy.";
    }

    if (topApprovalNode && leadingAction && globalApprovalRate >= 70) {
      return `${topApprovalNode.node.location} node is producing strong approval signal; test "${leadingAction}" as a controlled playbook candidate for Dubai and partner launch nodes.`;
    }

    if (globalEscalationRate >= 30) {
      return "Escalation density is high; require human review before applying cross-node learning weights.";
    }

    return "Keep aggregating node-tagged decisions until approval density produces a stronger global playbook signal.";
  }

  resolveSourceNodeIds(records: OracleActionMemoryRecord[]): string[] {
    return Array.from(new Set(records.map((record) => record.node?.nodeId || DefaultOracleNodeContext.nodeId)));
  }

  resolveRecommendedNodeIds(nodes: OracleNodeSyncSnapshot[]): string[] {
    const recommended = nodes
      .filter((node) => node.node.role !== "primary")
      .map((node) => node.node.nodeId);

    return recommended.length > 0 ? recommended : ["dubai-launch", "partner-spa-network"];
  }

  toPercentage(part: number, total: number): number {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  }
}

export const oracleGlobalAggregationStore = new OracleGlobalAggregationStore();
