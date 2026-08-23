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
const SYNTHETIC_WRITER_SHA = '0000000000000000000000000000000000000000'; // fixture sentinel, not provenance

let gate: PostgresIntegrationGate;

before(async () => { gate = await setupPostgresIntegrationGate(); });
beforeEach(async () => { await gate.sql`DELETE FROM booking_create_outbox`; });
after(async () => { await gate.close(); });

async function seedPendingOutbox(sql: Sql, label: string) {
  const bookingId = randomUUID();
  const attemptId = randomUUID();
  const claimId = randomUUID();
  const requestId = `request-${label}-${randomUUID()}`;
  const idempotencyKey = `idem-${label}-${randomUUID()}`;
  const traceId = `trace-${label}-${randomUUID()}`;
  const fingerprint = `sha256:${'c'.repeat(64)}`;
  const claimedAt = '2026-08-09T17:00:00.000Z';
  const finalizedAt = '2026-08-09T17:00:01.000Z';

  await sql`INSERT INTO bookings (id) VALUES (${bookingId}::uuid)`;
  await sql`
    INSERT INTO booking_create_attempts (
      attempt_id, request_id, idempotency_key, request_fingerprint,
      postgres_claim_id, claim_owner, writer_commit_sha, runtime_trace_id,
      outcome, canonical_booking_id, claimed_at, finalized_at
    ) VALUES (
      ${attemptId}::uuid, ${requestId}, ${idempotencyKey}, ${fingerprint},
      ${claimId}::uuid, TRUE, ${SYNTHETIC_WRITER_SHA}, ${traceId},
      'SUCCESS', ${bookingId}::uuid, ${claimedAt}::timestamptz, ${finalizedAt}::timestamptz
    )
  `;

  const payload: ProjectionEnvelope = {
    contractVersion: 'BOOKING-CREATE-ATTEMPT-1.0', attemptId, requestId,
    idempotencyKey, requestFingerprint: fingerprint, postgresClaimId: claimId,
    writerCommitSha: SYNTHETIC_WRITER_SHA, runtimeTraceId: traceId,
    outcome: 'SUCCESS', canonicalBookingId: bookingId, claimedAt, finalizedAt,
  };

  await sql`
    INSERT INTO booking_create_outbox (attempt_id, projection_payload)
    VALUES (${attemptId}::uuid, jsonb_build_object(
      'contractVersion', ${payload.contractVersion}::text,
      'attemptId', ${payload.attemptId}::text,
      'requestId', ${payload.requestId}::text,
      'idempotencyKey', ${payload.idempotencyKey}::text,
      'requestFingerprint', ${payload.requestFingerprint}::text,
      'postgresClaimId', ${payload.postgresClaimId}::text,
      'writerCommitSha', ${payload.writerCommitSha}::text,
      'runtimeTraceId', ${payload.runtimeTraceId}::text,
      'outcome', ${payload.outcome}::text,
      'canonicalBookingId', ${bookingId}::text,
      'claimedAt', ${payload.claimedAt}::text,
      'finalizedAt', ${payload.finalizedAt}::text
    ))
  `;

  const [row] = await sql<[{ outbox_id: string; payload_type: string }]>`
    SELECT outbox_id, jsonb_typeof(projection_payload) AS payload_type
    FROM booking_create_outbox WHERE attempt_id = ${attemptId}::uuid
  `;
  assert.ok(row?.outbox_id);
  assert.equal(row?.payload_type, 'object');
  return { bookingId, attemptId, outboxId: row.outbox_id };
}

async function canonicalSnapshot(sql: Sql, attemptId: string) {
  const [row] = await sql<[{ outcome: string; canonical_booking_id: string; booking_count: string }]>`
    SELECT a.outcome::text AS outcome, a.canonical_booking_id, count(b.id)::text AS booking_count
    FROM booking_create_attempts a LEFT JOIN bookings b ON b.id = a.canonical_booking_id
    WHERE a.attempt_id = ${attemptId}::uuid GROUP BY a.outcome, a.canonical_booking_id
  `;
  return row;
}

class IdempotentReceiverTransport implements EvidenceProjectionTransport {
  calls = 0;
  uniqueWrites = 0;
  private readonly delivered = new Set<string>();
  async deliver(payload: ProjectionEnvelope): Promise<void> {
    this.calls += 1;
    if (!this.delivered.has(payload.attemptId)) { this.delivered.add(payload.attemptId); this.uniqueWrites += 1; }
  }
}

test(`${RESILIENCY_GATE}: MULTI_WORKER_RACE = PASS`, async () => {
  const seeded = await seedPendingOutbox(gate.sql, 'race');
  const clients = Array.from({ length: 10 }, () => postgres(gate.connectionString, { max: 1, prepare: false }));
  try {
    const results = await Promise.all(clients.map((client) =>
      new PostgresBookingAttemptOutboxStore(client).claimNext(
        new Date('2026-08-09T17:10:00.000Z'), new Date('2026-08-09T17:15:00.000Z'),
      ),
    ));
    assert.equal(results.filter((item) => item?.outboxId === seeded.outboxId).length, 1);
    assert.equal(results.filter(Boolean).length, 1);
  } finally { await Promise.all(clients.map((client) => client.end({ timeout: 1 }))); }
});

test(`${RESILIENCY_GATE}: STALE_LEASE_RECOVERY = PASS`, async () => {
  const seeded = await seedPendingOutbox(gate.sql, 'stale');
  const storeA = new PostgresBookingAttemptOutboxStore(gate.clientA);
  const storeB = new PostgresBookingAttemptOutboxStore(gate.clientB);
  assert.equal((await storeA.claimNext(new Date('2026-08-09T17:20:00Z'), new Date('2026-08-09T17:20:05Z')))?.outboxId, seeded.outboxId);
  assert.equal(await storeB.claimNext(new Date('2026-08-09T17:20:04Z'), new Date('2026-08-09T17:20:09Z')), null);
  assert.equal((await storeB.claimNext(new Date('2026-08-09T17:20:06Z'), new Date('2026-08-09T17:20:11Z')))?.outboxId, seeded.outboxId);
  const canonical = await canonicalSnapshot(gate.sql, seeded.attemptId);
  assert.equal(canonical?.outcome, 'SUCCESS');
  assert.equal(canonical?.canonical_booking_id, seeded.bookingId);
  assert.equal(canonical?.booking_count, '1');
});

test(`${RESILIENCY_GATE}: WORKER_CRASH_RECOVERY + AMBIGUOUS_SUCCESS_RECOVERY = PASS`, async () => {
  const seeded = await seedPendingOutbox(gate.sql, 'ambiguous');
  const store = new PostgresBookingAttemptOutboxStore(gate.sql);
  const receiver = new IdempotentReceiverTransport();
  const item = await store.claimNext(new Date('2026-08-09T17:30:00Z'), new Date('2026-08-09T17:30:05Z'));
  assert.equal(item?.outboxId, seeded.outboxId);
  assert.ok(item);
  await receiver.deliver(item.projectionPayload as ProjectionEnvelope);
  assert.equal(receiver.uniqueWrites, 1);

  let now = new Date('2026-08-09T17:30:04Z');
  const workerB = new BookingAttemptOutboxWorker(store, receiver, { now: () => now, processingLeaseMs: 5_000, retryDelayMs: () => 1_000 });
  assert.equal((await workerB.runOnce()).status, 'IDLE');
  now = new Date('2026-08-09T17:30:06Z');
  assert.equal((await workerB.runOnce()).status, 'DELIVERED');
  assert.equal(receiver.calls, 2);
  assert.equal(receiver.uniqueWrites, 1);

  const [outbox] = await gate.sql<[{ status: string; processed_at: Date | null; next_attempt_at: Date | null }]>`
    SELECT status::text, processed_at, next_attempt_at FROM booking_create_outbox WHERE outbox_id = ${seeded.outboxId}::uuid
  `;
  assert.equal(outbox?.status, 'SUCCESS');
  assert.ok(outbox?.processed_at);
  assert.equal(outbox?.next_attempt_at, null);
  const canonical = await canonicalSnapshot(gate.sql, seeded.attemptId);
  assert.equal(canonical?.outcome, 'SUCCESS');
  assert.equal(canonical?.canonical_booking_id, seeded.bookingId);
  assert.equal(canonical?.booking_count, '1');
});
