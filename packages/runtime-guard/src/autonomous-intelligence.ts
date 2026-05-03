import { z } from 'zod';

export const AdaptiveSignalSchema = z.object({
  id: z.string().min(1),
  ts: z.number().int().positive(),
  source: z.enum(['sse', 'api', 'core_state', 'boardroom', 'handoff', 'node', 'room']),
  type: z.string().min(1),
  riskScore: z.number().min(0).max(1),
  metadata: z.record(z.unknown()).default({})
});

export type AdaptiveSignal = z.infer<typeof AdaptiveSignalSchema>;

export const CounterfactualRecordSchema = z.object({
  id: z.string().min(1),
  createdAt: z.number().int().positive(),
  sourceSignalIds: z.array(z.string()).min(1),
  hypothesis: z.string().min(1),
  predictedFailure: z.enum([
    'continuity_break',
    'flow_freeze',
    'state_invariant_breach',
    'handoff_delay',
    'node_overload',
    'room_desync',
    'guest_hesitation_spike'
  ]),
  preventedBy: z.enum(['soft_sync', 'assisted_stabilization', 'pre_freeze']),
  confidence: z.number().min(0).max(1),
  estimatedEuroRiskAvoided: z.number().min(0),
  expectedImpact: z.string().min(1),
  expiresAt: z.number().int().positive(),
  rollbackCondition: z.string().min(1)
});

export type CounterfactualRecord = z.infer<typeof CounterfactualRecordSchema>;

export function evaluateAdaptiveRisk(signals: AdaptiveSignal[]): CounterfactualRecord | null {
  const parsed = signals.map((signal) => AdaptiveSignalSchema.safeParse(signal)).filter((result) => result.success).map((result) => result.data);

  if (parsed.length < 3) {
    return null;
  }

  const averageRisk = parsed.reduce((sum, signal) => sum + signal.riskScore, 0) / parsed.length;
  const repeatedSource = parsed.some((signal, index, list) => list.findIndex((candidate) => candidate.source === signal.source) !== index);

  if (averageRisk < 0.68 || !repeatedSource) {
    return null;
  }

  const now = Date.now();

  return CounterfactualRecordSchema.parse({
    id: `ari-${now}`,
    createdAt: now,
    sourceSignalIds: parsed.map((signal) => signal.id),
    hypothesis: 'Repeated high-risk runtime signals indicate a likely near-term continuity break if no pre-emptive alignment is applied.',
    predictedFailure: 'continuity_break',
    preventedBy: averageRisk > 0.82 ? 'pre_freeze' : 'assisted_stabilization',
    confidence: Math.min(0.95, averageRisk),
    estimatedEuroRiskAvoided: Math.round(averageRisk * 4500),
    expectedImpact: 'Reduce probability of runtime handoff or state continuity break before guest-visible disruption.',
    expiresAt: now + 15 * 60 * 1000,
    rollbackCondition: 'Rollback if Continuity Integrity, Cognitive Engagement, or Flow metrics degrade after intervention.'
  });
}
