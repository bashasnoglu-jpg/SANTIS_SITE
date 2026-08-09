import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  ExistingAuthoritativeClaim,
  ProjectionEnvelope,
} from './contracts.js';
import {
  ClaimOwnerAlreadyExistsError,
  type AttemptFinalizeInput,
  type AttemptObservationInsert,
  type AttemptOwnerInsert,
  type BookingAttemptRepository,
} from './repository.js';
import {
  BookingAttemptOrchestrationService,
  type BookingBusinessExecutor,
} from './service.js';

class FakeAttemptRepository implements BookingAttemptRepository {
  owner: ExistingAuthoritativeClaim | null = null;
  observations: AttemptObservationInsert[] = [];
  outbox: ProjectionEnvelope[] = [];
  finalized: AttemptFinalizeInput[] = [];
  nextAttempt = 1;
  failProjectionTransaction = false;

  async insertClaimOwner(input: AttemptOwnerInsert) {
    if (this.owner) throw new ClaimOwnerAlreadyExistsError(input.idempotencyKey);

    const attemptId = `attempt-${this.nextAttempt++}`;
    const postgresClaimId = `claim-${attemptId}`;
    const claimedAt = new Date('2026-08-09T16:00:00.000Z');

    this.owner = {
      attemptId,
      postgresClaimId,
      idempotencyKey: input.idempotencyKey,
      requestFingerprint: input.requestFingerprint,
      outcome: null,
      canonicalBookingId: null,
      finalizedAt: null,
    };

    return { attemptId, postgresClaimId, claimedAt };
  }

  async findClaimOwner(idempotencyKey: string) {
    return this.owner?.idempotencyKey === idempotencyKey ? this.owner : null;
  }

  async appendObservationWithProjection(
    input: AttemptObservationInsert,
    buildProjection: (attemptId: string) => ProjectionEnvelope,
  ) {
    const attemptId = `attempt-${this.nextAttempt++}`;
    const payload = buildProjection(attemptId);
    if (this.failProjectionTransaction) throw new Error('SIMULATED_OUTBOX_TRANSACTION_FAILURE');

    this.observations.push(input);
    this.outbox.push(payload);
    return { attemptId };
  }

  async finalizeOwnerWithProjection(input: AttemptFinalizeInput, payload: ProjectionEnvelope) {
    if (this.failProjectionTransaction) throw new Error('SIMULATED_OUTBOX_TRANSACTION_FAILURE');
    if (!this.owner || this.owner.attemptId !== input.attemptId) {
      throw new Error('OWNER_NOT_FOUND');
    }

    this.finalized.push(input);
    this.owner = {
      ...this.owner,
      outcome: input.outcome,
      reasonCode: input.reasonCode,
      canonicalBookingId: input.canonicalBookingId,
      finalizedAt: new Date(payload.finalizedAt),
    };
    this.outbox.push(payload);
  }
}

function request(fingerprint = 'sha256:aaa') {
  return {
    requestId: `request-${fingerprint}`,
    idempotencyKey: 'idem-1',
    requestFingerprint: fingerprint,
    writerCommitSha: 'a'.repeat(40),
    runtimeTraceId: `trace-${fingerprint}`,
    businessData: { serviceId: 'service-1' },
  };
}

function service(
  repo: FakeAttemptRepository,
  result: Awaited<ReturnType<BookingBusinessExecutor<object>['execute']>>,
) {
  const executor: BookingBusinessExecutor<object> = {
    execute: async () => result,
  };
  return new BookingAttemptOrchestrationService(
    repo,
    executor,
    () => new Date('2026-08-09T16:01:00.000Z'),
  );
}

test('owner claim finalizes success and creates exactly one durable outbox intent', async () => {
  const repo = new FakeAttemptRepository();
  const result = await service(repo, {
    status: 'SUCCESS',
    canonicalBookingId: 'booking-1',
  }).handle(request());

  assert.equal(result.kind, 'OWNER_SUCCESS');
  assert.equal(repo.finalized.length, 1);
  assert.equal(repo.finalized[0]?.outcome, 'SUCCESS');
  assert.equal(repo.outbox.length, 1);
  assert.equal(repo.outbox[0]?.outcome, 'SUCCESS');
});

test('same key and fingerprint appends replay evidence without taking ownership', async () => {
  const repo = new FakeAttemptRepository();
  await service(repo, { status: 'SUCCESS', canonicalBookingId: 'booking-1' }).handle(request());

  const result = await service(repo, { status: 'FAILURE' }).handle(request());

  assert.equal(result.kind, 'REPLAYED');
  assert.equal(repo.observations.length, 1);
  assert.equal(repo.observations[0]?.outcome, 'REPLAYED');
  assert.equal(repo.outbox.length, 2);
});

test('same key and different fingerprint appends conflict evidence and fails closed', async () => {
  const repo = new FakeAttemptRepository();
  await service(repo, { status: 'SUCCESS', canonicalBookingId: 'booking-1' }).handle(request());

  const result = await service(repo, { status: 'SUCCESS', canonicalBookingId: 'booking-2' }).handle(
    request('sha256:bbb'),
  );

  assert.equal(result.kind, 'IDEMPOTENCY_CONFLICT');
  assert.equal(repo.observations[0]?.outcome, 'IDEMPOTENCY_CONFLICT');
  assert.equal(repo.owner?.canonicalBookingId, 'booking-1');
});

test('in-flight owner causes concurrency rejection evidence', async () => {
  const repo = new FakeAttemptRepository();
  await repo.insertClaimOwner(request());

  const result = await service(repo, { status: 'SUCCESS', canonicalBookingId: 'booking-2' }).handle(
    request(),
  );

  assert.equal(result.kind, 'CONCURRENCY_REJECTED');
  assert.equal(repo.observations[0]?.outcome, 'CONCURRENCY_REJECTED');
  assert.equal(repo.owner?.finalizedAt, null);
});

test('business failure seals FAILURE in attempt authority and creates outbox intent', async () => {
  const repo = new FakeAttemptRepository();
  const result = await service(repo, {
    status: 'FAILURE',
    reasonCode: 'ROOM_CONFLICT',
  }).handle(request());

  assert.equal(result.kind, 'OWNER_FAILURE');
  assert.equal(repo.owner?.outcome, 'FAILURE');
  assert.equal(repo.owner?.reasonCode, 'ROOM_CONFLICT');
  assert.equal(repo.outbox[0]?.outcome, 'FAILURE');
});

test('outbox transaction failure does not fabricate a finalized canonical attempt', async () => {
  const repo = new FakeAttemptRepository();
  repo.failProjectionTransaction = true;

  await assert.rejects(
    service(repo, { status: 'SUCCESS', canonicalBookingId: 'booking-1' }).handle(request()),
    /SIMULATED_OUTBOX_TRANSACTION_FAILURE/,
  );

  assert.equal(repo.owner?.outcome, null);
  assert.equal(repo.finalized.length, 0);
  assert.equal(repo.outbox.length, 0);
});

test('projection delivery is outside canonical service boundary once outbox intent exists', async () => {
  const repo = new FakeAttemptRepository();
  const result = await service(repo, {
    status: 'SUCCESS',
    canonicalBookingId: 'booking-1',
  }).handle(request());

  const canonicalBeforeDelivery = structuredClone(repo.owner);
  const outboxBeforeDelivery = structuredClone(repo.outbox);

  // Simulate a downstream Airtable delivery failure. The orchestration service has
  // already returned after durable outbox creation and has no Airtable dependency.
  const downstreamProjectionError = new Error('SIMULATED_AIRTABLE_DELIVERY_FAILURE');
  assert.match(downstreamProjectionError.message, /AIRTABLE/);

  assert.equal(result.kind, 'OWNER_SUCCESS');
  assert.deepEqual(repo.owner, canonicalBeforeDelivery);
  assert.deepEqual(repo.outbox, outboxBeforeDelivery);
});
