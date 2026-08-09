import type {
  AttemptOutcome,
  ExistingAuthoritativeClaim,
  ProjectionEnvelope,
} from './contracts.js';

export interface AttemptOwnerInsert {
  requestId: string;
  idempotencyKey: string;
  requestFingerprint: string;
  writerCommitSha: string;
  runtimeTraceId: string;
}

export interface AttemptObservationInsert extends AttemptOwnerInsert {
  postgresClaimId: string;
  outcome: Exclude<AttemptOutcome, 'SUCCESS' | 'FAILURE'>;
  reasonCode: string;
  canonicalBookingId?: string;
}

export interface AttemptFinalizeInput {
  attemptId: string;
  outcome: 'SUCCESS' | 'FAILURE';
  reasonCode?: string;
  canonicalBookingId?: string;
}

export interface BookingAttemptRepository {
  /**
   * Attempts to create the single authoritative claim owner.
   * Implementations MUST surface the partial-unique conflict as a typed
   * ClaimOwnerAlreadyExistsError and MUST NOT silently retry ownership.
   */
  insertClaimOwner(input: AttemptOwnerInsert): Promise<{
    attemptId: string;
    postgresClaimId: string;
    claimedAt: Date;
  }>;

  findClaimOwner(idempotencyKey: string): Promise<ExistingAuthoritativeClaim | null>;

  /**
   * Atomically append a non-owner observation and its durable outbox intent.
   * Delivery to Airtable remains outside the transaction and outside this boundary.
   */
  appendObservationWithProjection(
    input: AttemptObservationInsert,
    buildProjection: (attemptId: string) => ProjectionEnvelope,
  ): Promise<{ attemptId: string }>;

  /**
   * Atomically perform the only allowed owner mutation (unfinalized -> finalized)
   * and create exactly one durable projection intent. This prevents a finalized
   * canonical attempt from existing without a corresponding outbox work item.
   */
  finalizeOwnerWithProjection(
    input: AttemptFinalizeInput,
    payload: ProjectionEnvelope,
  ): Promise<void>;
}

export class ClaimOwnerAlreadyExistsError extends Error {
  readonly code = 'CLAIM_OWNER_ALREADY_EXISTS';

  constructor(readonly idempotencyKey: string) {
    super(`Claim owner already exists for idempotency key: ${idempotencyKey}`);
    this.name = 'ClaimOwnerAlreadyExistsError';
  }
}
