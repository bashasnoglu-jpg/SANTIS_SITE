/**
 * santis-oracle-network-strategy.js
 * Formats cross-node learning into network-level strategy copy.
 */
export class SantisOracleNetworkStrategy {
  summarize(learning) {
    if (!learning || !learning.patternCount) {
      return 'Cross-node learning is collecting pattern density. No node-specific transfer is recommended yet.';
    }

    const transfer = this.resolveStrongestTransfer(learning);
    if (!transfer) {
      return learning.networkStrategy || 'Patterns exist, but no contextual transfer target is ready.';
    }

    return `${transfer.targetNodeId} can receive a context-adjusted learning transfer at ${transfer.adjustedConfidence}% confidence with ${transfer.riskBoundary} risk boundary.`;
  }

  resolveStrongestTransfer(learning) {
    const transfers = Array.isArray(learning?.transfers) ? learning.transfers : [];
    return [...transfers].sort((a, b) => (b.adjustedConfidence || 0) - (a.adjustedConfidence || 0))[0] || null;
  }
}
