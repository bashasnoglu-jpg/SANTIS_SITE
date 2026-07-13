import { createHash } from 'node:crypto';

export const SANTIS_OS_SYNC_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
export const FI_SYNC_CONTRACT_ID = 'FI-DI-P0.3';
export const FI_SYNC_CONTRACT_VERSION = '1.1.0';

export type SyncRunMode = 'NORMAL' | 'FORCED_REPLAY';

function uuidToBytes(uuid: string): Buffer {
  const normalized = uuid.replace(/-/g, '');
  if (!/^[0-9a-fA-F]{32}$/.test(normalized)) {
    throw new Error(`Invalid UUID namespace: ${uuid}`);
  }
  return Buffer.from(normalized, 'hex');
}

function bytesToUuid(bytes: Buffer): string {
  const hex = bytes.toString('hex');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)].join('-');
}

export function uuidV5(name: string, namespace = SANTIS_OS_SYNC_NAMESPACE): string {
  if (!name) throw new Error('UUIDv5 name must not be empty');
  const hash = createHash('sha1').update(uuidToBytes(namespace)).update(name, 'utf8').digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}

export function generateFactId(sourceSystem: string, sourceTable: string, sourceRecordId: string): string {
  const values = [sourceSystem, sourceTable, sourceRecordId].map((value) => value.trim());
  if (values.some((value) => value.length === 0)) {
    throw new Error('sourceSystem, sourceTable and sourceRecordId are required');
  }
  return uuidV5(values.join(':'));
}

export function generateSyncIdempotencyKey(params: {
  contractId?: string;
  contractVersion?: string;
  sourceSystem: string;
  sourceBaseId: string;
  sourceTable: string;
  windowStart: string;
  windowEnd: string;
  runMode: SyncRunMode;
  replayAttemptId?: string;
}): string {
  const replayAttemptId = params.replayAttemptId?.trim();

  if (params.runMode === 'FORCED_REPLAY' && !replayAttemptId) {
    throw new Error('replayAttemptId is required for FORCED_REPLAY');
  }

  if (params.runMode === 'NORMAL' && replayAttemptId) {
    throw new Error('replayAttemptId must not be provided for NORMAL runs');
  }

  const input = [
    params.contractId ?? FI_SYNC_CONTRACT_ID,
    params.contractVersion ?? FI_SYNC_CONTRACT_VERSION,
    params.sourceSystem,
    params.sourceBaseId,
    params.sourceTable,
    new Date(params.windowStart).toISOString(),
    new Date(params.windowEnd).toISOString(),
    params.runMode,
  ];

  if (params.runMode === 'FORCED_REPLAY') {
    input.push(replayAttemptId as string);
  }

  if (input.some((value) => value.trim().length === 0)) {
    throw new Error('All sync idempotency inputs are required');
  }

  return uuidV5(input.join('|'));
}
