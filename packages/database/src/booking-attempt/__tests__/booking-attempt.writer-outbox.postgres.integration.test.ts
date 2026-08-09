import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test, { after, before } from 'node:test';

import { drizzle } from 'drizzle-orm/postgres-js';

import { DrizzleBookingAttemptRepository } from '../drizzle-repository.js';
import { BookingAttemptOrchestrationService } from '../service.js';
import {
  PostgresCanonicalBookingExecutor,
  type CanonicalBookingCreateInput,
} from '../postgres-booking-executor.js';
import { PostgresBookingAttemptOutboxStore } from '../postgres-outbox-store.js';
import {
  BookingAttemptOutboxWorker,
  assertProjectionEnvelope,
  type EvidenceProjectionTransport,
} from '../outbox-worker.js';
import {
  INTEGRATION_GATE_NAME,
  setupPostgresIntegrationGate,
  type PostgresIntegrationGate,
} from './postgres-integration-harness.js';

let gate: PostgresIntegrationGate;

before(async () => {
  gate = await setupPostgresIntegrationGate();
});

after(async () => {
  await gate.close();
});

class ScriptedProjectionTransport implements EvidenceProjectionTransport {
  calls = 0;

  async deliver(): Promise<void> {
    this.calls += 1;
    if (this.calls === 1) {
      const error = new Error('SIMULATED_AIRTABLE_503');
      (error as Error & { code: string }).code = 'AIRTABLE_503_SIMULATED';
      throw error;
    }
  }
}

function businessData(): CanonicalBookingCreateInput {
  const start = new Date('2026-08-10T10:00:00.000Z');
  const end = new Date('2026-08-10T11:00:00.000Z');
  const cleanup = new Date('2026-08-10T11:15:00.000Z');

  return {
    tenantId: randomUUID(),
    serviceId: randomUUID(),
    roomId: randomUUID(),
    therapistId: randomUUID(),
    serviceStartTime: start,
    serviceEndTime: end,
    cleanupEndTime: cleanup,
    bookingSource: 'online',
    bookingStatus: 'confirmed',
    customerInfo: { gate: 'writer-outbox-covenant' },
    notes: 'ephemeral integration proof only',
  };
}

test(`${INTEGRATION_GATE_NAME}: CANONICAL_WRITER_JOIN + OUTBOX_RETRY_COVENANT = PASS`, async () => {
  const db = drizzle(gate.sql);
  const repository = new DrizzleBookingAttemptRepository(db as any);
  const executor = new PostgresCanonicalBookingExecutor(gate.sql);
  const service = new BookingAttemptOrchestrationService(
    repository,
    executor,
    () => new Date('2026-08-09T16:40:00.000Z'),
  );

  const request = {
    requestId: `request-${randomUUID()}`,
    idempotencyKey: `writer-outbox-${randomUUID()}`,
    requestFingerprint: `sha256:${'b'.repeat(64)}`,
    writerCommitSha: '5fad743959dac646735d62e981037b60b0031bee',
    runtimeTraceId: `trace-${randomUUID()}`,
    businessData: businessData(),
  };

  const result = await service.handle(request);
  assert.equal(result.kind, 'OWNER_SUCCESS');
  assert.ok(result.attemptId);
  assert.ok(result.canonicalBookingId);

  const joined = await gate.sql<[
    {
      attempt_id: string;
      canonical_booking_id: string;
      booking_id: string;
      outcome: string;
      outbox_count: string;
    },
  ]>`
    SELECT
      a.attempt_id,
      a.canonical_booking_id,
      b.id AS booking_id,
      a.outcome::text AS outcome,
      count(o.outbox_id)::text AS outbox_count
    FROM booking_create_attempts a
    JOIN bookings b ON b.id = a.canonical_booking_id
    LEFT JOIN booking_create_outbox o ON o.attempt_id = a.attempt_id
    WHERE a.attempt_id = ${result.attemptId}::uuid
    GROUP BY a.attempt_id, a.canonical_booking_id, b.id, a.outcome
  `;

  assert.equal(joined[0]?.outcome, 'SUCCESS');
  assert.equal(joined[0]?.canonical_booking_id, result.canonicalBookingId);
  assert.equal(joined[0]?.booking_id, result.canonicalBookingId);
  assert.equal(joined[0]?.outbox_count, '1');

  const initialOutbox = await gate.sql<[
    {
      outbox_id: string;
      projection_payload: unknown;
      status: string;
      retry_count: number;
      processed_at: Date | null;
    },
  ]>`
    SELECT outbox_id, projection_payload, status::text, retry_count, processed_at
    FROM booking_create_outbox
    WHERE attempt_id = ${result.attemptId}::uuid
  `;

  assert.equal(initialOutbox[0]?.status, 'PENDING');
  assert.equal(initialOutbox[0]?.retry_count, 0);
  assert.equal(initialOutbox[0]?.processed_at, null);
  assertProjectionEnvelope(initialOutbox[0]?.projection_payload);

  const store = new PostgresBookingAttemptOutboxStore(gate.sql);
  const transport = new ScriptedProjectionTransport();
  let now = new Date('2026-08-09T16:41:00.000Z');
  const worker = new BookingAttemptOutboxWorker(store, transport, {
    now: () => now,
    processingLeaseMs: 5_000,
    retryDelayMs: () => 1_000,
  });

  const failedDelivery = await worker.runOnce();
  assert.equal(failedDelivery.status, 'RETRY_SCHEDULED');

  const afterFailure = await gate.sql<[
    {
      status: string;
      retry_count: number;
      last_error_code: string | null;
      next_attempt_at: Date | null;
      processed_at: Date | null;
    },
  ]>`
    SELECT status::text, retry_count, last_error_code, next_attempt_at, processed_at
    FROM booking_create_outbox
    WHERE attempt_id = ${result.attemptId}::uuid
  `;

  assert.equal(afterFailure[0]?.status, 'FAILED');
  assert.equal(afterFailure[0]?.retry_count, 1);
  assert.equal(afterFailure[0]?.last_error_code, 'AIRTABLE_503_SIMULATED');
  assert.ok(afterFailure[0]?.next_attempt_at);
  assert.equal(afterFailure[0]?.processed_at, null);

  const canonicalAfterFailure = await gate.sql<[
    { outcome: string; canonical_booking_id: string; booking_count: string },
  ]>`
    SELECT
      a.outcome::text AS outcome,
      a.canonical_booking_id,
      count(b.id)::text AS booking_count
    FROM booking_create_attempts a
    LEFT JOIN bookings b ON b.id = a.canonical_booking_id
    WHERE a.attempt_id = ${result.attemptId}::uuid
    GROUP BY a.outcome, a.canonical_booking_id
  `;

  assert.equal(canonicalAfterFailure[0]?.outcome, 'SUCCESS');
  assert.equal(canonicalAfterFailure[0]?.canonical_booking_id, result.canonicalBookingId);
  assert.equal(canonicalAfterFailure[0]?.booking_count, '1');

  now = new Date('2026-08-09T16:41:00.500Z');
  const tooEarly = await worker.runOnce();
  assert.equal(tooEarly.status, 'IDLE');
  assert.equal(transport.calls, 1);

  now = new Date('2026-08-09T16:41:02.000Z');
  const retrySuccess = await worker.runOnce();
  assert.equal(retrySuccess.status, 'DELIVERED');
  assert.equal(transport.calls, 2);

  const finalOutbox = await gate.sql<[
    {
      status: string;
      retry_count: number;
      processed_at: Date | null;
      next_attempt_at: Date | null;
      outbox_count: string;
    },
  ]>`
    SELECT
      max(status::text) AS status,
      max(retry_count)::int AS retry_count,
      max(processed_at) AS processed_at,
      max(next_attempt_at) AS next_attempt_at,
      count(*)::text AS outbox_count
    FROM booking_create_outbox
    WHERE attempt_id = ${result.attemptId}::uuid
  `;

  assert.equal(finalOutbox[0]?.status, 'SUCCESS');
  assert.equal(finalOutbox[0]?.retry_count, 1);
  assert.ok(finalOutbox[0]?.processed_at);
  assert.equal(finalOutbox[0]?.next_attempt_at, null);
  assert.equal(finalOutbox[0]?.outbox_count, '1');

  const canonicalFinal = await gate.sql<[
    { outcome: string; canonical_booking_id: string; booking_count: string },
  ]>`
    SELECT
      a.outcome::text AS outcome,
      a.canonical_booking_id,
      count(b.id)::text AS booking_count
    FROM booking_create_attempts a
    LEFT JOIN bookings b ON b.id = a.canonical_booking_id
    WHERE a.attempt_id = ${result.attemptId}::uuid
    GROUP BY a.outcome, a.canonical_booking_id
  `;

  assert.equal(canonicalFinal[0]?.outcome, 'SUCCESS');
  assert.equal(canonicalFinal[0]?.canonical_booking_id, result.canonicalBookingId);
  assert.equal(canonicalFinal[0]?.booking_count, '1');
});
