/**
 * santis-oracle-feedback-weighting.js
 * Scores historical human decisions against a future Oracle action candidate.
 */
export class SantisOracleFeedbackWeighting {
  calculate(actionId, candidate, memory = []) {
    const relevantRecords = memory
      .map((record) => ({
        record,
        similarity: this.calculateSimilarity(actionId, candidate, record),
      }))
      .filter((entry) => entry.similarity > 0.35);

    if (relevantRecords.length === 0) {
      return {
        confidenceDelta: 0,
        riskDelta: 0,
        approvalRate: null,
        similarDecisionCount: 0,
        rationale: '',
      };
    }

    const weighted = relevantRecords.reduce((summary, entry) => {
      const impact = this.resolveDecisionImpact(entry.record.decision);
      const weight = entry.similarity;

      summary.totalWeight += weight;
      summary.approvalWeight += entry.record.decision === 'approved' ? weight : 0;
      summary.confidenceDelta += impact.confidence * weight;
      summary.riskDelta += impact.risk * weight;

      return summary;
    }, {
      totalWeight: 0,
      approvalWeight: 0,
      confidenceDelta: 0,
      riskDelta: 0,
    });

    const approvalRate = weighted.totalWeight > 0
      ? Math.round((weighted.approvalWeight / weighted.totalWeight) * 100)
      : null;

    return {
      confidenceDelta: Math.round(weighted.confidenceDelta),
      riskDelta: Math.round(weighted.riskDelta),
      approvalRate,
      similarDecisionCount: relevantRecords.length,
      rationale: this.buildRationale(approvalRate, relevantRecords.length),
    };
  }

  calculateSimilarity(actionId, candidate, record) {
    if (record.actionId === actionId) return 1;

    const suggestedActionScore = record.suggestedAction === candidate.suggestedAction ? 0.35 : 0;
    const riskScore = record.riskLevel === candidate.riskLevel ? 0.2 : 0;
    const evidenceScore = this.calculateEvidenceOverlap(candidate.evidenceTrail || [], record.evidence || []);

    return Math.min(0.95, suggestedActionScore + riskScore + evidenceScore);
  }

  calculateEvidenceOverlap(candidateEvidence, memoryEvidence) {
    const candidateTokens = this.tokenize(candidateEvidence.join(' '));
    const memoryTokens = this.tokenize(memoryEvidence.join(' '));

    if (candidateTokens.size === 0 || memoryTokens.size === 0) return 0;

    const intersection = Array.from(candidateTokens).filter((token) => memoryTokens.has(token));
    return Math.min(0.4, intersection.length / Math.max(candidateTokens.size, memoryTokens.size));
  }

  resolveDecisionImpact(decision) {
    switch (decision) {
      case 'approved':
        return { confidence: 6, risk: 0 };
      case 'dismissed':
        return { confidence: -7, risk: -1 };
      case 'escalated':
        return { confidence: 3, risk: 1 };
      default:
        return { confidence: 0, risk: 0 };
    }
  }

  buildRationale(approvalRate, similarDecisionCount) {
    if (approvalRate === null) return '';

    return `Similar Oracle actions were approved ${approvalRate}% of the time across ${similarDecisionCount} human decision${similarDecisionCount === 1 ? '' : 's'}.`;
  }

  tokenize(value) {
    return new Set(
      String(value)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 3)
    );
  }
}
