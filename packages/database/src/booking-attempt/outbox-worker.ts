import type { ProjectionEnvelope } from './contracts.js';

const OUTCOMES = new Set([
  'SUCCESS',
  'FAILURE',
  'REPLAYED',
  'IDEMPOTENCY_CONFLICT',
  'CONCURRENCY_REJECTED',
]);

export interface BookingAttemptOutboxItem {
  outboxId: string;
  attemptId: string;
  projectionPayload: unknown;
  retryCount: number;
}

export interface BookingAttemptOutboxStore {
  /**
   * Claims one due item using a short processing lease. Implementations should
   * recover stale PROCESSING rows once the lease expires.
   */
  claimNext(now: Date, leaseUntil: Date): Promise<BookingAttemptOutboxItem | null>;

  markSuccess(outboxId: string, processedAt: Date): Promise<void>;

  /**
   * Persists delivery failure without deleting the durable work item.
   * retryCount MUST increment exactly once per failed delivery attempt.
   */
  markFailure(
    outboxId: string,
    errorCode: string,
    nextAttemptAt: Date,
  ): Promise<void>;
}

export interface EvidenceProjectionTransport {
  /**
   * Network adapter boundary only. Tests must use a mock transport; this contract
   * does not contain Airtable credentials or perform Airtable access itself.
   */
  deliver(payload: ProjectionEnvelope): Promise<void>;
}

export interface BookingAttemptOutboxWorkerOptions {
  now?: () => Date;
  processingLeaseMs?: number;
  retryDelayMs?: (nextRetryCount: number) => number;
}

export type BookingAttemptOutboxWorkerResult =
  | { status: 'IDLE' }
  | { status: 'DELIVERED'; outboxId: string }
  | { status: 'RETRY_SCHEDULED'; outboxId: string; errorCode: string };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDate(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

export function assertProjectionEnvelope(value: unknown): asserts value is ProjectionEnvelope {
  if (!value || typeof value !== 'object') {
    throw new Error('BOOKING_ATTEMPT_PROJECTION_PAYLOAD_NOT_OBJECT');
  }

  const payload = value as Record<string, unknown>;
  const requiredStrings = [
    'contractVersion',
    'attemptId',
    'requestId',
    'idempotencyKey',
    'requestFingerprint',
    'postgresClaimId',
    'writerCommitSha',
    'runtimeTraceId',
    'outcome',
    'claimedAt',
    'finalizedAt',
  ];

  for (const field of requiredStrings) {
    if (!isNonEmptyString(payload[field])) {
      throw new Error(`BOOKING_ATTEMPT_PROJECTION_MISSING_FIELD:${field}`);
    }
  }

  if (payload.contractVersion !== 'BOOKING-CREATE-ATTEMPT-1.0') {
    throw new Error('BOOKING_ATTEMPT_PROJECTION_CONTRACT_VERSION_MISMATCH');
  }

  if (!OUTCOMES.has(payload.outcome as string)) {
    throw new Error('BOOKING_ATTEMPT_PROJECTION_OUTCOME_INVALID');
  }

  if (!isIsoDate(payload.claimedAt) || !isIsoDate(payload.finalizedAt)) {
    throw new Error('BOOKING_ATTEMPT_PROJECTION_TIMESTAMP_INVALID');
  }

  if (
    (payload.outcome === 'SUCCESS' || payload.outcome === 'REPLAYED') &&
    !isNonEmptyString(payload.canonicalBookingId)
  ) {
    throw new Error('BOOKING_ATTEMPT_PROJECTION_BOOKING_ID_REQUIRED');
  }

  if (payload.reasonCode !== undefined && !isNonEmptyString(payload.reasonCode)) {
    throw new Error('BOOKING_ATTEMPT_PROJECTION_REASON_CODE_INVALID');
  }
}

function deliveryErrorCode(error: unknown): string {
  if (error && typeof error === 'object') {
    if ('code' in error && isNonEmptyString((error as { code?: unknown }).code)) {
      return String((error as { code: unknown }).code).slice(0, 128);
    }
    if ('name' in error && isNonEmptyString((error as { name?: unknown }).name)) {
      return String((error as { name: unknown }).name).slice(0, 128);
    }
  }
  return 'EVIDENCE_PROJECTION_DELIVERY_FAILED';
}

export class BookingAttemptOutboxWorker {
  private readonly now: () => Date;
  private readonly processingLeaseMs: number;
  private readonly retryDelayMs: (nextRetryCount: number) => number;

  constructor(
    private readonly store: BookingAttemptOutboxStore,
    private readonly transport: EvidenceProjectionTransport,
    options: BookingAttemptOutboxWorkerOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.processingLeaseMs = options.processingLeaseMs ?? 30_000;
    this.retryDelayMs =
      options.retryDelayMs ??
      ((nextRetryCount) => Math.min(300_000, 1_000 * 2 ** Math.max(0, nextRetryCount - 1)));
  }

  async runOnce(): Promise<BookingAttemptOutboxWorkerResult> {
    const startedAt = this.now();
    const leaseUntil = new Date(startedAt.getTime() + this.processingLeaseMs);
    const item = await this.store.claimNext(startedAt, leaseUntil);

    if (!item) return { status: 'IDLE' };

    try {
      assertProjectionEnvelope(item.projectionPayload);
      await this.transport.deliver(item.projectionPayload);
      await this.store.markSuccess(item.outboxId, this.now());
      return { status: 'DELIVERED', outboxId: item.outboxId };
    } catch (error) {
      const errorCode = deliveryErrorCode(error);
      const nextRetryCount = item.retryCount + 1;
      const retryAt = new Date(
        this.now().getTime() + this.retryDelayMs(nextRetryCount),
      );
      await this.store.markFailure(item.outboxId, errorCode, retryAt);
      return { status: 'RETRY_SCHEDULED', outboxId: item.outboxId, errorCode };
    }
  }
}
