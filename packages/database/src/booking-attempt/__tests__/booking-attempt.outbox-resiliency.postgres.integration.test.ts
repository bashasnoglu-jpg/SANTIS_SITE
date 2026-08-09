import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test, { after, before, beforeEach } from 'node:test';

import postgres, { type Sql } from 'postgres';

import { PostgresBookingAttemptOutboxStore } from '../postgres-outbox-store.js';
import {
  BookingAttemptOutboxWorker,
  type EvidenceProjectionTransport,
} from '../outbox-worker.js';
import type { ProjectionEnvelope } from '../contracts.js';
import {
  setupPostgresIntegrationGate,
  type PostgresIntegrationGate,
} from './postgres-integration-harness.js';

const RESILIENCY_GATE = 'OUTBOX-RESILIENCY-AND-CONCURRENCY-GATE';

let gate: PostgresIntegrationGate;

before(async () => {
  gate = await setupPostgresIntegrationGate();
});

beforeEach(async () => {
  // Test-only fixture isolation. Attempts are intentionally left immutable; only
  // ephemeral delivery work rows from the previous subtest are cleared so claimNext
  // cannot select an older PROCESSING lease.
  await gate.sql`DELETE FROM booking_create_outbox`;
});

after(async () => {
  await gate.close();
});

async function seedPendingOutbox(sql: Sql, label: string) {
  const bookingId = randomUUID();
  const attemptId = randomUUID();
  const claimId = randomUUID();
  const requestId = `request-${label}-${randomUUID()}`;
  const idempotencyKey = `idem-${label}-${randomUUID()}`;
  const traceId = `trace-${label}-${randomUUID()}`;
  const fingerprint = `sha256:${'c'.repeat(64)}`;
  const writerCommitSha = 'dcbc9da076d43329430cbb95bf9a2bdd64b83163';
  const claimedAt = '2026-08-09T17:00:00.000Z';
  const finalizedAt = '2026-08-09T17:00:01.000Z';

  await sql`
    INSERT INTO bookings (id) VALUES (${bookingId}::uuid)
  `;

  await sql`
    INSERT INTO booking_create_attempts (
      attempt_id,
      request_id,
      idempotency_key,
      request_fingerprint,
      postgres_claim_id,
      claim_owner,
      writer_commit_sha,
      runtime_trace_id,
      outcome,
      canonical_booking_id,
      claimed_at,
      finalized_at
    ) VALUES (
      ${attemptId}::uuid,
      ${requestId},
      ${idempotencyKey},
      ${fingerprint},
      ${claimId}::uuid,
      TRUE,
      ${writerCommitSha},
      ${traceId},
      'SUCCESS',
      ${bookingId}::uuid,
      ${claimedAt}::timestamptz,
      ${finalizedAt}::timestamptz
    )
  `;

  const payload: ProjectionEnvelope = {
    contractVersion: 'BOOKING-CREATE-ATTEMPT-1.0',
    attemptId,
    requestId,
    idempotencyKey,
    requestFingerprint: fingerprint,
    postgresClaimId: claimId,
    writerCommitSha,
    runtimeTraceId: traceId,
    outcome: 'SUCCESS',
    canonicalBookingId: bookingId,
    claimedAt,
    finalizedAt,
  };

  // Build the fixture inside PostgreSQL as a JSONB object. Using JSON.stringify as
  // a bind parameter can reproduce the exact JSONB-string serialization defect that
  // the production repository boundary intentionally forbids.
  await sql`
    INSERT INTO booking_create_outbox (attempt_id, projection_payload)
    VALUES (
      ${attemptId}::uuid,
      jsonb_build_object(
        'contractVersion', ${payload.contractVersion}::text,
        'attemptId', ${payload.attemptId}::text,
        'requestId', ${payload.requestId}::text,
        'idempotencyKey', ${payload.idempotencyKey}::text,
        'requestFingerprint', ${payload.requestFingerprint}::text,
        'postgresClaimId', ${payload.postgresClaimId}::text,
        'writerCommitSha', ${payload.writerCommitSha}::text,
        'runtimeTraceId', ${payload.runtimeTraceId}::text,
        'outcome', ${payload.outcome}::text,
        'canonicalBookingId', ${payload.canonicalBookingId}::text,
        'claimedAt', ${payload.claimedAt}::text,
        'finalizedAt', ${payload.finalizedAt}::text
      )
    )
  `;

  const [row] = await sql<[{ outbox_id: string; payload_type: string }]>`
    SELECT outbox_id, jsonb_typeof(projection_payload) AS payload_type
    FROM booking_create_outbox
    WHERE attempt_id = ${attemptId}::uuid
  `;

  assert.ok(row?.outbox_id);
  assert.equal(row?.payload_type, 'object');
  return { bookingId, attemptId, outboxId: row.outbox_id, payload };
}

async function canonicalSnapshot(sql: Sql, attemptId: string) {
  const [row] = await sql<[
    { outcome: string; canonical_booking_id: string; booking_count: string },
  ]>`
    SELECT
      a.outcome::text AS outcome,
      a.canonical_booking_id,
      count(b.id)::text AS booking_count
    FROM booking_create_attempts a
    LEFT JOIN bookings b ON b.id = a.canonical_booking_id
    WHERE a.attempt_id = ${attemptId}::uuid
    GROUP BY a.outcome, a.canonical_booking_id
  `;
  return row;
}

class IdempotentReceiverTransport implements EvidenceProjectionTransport {
  calls = 0;
  uniqueWrites = 0;
  private readonly deliveredAttemptIds = new Set<string>();

  async deliver(payload: ProjectionEnvelope): Promise<void> {
    this.calls += 1;
    if (!this.deliveredAttemptIds.has(payload.attemptId)) {
      this.deliveredAttemptIds.add(payload.attemptId);
      this.uniqueWrites += 1;
    }
    // Duplicate logical delivery intentionally returns success without a second write.
  }
}

test(`${RESILIENCY_GATE}: MULTI_WORKER_RACE = PASS`, async () => {
  const seeded = await seedPendingOutbox(gate.sql, 'race');
  const clients = Array.from({ length: 10 }, () =>
    postgres(gate.connectionString, { max: 1, prepare: false }),
  );

  try {
    const now = new Date('2026-08-09T17:10:00.000Z');
    const leaseUntil = new Date('2026-08-09T17:15:00.000Z');
    const results = await Promise.all(
      clients.map((client) =>
        new PostgresBookingAttemptOutboxStore(client).claimNext(now, leaseUntil),
      ),
    );

    const claimed = results.filter((item) => item?.outboxId === seeded.outboxId);
    assert.equal(claimed.length, 1, 'exactly one worker must claim the single due row');
    assert.equal(results.filter(Boolean).length, 1);

    const [state] = await gate.sql<[{ status: string; next_attempt_at: Date | null }]>`
      SELECT status::text, next_attempt_at
      FROM booking_create_outbox
      WHERE outbox_id = ${seeded.outboxId}::uuid
    `;
    assert.equal(state?.status, 'PROCESSING');
    assert.ok(state?.next_attempt_at);
  } finally {
    await Promise.all(clients.map((client) => client.end({ timeout: 1 })));
  }
});

test(`${RESILIENCY_GATE}: STALE_LEASE_RECOVERY = PASS`, async () => {
  const seeded = await seedPendingOutbox(gate.sql, 'stale');
  const storeA = new PostgresBookingAttemptOutboxStore(gate.clientA);
  const storeB = new PostgresBookingAttemptOutboxStore(gate.clientB);

  const claimedByA = await storeA.claimNext(
    new Date('2026-08-09T17:20:00.000Z'),
    new Date('2026-08-09T17:20:05.000Z'),
  );
  assert.equal(claimedByA?.outboxId, seeded.outboxId);

  const beforeExpiry = await storeB.claimNext(
    new Date('2026-08-09T17:20:04.000Z'),
    new Date('2026-08-09T17:20:09.000Z'),
  );
  assert.equal(beforeExpiry, null, 'active lease must not be stolen');

  const reclaimed = await storeB.claimNext(
    new Date('2026-08-09T17:20:06.000Z'),
    new Date('2026-08-09T17:20:11.000Z'),
  );
  assert.equal(reclaimed?.outboxId, seeded.outboxId);

  const canonical = await canonicalSnapshot(gate.sql, seeded.attemptId);
  assert.equal(canonical?.outcome, 'SUCCESS');
  assert.equal(canonical?.canonical_booking_id, seeded.bookingId);
  assert.equal(canonical?.booking_count, '1');
});

test(`${RESILIENCY_GATE}: WORKER_CRASH_RECOVERY + AMBIGUOUS_SUCCESS_RECOVERY = PASS`, async () => {
  const seeded = await seedPendingOutbox(gate.sql, 'ambiguous');
  const store = new PostgresBookingAttemptOutboxStore(gate.sql);
  const receiver = new IdempotentReceiverTransport();

  // Worker A claims and the receiver commits the logical delivery. The worker then
  // "crashes" before markSuccess, so PostgreSQL remains PROCESSING until lease expiry.
  const workerAItem = await store.claimNext(
    new Date('2026-08-09T17:30:00.000Z'),
    new Date('2026-08-09T17:30:05.000Z'),
  );
  assert.equal(workerAItem?.outboxId, seeded.outboxId);
  assert.ok(workerAItem);
  await receiver.deliver(workerAItem.projectionPayload as ProjectionEnvelope);
  assert.equal(receiver.calls, 1);
  assert.equal(receiver.uniqueWrites, 1);

  const [afterCrash] = await gate.sql<[
    { status: string; processed_at: Date | null; retry_count: number },
  ]>`
    SELECT status::text, processed_at, retry_count
    FROM booking_create_outbox
    WHERE outbox_id = ${seeded.outboxId}::uuid
  `;
  assert.equal(afterCrash?.status, 'PROCESSING');
  assert.equal(afterCrash?.processed_at, null);
  assert.equal(afterCrash?.retry_count, 0);

  let now = new Date('2026-08-09T17:30:04.000Z');
  const workerB = new BookingAttemptOutboxWorker(store, receiver, {
    now: () => now,
    processingLeaseMs: 5_000,
    retryDelayMs: () => 1_000,
  });
  assert.equal((await workerB.runOnce()).status, 'IDLE');

  // Lease expires. Worker B redelivers. The idempotent receiver recognizes the same
  // attempt_id and returns success without producing a second logical evidence write.
  now = new Date('2026-08-09T17:30:06.000Z');
  const recovered = await workerB.runOnce();
  assert.equal(recovered.status, 'DELIVERED');
  assert.equal(receiver.calls, 2);
  assert.equal(receiver.uniqueWrites, 1, 'duplicate network delivery must deduplicate');

  const [finalOutbox] = await gate.sql<[
    {
      status: string;
      processed_at: Date | null;
      next_attempt_at: Date | null;
      retry_count: number;
    },
  ]>`
    SELECT status::text, processed_at, next_attempt_at, retry_count
    FROM booking_create_outbox
    WHERE outbox_id = ${seeded.outboxId}::uuid
  `;
  assert.equal(finalOutbox?.status, 'SUCCESS');
  assert.ok(finalOutbox?.processed_at);
  assert.equal(finalOutbox?.next_attempt_at, null);
  assert.equal(finalOutbox?.retry_count, 0);

  const canonical = await canonicalSnapshot(gate.sql, seeded.attemptId);
  assert.equal(canonical?.outcome, 'SUCCESS');
  assert.equal(canonical?.canonical_booking_id, seeded.bookingId);
  assert.equal(canonical?.booking_count, '1');
});
