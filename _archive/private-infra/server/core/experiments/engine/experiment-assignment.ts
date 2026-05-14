import { createHash } from 'crypto';
import type { ExperimentDefinition, ExperimentVariant } from '../contracts/experiment.contract';

export function assignVariant(
  experiment: ExperimentDefinition,
  visitorId: string
): ExperimentVariant {

  const hash = createHash('sha256')
    .update(visitorId + experiment.key)
    .digest('hex');

  const bucket = parseInt(hash.slice(0, 8), 16) / 0xffffffff;

  const { control, variant_a } = experiment.trafficAllocation;

  if (bucket < control) return 'control';
  if (bucket < control + variant_a) return 'variant_a';
  return 'variant_b';
}
