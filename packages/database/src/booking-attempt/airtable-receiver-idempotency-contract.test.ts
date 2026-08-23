import assert from 'node:assert/strict';
import test from 'node:test';

import type { ProjectionEnvelope } from './contracts.js';
import {
  EvidenceIntegrityConflict,
  MockAirtableEvidenceAdapter,
  generateProjectionFingerprint,
} from './mock-airtable-evidence-adapter.js';
import {
  BookingAttemptOutboxWorker,
  type BookingAttemptOutboxItem,
  type BookingAttemptOutboxStore,
} from './outbox-worker.js';

const envelope: ProjectionEnvelope = {
  contractVersion: 'BOOKING-CREATE-ATTEMPT-1.0',
  attemptId: 'attempt-receiver-1',
  requestId: 'request-receiver-1',
  idempotencyKey: 'idem-receiver-1',
  requestFingerprint: `sha256:${'a'.repeat(64)}`,
  postgresClaimId: 'claim-receiver-1',
  writerCommitSha: 'b'.repeat(40),
  runtimeTraceId: 'trace-receiver-1',
  outcome: 'SUCCESS',
  canonicalBookingId: 'booking-receiver-1',
  claimedAt: '2026-08-09T18:00:00.000Z',
  finalizedAt: '2026-08-09T18:00:01.000Z',
};

class ReceiverGateStore implements BookingAttemptOutboxStore {
  item: BookingAttemptOutboxItem | null = {
    outboxId: 'outbox-receiver-1',
    attemptId: envelope.attemptId,
    projectionPayload: envelope,
    retryCount: 0,
  };
  status: 'PENDING' | 'PROCESSING' | 'FAILED' | 'SUCCESS' = 'PENDING';
  nextAttemptAt: Date | null = null;
  terminal = false;
  failFirstSuccessAck = false;

  async claimNext(now: Date, leaseUntil: Date) {
    if (!this.item || this.status === 'SUCCESS' || this.terminal) return null;
    if (this.status === 'FAILED' && this.nextAttemptAt === null) return null;
    if (this.nextAttemptAt && this.nextAttemptAt > now) return null;
    this.status = 'PROCESSING';
    this.nextAttemptAt = leaseUntil;
    return { ...this.item };
  }

  async markSuccess(_outboxId: string, _processedAt: Date) {
    if (this.failFirstSuccessAck) {
      this.failFirstSuccessAck = false;
      throw new Error('SIMULATED_POST_DELIVERY_DB_ACK_FAILURE');
    }
    this.status = 'SUCCESS';
    this.nextAttemptAt = null;
  }

  async markFailure(_outboxId: string, _errorCode: string, nextAttemptAt: Date) {
    this.status = 'FAILED';
    this.item = this.item ? { ...this.item, retryCount: this.item.retryCount + 1 } : null;
    this.nextAttemptAt = nextAttemptAt;
  }

  async markTerminalFailure(_outboxId: string, _errorCode: string) {
    this.status = 'FAILED';
    this.item = this.item ? { ...this.item, retryCount: this.item.retryCount + 1 } : null;
    this.nextAttemptAt = null;
    this.terminal = true;
  }
}

test('RULE A: new evidence creates exactly one logical record', async () => {
  const adapter = new MockAirtableEvidenceAdapter();
  await adapter.deliver(envelope);

  assert.equal(adapter.size, 1);
  assert.equal(adapter.logicalWrites, 1);
  assert.equal(adapter.transportCalls, 1);
  assert.deepEqual(adapter.get(envelope.attemptId), envelope);
});

test('RULE B: exact replay is idempotent success with zero mutation', async () => {
  const adapter = new MockAirtableEvidenceAdapter();
  const beforeHash = generateProjectionFingerprint(envelope);

  await adapter.deliver(envelope);
  await adapter.deliver({ ...envelope });

  assert.equal(adapter.size, 1);
  assert.equal(adapter.logicalWrites, 1);
  assert.equal(adapter.transportCalls, 2);
  assert.equal(generateProjectionFingerprint(adapter.get(envelope.attemptId)!), beforeHash);
});

test('RULE C: same attempt identity with drift is terminal and preserves existing evidence', async () => {
  const adapter = new MockAirtableEvidenceAdapter();
  await adapter.deliver(envelope);
  const before = adapter.get(envelope.attemptId);

  await assert.rejects(
    adapter.deliver({ ...envelope, runtimeTraceId: 'trace-tampered' }),
    (error: unknown) => {
      assert.ok(error instanceof EvidenceIntegrityConflict);
      assert.equal(error.retryable, false);
      assert.equal(error.code, 'EVIDENCE_INTEGRITY_CONFLICT');
      return true;
    },
  );

  assert.equal(adapter.size, 1);
  assert.equal(adapter.logicalWrites, 1);
  assert.deepEqual(adapter.get(envelope.attemptId), before);
});

test('RULE C through worker: integrity conflict becomes terminal and is not retried', async () => {
  const adapter = new MockAirtableEvidenceAdapter();
  await adapter.deliver(envelope);

  const store = new ReceiverGateStore();
  store.item = {
    ...store.item!,
    projectionPayload: { ...envelope, runtimeTraceId: 'trace-conflict' },
  };
  const worker = new BookingAttemptOutboxWorker(store, adapter);

  const first = await worker.runOnce();
  assert.equal(first.status, 'TERMINAL_REJECTED');
  assert.equal(store.terminal, true);
  assert.equal(store.nextAttemptAt, null);
  assert.equal(adapter.logicalWrites, 1);

  const second = await worker.runOnce();
  assert.equal(second.status, 'IDLE');
  assert.equal(adapter.logicalWrites, 1);
});

test('ambiguous success: two transport calls still produce one logical receiver write', async () => {
  const adapter = new MockAirtableEvidenceAdapter();
  const store = new ReceiverGateStore();
  store.failFirstSuccessAck = true;

  let now = new Date('2026-08-09T18:10:00.000Z');
  const worker = new BookingAttemptOutboxWorker(store, adapter, {
    now: () => now,
    retryDelayMs: () => 1_000,
  });

  const first = await worker.runOnce();
  assert.equal(first.status, 'RETRY_SCHEDULED');
  assert.equal(adapter.transportCalls, 1);
  assert.equal(adapter.logicalWrites, 1);
  assert.equal(store.status, 'FAILED');

  now = new Date('2026-08-09T18:10:02.000Z');
  const second = await worker.runOnce();
  assert.equal(second.status, 'DELIVERED');
  assert.equal(adapter.transportCalls, 2);
  assert.equal(adapter.logicalWrites, 1);
  assert.equal(adapter.size, 1);
  assert.equal(store.status, 'SUCCESS');
});
