import type { SnapshotWarning } from '../contracts/snapshot.contract.ts';

export function buildWarnings(input: {
  pricingOk: boolean;
  availabilityOk: boolean;
}): SnapshotWarning[] {
  const warnings: SnapshotWarning[] = [];

  if (!input.pricingOk) {
    warnings.push({
      code: 'PRICING_UNAVAILABLE',
      severity: 'warning',
      message: 'Live pricing is temporarily unavailable. Prices must be confirmed at quote step.',
    });
  }

  if (!input.availabilityOk) {
    warnings.push({
      code: 'AVAILABILITY_UNAVAILABLE',
      severity: 'warning',
      message: 'Live availability is temporarily unavailable. Human concierge fallback may be required.',
    });
  }

  if (!input.pricingOk || !input.availabilityOk) {
    warnings.push({
      code: 'PARTIAL_DATA',
      severity: 'info',
      message: 'Snapshot is running in degraded mode with partial live data.',
    });
  }

  return warnings;
}
