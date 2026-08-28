export type UpsertDecision =
  | 'INSERT'
  | 'NO_OP'
  | 'METADATA_REVISION'
  | 'CORRECTION_REQUIRED'
  | 'QUARANTINE_CHANGED';

export interface ExistingHashState {
  businessFactHash: string;
  sourceSnapshotHash: string;
}

export interface UpsertDecisionInput {
  existingRecord: ExistingHashState | null;
  newBusinessFactHash: string;
  newSourceSnapshotHash: string;
  hasExplicitCorrection: boolean;
}

function assertSha256(value: string, label: string): void {
  if (!/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error(`${label} must be a SHA-256 hex digest`);
  }
}

export function decideUpsert(params: UpsertDecisionInput): UpsertDecision {
  assertSha256(params.newBusinessFactHash, 'newBusinessFactHash');
  assertSha256(params.newSourceSnapshotHash, 'newSourceSnapshotHash');

  if (!params.existingRecord) return 'INSERT';

  assertSha256(params.existingRecord.businessFactHash, 'existing businessFactHash');
  assertSha256(params.existingRecord.sourceSnapshotHash, 'existing sourceSnapshotHash');

  const businessSame = params.existingRecord.businessFactHash === params.newBusinessFactHash;
  const snapshotSame = params.existingRecord.sourceSnapshotHash === params.newSourceSnapshotHash;

  if (businessSame && snapshotSame) return 'NO_OP';
  if (businessSame) return 'METADATA_REVISION';
  if (params.hasExplicitCorrection) return 'CORRECTION_REQUIRED';
  return 'QUARANTINE_CHANGED';
}
