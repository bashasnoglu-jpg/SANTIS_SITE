export const BOOKING_ATTEMPT_CONTRACT_VERSION = 'BOOKING-CREATE-ATTEMPT-1.0' as const;

export type AttemptOutcome =
  | 'SUCCESS'
  | 'FAILURE'
  | 'REPLAYED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'CONCURRENCY_REJECTED';

export interface BookingRequestPayload<TBusinessData = unknown> {
  requestId: string;
  idempotencyKey: string;
  requestFingerprint: string;
  writerCommitSha: string;
  runtimeTraceId: string;
  businessData: TBusinessData;
}

export interface AttemptClaim {
  attemptId: string;
  postgresClaimId: string;
  claimedAt: Date;
  claimOwner: boolean;
}

export interface ExistingAuthoritativeClaim {
  attemptId: string;
  postgresClaimId: string;
  idempotencyKey: string;
  requestFingerprint: string;
  outcome: AttemptOutcome | null;
  reasonCode?: string | null;
  canonicalBookingId?: string | null;
  finalizedAt?: Date | null;
}

export interface AttemptDecision {
  outcome: 'REPLAYED' | 'IDEMPOTENCY_CONFLICT' | 'CONCURRENCY_REJECTED';
  postgresClaimId: string;
  canonicalBookingId?: string;
  reasonCode: string;
}

export interface BookingExecutionResult {
  status: 'SUCCESS' | 'FAILURE';
  canonicalBookingId?: string;
  reasonCode?: string;
}

export interface ProjectionEnvelope {
  contractVersion: typeof BOOKING_ATTEMPT_CONTRACT_VERSION;
  attemptId: string;
  requestId: string;
  idempotencyKey: string;
  requestFingerprint: string;
  postgresClaimId: string;
  writerCommitSha: string;
  runtimeTraceId: string;
  outcome: AttemptOutcome;
  reasonCode?: string;
  canonicalBookingId?: string;
  claimedAt: string;
  finalizedAt: string;
}

export interface AttemptService<TBusinessData = unknown> {
  /**
   * Creates the single authoritative claim owner for an idempotency key, or
   * deterministically resolves an already-owned key as replay/conflict/concurrency.
   * The claim transaction must be independent from the business booking transaction.
   */
  claimAttempt(
    request: BookingRequestPayload<TBusinessData>,
  ): Promise<AttemptClaim | AttemptDecision>;

  /** Executes canonical booking business logic in PostgreSQL. */
  executeBooking(
    claim: AttemptClaim,
    businessData: TBusinessData,
  ): Promise<BookingExecutionResult>;

  /**
   * Performs the only allowed attempt-row mutation: unfinalized -> finalized.
   * A finalized attempt must never be updated again.
   */
  finalizeAttempt(
    attemptId: string,
    outcome: AttemptOutcome,
    reasonCode?: string,
    canonicalBookingId?: string,
  ): Promise<void>;

  /**
   * Enqueues the final evidence projection. Projection delivery failure must never
   * roll back or rewrite canonical booking or attempt authority.
   */
  enqueueProjection(
    attemptId: string,
    payload: ProjectionEnvelope,
  ): Promise<void>;
}

export function resolveExistingClaim(
  request: Pick<BookingRequestPayload, 'requestFingerprint'>,
  existing: ExistingAuthoritativeClaim,
): AttemptDecision {
  if (request.requestFingerprint !== existing.requestFingerprint) {
    return {
      outcome: 'IDEMPOTENCY_CONFLICT',
      postgresClaimId: existing.postgresClaimId,
      reasonCode: 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD',
    };
  }

  if (existing.outcome === 'SUCCESS' || existing.outcome === 'REPLAYED') {
    if (!existing.canonicalBookingId) {
      throw new Error('BOOKING_ATTEMPT_REPLAY_MISSING_CANONICAL_BOOKING_ID');
    }

    return {
      outcome: 'REPLAYED',
      postgresClaimId: existing.postgresClaimId,
      canonicalBookingId: existing.canonicalBookingId,
      reasonCode: 'IDEMPOTENT_REPLAY',
    };
  }

  if (existing.outcome === 'FAILURE') {
    return {
      outcome: 'REPLAYED',
      postgresClaimId: existing.postgresClaimId,
      reasonCode: existing.reasonCode ?? 'IDEMPOTENT_REPLAY_OF_FAILURE',
    };
  }

  return {
    outcome: 'CONCURRENCY_REJECTED',
    postgresClaimId: existing.postgresClaimId,
    reasonCode: 'AUTHORITATIVE_CLAIM_IN_PROGRESS',
  };
}
