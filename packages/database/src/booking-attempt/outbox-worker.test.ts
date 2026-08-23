import assert from 'node:assert/strict';
import test from 'node:test';

import type { ProjectionEnvelope } from './contracts.js';
import {
  BookingAttemptOutboxWorker,
  assertProjectionEnvelope,
  type BookingAttemptOutboxItem,
  type BookingAttemptOutboxStore,
  type EvidenceProjectionTransport,
} from './outbox-worker.js';

const payload: ProjectionEnvelope = {
  contractVersion: 'BOOKING-CREATE-ATTEMPT-1.0',
  attemptId: 'attempt-1',
  requestId: 'request-1',
  idempotencyKey: 'idem-1',
  requestFingerprint: 'sha256:aaa',
  postgresClaimId: 'claim-1',
  writerCommitSha: 'a'.repeat(40),
  runtimeTraceId: 'trace-1',
  outcome: 'SUCCESS',
  canonicalBookingId: 'booking-1',
  claimedAt: '2026-08-09T16:00:00.000Z',
  finalizedAt: '2026-08-09T16:01:00.000Z',
};

class FakeOutboxStore implements BookingAttemptOutboxStore {
  item: BookingAttemptOutboxItem | null = {
    outboxId: 'outbox-1',
    attemptId: 'attempt-1',
    projectionPayload: payload,
    retryCount: 0,
  };
  status: 'PENDING' | 'PROCESSING' | 'FAILED' | 'SUCCESS' = 'PENDING';
  processedAt: Date | null = null;
  nextAttemptAt: Date | null = null;
  lastErrorCode: string | null = null;
  terminal = false;

  async claimNext(now: Date, leaseUntil: Date) {
    if (!this.item || this.status === 'SUCCESS' || this.terminal) return null;
    if (this.nextAttemptAt && this.nextAttemptAt > now) return null;
    this.status = 'PROCESSING';
    this.nextAttemptAt = leaseUntil;
    return { ...this.item };
  }

  async markSuccess(_outboxId: string, processedAt: Date) {
    this.status = 'SUCCESS';
    this.processedAt = processedAt;
    this.nextAttemptAt = null;
    this.lastErrorCode = null;
  }

  async markFailure(_outboxId: string, errorCode: string, nextAttemptAt: Date) {
    this.status = 'FAILED';
    this.item = this.item ? { ...this.item, retryCount: this.item.retryCount + 1 } : null;
    this.lastErrorCode = errorCode;
    this.nextAttemptAt = nextAttemptAt;
    this.processedAt = null;
  }

  async markTerminalFailure(_outboxId: string, errorCode: string) {
    this.status = 'FAILED';
    this.item = this.item ? { ...this.item, retryCount: this.item.retryCount + 1 } : null;
    this.lastErrorCode = errorCode;
    this.nextAttemptAt = null;
    this.processedAt = null;
    this.terminal = true;
  }
}

class ScriptedTransport implements EvidenceProjectionTransport {
  calls = 0;
  constructor(private readonly failuresBeforeSuccess: number) {}

  async deliver(_payload: ProjectionEnvelope): Promise<void> {
    this.calls += 1;
    if (this.calls <= this.failuresBeforeSuccess) {
      const error = new Error('SIMULATED_503');
      error.name = 'ServiceUnavailableError';
      throw error;
    }
  }
}

class TerminalTransport implements EvidenceProjectionTransport {
  calls = 0;

  async deliver(_payload: ProjectionEnvelope): Promise<void> {
    this.calls += 1;
    const error = new Error('SIMULATED_TERMINAL_CONFLICT') as Error & {
      code: string;
      retryable: false;
    };
    error.code = 'EVIDENCE_INTEGRITY_CONFLICT';
    error.retryable = false;
    throw error;
  }
}

test('projection payload integrity accepts the sealed v1 envelope', () => {
  assert.doesNotThrow(() => assertProjectionEnvelope(payload));
});

test('projection payload integrity fails closed when mandatory evidence is missing', () => {
  const invalid = { ...payload, writerCommitSha: '' };
  assert.throws(
    () => assertProjectionEnvelope(invalid),
    /BOOKING_ATTEMPT_PROJECTION_MISSING_FIELD:writerCommitSha/,
  );
});

test('simulated Airtable outage keeps durable work and schedules retry', async () => {
  const store = new FakeOutboxStore();
  const transport = new ScriptedTransport(1);
  let now = new Date('2026-08-09T16:10:00.000Z');
  const worker = new BookingAttemptOutboxWorker(store, transport, {
    now: () => now,
    processingLeaseMs: 5_000,
    retryDelayMs: () => 1_000,
  });

  const result = await worker.runOnce();

  assert.equal(result.status, 'RETRY_SCHEDULED');
  assert.equal(store.status, 'FAILED');
  assert.equal(store.item?.retryCount, 1);
  assert.equal(store.processedAt, null);
  assert.ok(store.nextAttemptAt);
  assert.equal(transport.calls, 1);

  now = new Date('2026-08-09T16:10:00.500Z');
  const earlyRetry = await worker.runOnce();
  assert.equal(earlyRetry.status, 'IDLE');
  assert.equal(transport.calls, 1);
});

test('idempotent retry succeeds later without creating another work item', async () => {
  const store = new FakeOutboxStore();
  const transport = new ScriptedTransport(1);
  let now = new Date('2026-08-09T16:20:00.000Z');
  const worker = new BookingAttemptOutboxWorker(store, transport, {
    now: () => now,
    retryDelayMs: () => 1_000,
  });

  await worker.runOnce();
  now = new Date('2026-08-09T16:20:02.000Z');
  const result = await worker.runOnce();

  assert.equal(result.status, 'DELIVERED');
  assert.equal(store.status, 'SUCCESS');
  assert.equal(store.item?.retryCount, 1);
  assert.ok(store.processedAt);
  assert.equal(store.nextAttemptAt, null);
  assert.equal(transport.calls, 2);

  const third = await worker.runOnce();
  assert.equal(third.status, 'IDLE');
  assert.equal(transport.calls, 2);
});

test('non-retryable evidence conflict is terminal and never requeued', async () => {
  const store = new FakeOutboxStore();
  const transport = new TerminalTransport();
  const worker = new BookingAttemptOutboxWorker(store, transport);

  const result = await worker.runOnce();
  assert.equal(result.status, 'TERMINAL_REJECTED');
  assert.equal(store.status, 'FAILED');
  assert.equal(store.terminal, true);
  assert.equal(store.nextAttemptAt, null);
  assert.equal(store.lastErrorCode, 'EVIDENCE_INTEGRITY_CONFLICT');
  assert.equal(store.item?.retryCount, 1);

  const second = await worker.runOnce();
  assert.equal(second.status, 'IDLE');
  assert.equal(transport.calls, 1);
});
