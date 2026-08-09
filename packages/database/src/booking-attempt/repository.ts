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

  /** Append-only evidence for replay/conflict/concurrency observations. */
  appendObservation(input: AttemptObservationInsert): Promise<{ attemptId: string }>;

  /** The only allowed owner-row mutation: unfinalized -> finalized. */
  finalizeOwner(input: AttemptFinalizeInput): Promise<void>;

  /** Durable intent only. Delivery to Airtable is outside this repository boundary. */
  enqueueProjection(attemptId: string, payload: ProjectionEnvelope): Promise<void>;
}

export class ClaimOwnerAlreadyExistsError extends Error {
  readonly code = 'CLAIM_OWNER_ALREADY_EXISTS';

  constructor(readonly idempotencyKey: string) {
    super(`Claim owner already exists for idempotency key: ${idempotencyKey}`);
    this.name = 'ClaimOwnerAlreadyExistsError';
  }
}
