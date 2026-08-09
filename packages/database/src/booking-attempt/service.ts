import {
  BOOKING_ATTEMPT_CONTRACT_VERSION,
  resolveExistingClaim,
  type AttemptClaim,
  type AttemptDecision,
  type BookingExecutionResult,
  type BookingRequestPayload,
  type ProjectionEnvelope,
} from './contracts.js';
import {
  ClaimOwnerAlreadyExistsError,
  type BookingAttemptRepository,
} from './repository.js';

export interface BookingBusinessExecutor<TBusinessData> {
  execute(claim: AttemptClaim, businessData: TBusinessData): Promise<BookingExecutionResult>;
}

export interface BookingAttemptServiceResult {
  kind: 'OWNER_SUCCESS' | 'OWNER_FAILURE' | 'REPLAYED' | 'IDEMPOTENCY_CONFLICT' | 'CONCURRENCY_REJECTED';
  attemptId?: string;
  postgresClaimId: string;
  canonicalBookingId?: string;
  reasonCode?: string;
}

export class BookingAttemptOrchestrationService<TBusinessData = unknown> {
  constructor(
    private readonly repository: BookingAttemptRepository,
    private readonly businessExecutor: BookingBusinessExecutor<TBusinessData>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async handle(request: BookingRequestPayload<TBusinessData>): Promise<BookingAttemptServiceResult> {
    let claim: AttemptClaim;

    try {
      const owner = await this.repository.insertClaimOwner({
        requestId: request.requestId,
        idempotencyKey: request.idempotencyKey,
        requestFingerprint: request.requestFingerprint,
        writerCommitSha: request.writerCommitSha,
        runtimeTraceId: request.runtimeTraceId,
      });

      claim = {
        attemptId: owner.attemptId,
        postgresClaimId: owner.postgresClaimId,
        claimedAt: owner.claimedAt,
        claimOwner: true,
      };
    } catch (error) {
      if (!(error instanceof ClaimOwnerAlreadyExistsError)) throw error;
      return this.resolveExistingOwner(request);
    }

    const execution = await this.businessExecutor.execute(claim, request.businessData);
    const finalizedAt = this.now();

    if (execution.status === 'SUCCESS') {
      if (!execution.canonicalBookingId) {
        throw new Error('BOOKING_ATTEMPT_SUCCESS_MISSING_CANONICAL_BOOKING_ID');
      }

      await this.repository.finalizeOwner({
        attemptId: claim.attemptId,
        outcome: 'SUCCESS',
        canonicalBookingId: execution.canonicalBookingId,
      });

      await this.repository.enqueueProjection(
        claim.attemptId,
        this.buildProjection(request, claim, 'SUCCESS', finalizedAt, undefined, execution.canonicalBookingId),
      );

      return {
        kind: 'OWNER_SUCCESS',
        attemptId: claim.attemptId,
        postgresClaimId: claim.postgresClaimId,
        canonicalBookingId: execution.canonicalBookingId,
      };
    }

    await this.repository.finalizeOwner({
      attemptId: claim.attemptId,
      outcome: 'FAILURE',
      reasonCode: execution.reasonCode ?? 'BOOKING_EXECUTION_FAILED',
    });

    await this.repository.enqueueProjection(
      claim.attemptId,
      this.buildProjection(
        request,
        claim,
        'FAILURE',
        finalizedAt,
        execution.reasonCode ?? 'BOOKING_EXECUTION_FAILED',
      ),
    );

    return {
      kind: 'OWNER_FAILURE',
      attemptId: claim.attemptId,
      postgresClaimId: claim.postgresClaimId,
      reasonCode: execution.reasonCode ?? 'BOOKING_EXECUTION_FAILED',
    };
  }

  private async resolveExistingOwner(
    request: BookingRequestPayload<TBusinessData>,
  ): Promise<BookingAttemptServiceResult> {
    const existing = await this.repository.findClaimOwner(request.idempotencyKey);
    if (!existing) {
      throw new Error('BOOKING_ATTEMPT_OWNER_CONFLICT_WITHOUT_OWNER_ROW');
    }

    const decision: AttemptDecision = resolveExistingClaim(
      { requestFingerprint: request.requestFingerprint },
      existing,
    );

    const observation = await this.repository.appendObservation({
      requestId: request.requestId,
      idempotencyKey: request.idempotencyKey,
      requestFingerprint: request.requestFingerprint,
      writerCommitSha: request.writerCommitSha,
      runtimeTraceId: request.runtimeTraceId,
      postgresClaimId: existing.postgresClaimId,
      outcome: decision.outcome,
      reasonCode: decision.reasonCode,
      canonicalBookingId: decision.canonicalBookingId,
    });

    const claimedAt = this.now();
    await this.repository.enqueueProjection(
      observation.attemptId,
      {
        contractVersion: BOOKING_ATTEMPT_CONTRACT_VERSION,
        attemptId: observation.attemptId,
        requestId: request.requestId,
        idempotencyKey: request.idempotencyKey,
        requestFingerprint: request.requestFingerprint,
        postgresClaimId: existing.postgresClaimId,
        writerCommitSha: request.writerCommitSha,
        runtimeTraceId: request.runtimeTraceId,
        outcome: decision.outcome,
        reasonCode: decision.reasonCode,
        canonicalBookingId: decision.canonicalBookingId,
        claimedAt: claimedAt.toISOString(),
        finalizedAt: claimedAt.toISOString(),
      },
    );

    return {
      kind: decision.outcome,
      attemptId: observation.attemptId,
      postgresClaimId: existing.postgresClaimId,
      canonicalBookingId: decision.canonicalBookingId,
      reasonCode: decision.reasonCode,
    };
  }

  private buildProjection(
    request: BookingRequestPayload<TBusinessData>,
    claim: AttemptClaim,
    outcome: 'SUCCESS' | 'FAILURE',
    finalizedAt: Date,
    reasonCode?: string,
    canonicalBookingId?: string,
  ): ProjectionEnvelope {
    return {
      contractVersion: BOOKING_ATTEMPT_CONTRACT_VERSION,
      attemptId: claim.attemptId,
      requestId: request.requestId,
      idempotencyKey: request.idempotencyKey,
      requestFingerprint: request.requestFingerprint,
      postgresClaimId: claim.postgresClaimId,
      writerCommitSha: request.writerCommitSha,
      runtimeTraceId: request.runtimeTraceId,
      outcome,
      reasonCode,
      canonicalBookingId,
      claimedAt: claim.claimedAt.toISOString(),
      finalizedAt: finalizedAt.toISOString(),
    };
  }
}
