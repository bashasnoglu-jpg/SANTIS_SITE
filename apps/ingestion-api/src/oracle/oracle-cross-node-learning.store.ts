import {
  DefaultOracleNodeContext,
} from "./oracle-action-memory.contract.js";
import { oracleGlobalAggregationStore } from "./oracle-global-aggregation.store.js";
import type { OracleActionMemoryRecord } from "./oracle-action-memory.contract.js";
import type { OracleNodeContext } from "./oracle-node.contract.js";
import type {
  OracleCrossNodeLearning,
  OracleCrossNodePattern,
  OracleLearningTransfer,
} from "./oracle-cross-node-learning.contract.js";

type PatternBucket = {
  sourceNode: OracleNodeContext;
  suggestedAction: string;
  records: OracleActionMemoryRecord[];
  approvedCount: number;
};

export class OracleCrossNodeLearningStore {
  evaluate(records: OracleActionMemoryRecord[]): OracleCrossNodeLearning {
    const aggregation = oracleGlobalAggregationStore.aggregate(records);
    const patterns = this.detectPatterns(records);
    const targetNodes = this.resolveTargetNodes(records);
    const transfers = patterns.flatMap((pattern) =>
      targetNodes
        .filter((targetNode) => targetNode.nodeId !== pattern.sourceNodeId)
        .map((targetNode) => this.createTransfer(pattern, targetNode, aggregation.globalEscalationRate))
    );

    return {
      patternCount: patterns.length,
      transferCount: transfers.length,
      globalCalibration: {
        approvalRate: aggregation.globalApprovalRate,
        escalationRate: aggregation.globalEscalationRate,
        confidenceFloor: aggregation.globalEscalationRate >= 30 ? 45 : 55,
        confidenceCeiling: aggregation.globalEscalationRate >= 30 ? 82 : 92,
      },
      patterns,
      transfers: transfers.slice(0, 6),
      networkStrategy: this.buildNetworkStrategy(patterns, transfers, aggregation.globalEscalationRate),
    };
  }

  detectPatterns(records: OracleActionMemoryRecord[]): OracleCrossNodePattern[] {
    const buckets = new Map<string, PatternBucket>();

    records.forEach((record) => {
      const node = record.node || DefaultOracleNodeContext;
      const key = `${node.nodeId}:${record.suggestedAction}`;
      const bucket = buckets.get(key) || {
        sourceNode: node,
        suggestedAction: record.suggestedAction,
        records: [],
        approvedCount: 0,
      };

      bucket.records.push(record);
      if (record.decision === "approved") bucket.approvedCount += 1;
      buckets.set(key, bucket);
    });

    return Array.from(buckets.values())
      .map((bucket) => {
        const approvalRate = this.toPercentage(bucket.approvedCount, bucket.records.length);

        return {
          patternId: this.createPatternId(bucket.sourceNode.nodeId, bucket.suggestedAction),
          sourceNodeId: bucket.sourceNode.nodeId,
          sourceNodeCode: bucket.sourceNode.nodeCode,
          suggestedAction: bucket.suggestedAction,
          approvalRate,
          sampleSize: bucket.records.length,
          evidence: this.resolveEvidence(bucket.records),
        };
      })
      .filter((pattern) => pattern.approvalRate >= 50 && pattern.sampleSize >= 1)
      .sort((a, b) => b.approvalRate - a.approvalRate || b.sampleSize - a.sampleSize)
      .slice(0, 5);
  }

  createTransfer(
    pattern: OracleCrossNodePattern,
    targetNode: OracleNodeContext,
    globalEscalationRate: number,
  ): OracleLearningTransfer {
    const contextFit = this.resolveContextFit(targetNode, pattern);
    const riskBoundary = this.resolveRiskBoundary(globalEscalationRate, contextFit);
    const riskPenalty = riskBoundary === "high" ? 18 : riskBoundary === "medium" ? 10 : 4;
    const adjustedConfidence = this.clamp(
      Math.round((pattern.approvalRate * contextFit) / 100 - riskPenalty),
      globalEscalationRate >= 30 ? 45 : 55,
      globalEscalationRate >= 30 ? 82 : 92,
    );

    return {
      transferId: `${pattern.patternId}->${targetNode.nodeId}`,
      patternId: pattern.patternId,
      targetNodeId: targetNode.nodeId,
      targetNodeRole: targetNode.role,
      contextFit,
      baseConfidence: pattern.approvalRate,
      adjustedConfidence,
      riskBoundary,
      recommendation: this.buildTransferRecommendation(pattern, targetNode, adjustedConfidence, riskBoundary),
    };
  }

  resolveTargetNodes(records: OracleActionMemoryRecord[]): OracleNodeContext[] {
    const nodes = new Map<string, OracleNodeContext>();
    records.forEach((record) => {
      const node = record.node || DefaultOracleNodeContext;
      nodes.set(node.nodeId, node);
    });

    if (!nodes.has("dubai-launch")) {
      nodes.set("dubai-launch", {
        nodeId: "dubai-launch",
        nodeCode: "DXB",
        location: "Dubai",
        region: "UAE",
        role: "future",
      });
    }

    if (!nodes.has("partner-spa-network")) {
      nodes.set("partner-spa-network", {
        nodeId: "partner-spa-network",
        nodeCode: "PARTNER",
        location: "Partner Spa Network",
        region: "Global",
        role: "partner",
      });
    }

    return Array.from(nodes.values());
  }

  resolveContextFit(targetNode: OracleNodeContext, pattern: OracleCrossNodePattern): number {
    let fit = targetNode.role === "future" ? 74 : 82;
    if (targetNode.role === "partner") fit -= 6;
    if (pattern.suggestedAction.toLowerCase().includes("concierge")) fit += 8;
    if (pattern.suggestedAction.toLowerCase().includes("sovereign")) fit += 6;
    return this.clamp(fit, 45, 95);
  }

  resolveRiskBoundary(globalEscalationRate: number, contextFit: number): "low" | "medium" | "high" {
    if (globalEscalationRate >= 35 || contextFit < 58) return "high";
    if (globalEscalationRate >= 18 || contextFit < 72) return "medium";
    return "low";
  }

  buildTransferRecommendation(
    pattern: OracleCrossNodePattern,
    targetNode: OracleNodeContext,
    adjustedConfidence: number,
    riskBoundary: "low" | "medium" | "high",
  ): string {
    if (riskBoundary === "high") {
      return `Do not auto-transfer "${pattern.suggestedAction}" to ${targetNode.location}; require local validation and HACI approval.`;
    }

    return `Transfer "${pattern.suggestedAction}" to ${targetNode.location} as a monitored recommendation with ${adjustedConfidence}% adjusted confidence.`;
  }

  buildNetworkStrategy(
    patterns: OracleCrossNodePattern[],
    transfers: OracleLearningTransfer[],
    globalEscalationRate: number,
  ): string {
    if (patterns.length === 0) {
      return "No cross-node pattern is strong enough yet. Continue collecting human decisions before transferring learning.";
    }

    const strongestTransfer = [...transfers].sort((a, b) => b.adjustedConfidence - a.adjustedConfidence)[0];
    if (!strongestTransfer) {
      return "Patterns exist, but no target node is available for contextual transfer.";
    }

    if (globalEscalationRate >= 30) {
      return "Network learning is active, but escalation pressure requires conservative confidence ceilings and human approval gates.";
    }

    return `Use ${strongestTransfer.patternId} as the lead network learning candidate; apply context fit before node-specific strategy activation.`;
  }

  resolveEvidence(records: OracleActionMemoryRecord[]): string[] {
    return Array.from(new Set(records.flatMap((record) => record.evidence || []))).slice(0, 3);
  }

  createPatternId(nodeId: string, suggestedAction: string): string {
    return `${nodeId}-${suggestedAction}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  toPercentage(part: number, total: number): number {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  }
}

export const oracleCrossNodeLearningStore = new OracleCrossNodeLearningStore();
