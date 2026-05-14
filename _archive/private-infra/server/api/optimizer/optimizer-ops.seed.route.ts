import type { Request, Response } from 'express';
import type { OptimizerDecisionSnapshotStore } from '../../core/experiments/optimizer/optimizer.ops.snapshot.store.ts';

interface CreateOptimizerOpsSeedRouteDeps {
  snapshotStore: OptimizerDecisionSnapshotStore;
}

export function createOptimizerOpsSeedRoute(
  deps: CreateOptimizerOpsSeedRouteDeps
) {
  return async function optimizerOpsSeedRoute(
    req: Request,
    res: Response
  ): Promise<void> {
    const experimentId = String(req.body?.experimentId ?? 'exp_demo');
    const requestId = String(req.body?.requestId ?? `req_${Date.now()}`);

    await deps.snapshotStore.save({
      experimentId,
      requestId,
      constrained: {
        ranked: [
          {
            recommendationId: 'r1',
            experimentId,
            variantId: 'variant_a',
            title: 'Safe winner',
            summary: 'Primary allowed winner.',
            recommendationFamily: 'conversion_copy',
            baseScore: 80,
            adjustedScore: 90,
            finalBanditScore: 96,
            bandit: {
              strategy: 'thompson_sampling',
              sampleCount: 120,
              exploitationScore: 0.84,
              explorationScore: 0.08,
              posteriorScore: 0.85,
            },
            constraintSignals: {
              riskScore: 12,
              projectedTrafficShare: 0.24,
              liveGuardrailScore: 0.92,
            },
            constraints: {
              allowed: true,
              blockedReasons: [],
            },
          },
          {
            recommendationId: 'r2',
            experimentId,
            variantId: 'variant_b',
            title: 'Fairness blocked',
            summary: 'Blocked by family fairness.',
            recommendationFamily: 'conversion_copy',
            baseScore: 79,
            adjustedScore: 89,
            finalBanditScore: 95,
            bandit: {
              strategy: 'thompson_sampling',
              sampleCount: 50,
              exploitationScore: 0.82,
              explorationScore: 0.12,
              posteriorScore: 0.83,
            },
            constraintSignals: {
              riskScore: 14,
              projectedTrafficShare: 0.2,
              liveGuardrailScore: 0.9,
            },
            constraints: {
              allowed: false,
              blockedReasons: ['family_fairness_exceeded'],
            },
          },
          {
            recommendationId: 'r3',
            experimentId,
            variantId: 'variant_c',
            title: 'Risk blocked',
            summary: 'Blocked by risk ceiling.',
            recommendationFamily: 'layout_density',
            baseScore: 78,
            adjustedScore: 88,
            finalBanditScore: 94,
            bandit: {
              strategy: 'thompson_sampling',
              sampleCount: 30,
              exploitationScore: 0.81,
              explorationScore: 0.1,
              posteriorScore: 0.82,
            },
            constraintSignals: {
              riskScore: 45,
              projectedTrafficShare: 0.1,
              liveGuardrailScore: 0.94,
            },
            constraints: {
              allowed: false,
              blockedReasons: ['risk_ceiling_exceeded'],
            },
          },
        ],
        telemetry: {
          events: [
            {
              experimentId,
              variantId: 'variant_a',
              recommendationId: 'r1',
              recommendationFamily: 'conversion_copy',
              finalBanditScore: 96,
              exploitationScore: 0.84,
              explorationScore: 0.08,
              posteriorScore: 0.85,
              allowed: true,
              blockedReasons: [],
              evaluatedAt: new Date().toISOString(),
            },
            {
              experimentId,
              variantId: 'variant_b',
              recommendationId: 'r2',
              recommendationFamily: 'conversion_copy',
              finalBanditScore: 95,
              exploitationScore: 0.82,
              explorationScore: 0.12,
              posteriorScore: 0.83,
              allowed: false,
              blockedReasons: ['family_fairness_exceeded'],
              evaluatedAt: new Date().toISOString(),
            },
            {
              experimentId,
              variantId: 'variant_c',
              recommendationId: 'r3',
              recommendationFamily: 'layout_density',
              finalBanditScore: 94,
              exploitationScore: 0.81,
              explorationScore: 0.1,
              posteriorScore: 0.82,
              allowed: false,
              blockedReasons: ['risk_ceiling_exceeded'],
              evaluatedAt: new Date().toISOString(),
            },
          ],
          summary: {
            totalCandidates: 3,
            allowedCandidates: 1,
            blockedCandidates: 2,
            explorationRate: 1,
            blockedReasonCounts: {
              family_fairness_exceeded: 1,
              risk_ceiling_exceeded: 1,
            },
            familyExposureCounts: {
              conversion_copy: 1,
            },
          },
        },
      },
      portfolio: {
        selected: [
          {
            recommendationId: 'r1',
            experimentId,
            variantId: 'variant_a',
            title: 'Safe winner',
            summary: 'Primary allowed winner.',
            recommendationFamily: 'conversion_copy',
            finalBanditScore: 96,
            riskScore: 12,
            allowed: true,
            blockedReasons: [],
            exploitationScore: 0.84,
            explorationScore: 0.08,
            posteriorScore: 0.85,
            portfolio: {
              selected: true,
              marginalGain: 91.8,
              cumulativeRiskScore: 12,
              selectionReason: {
                type: 'selected',
                detail: 'Selected with strong marginal contribution.',
              },
            },
          },
        ],
        ranked: [],
        summary: {
          selectedCount: 1,
          totalRiskScore: 12,
          totalPortfolioScore: 96,
          familyCounts: {
            conversion_copy: 1,
          },
        },
      },
      savedAt: new Date().toISOString(),
    });

    res.status(200).json({
      ok: true,
      experimentId,
      requestId,
    });
  };
}
