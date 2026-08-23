import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveExistingClaim,
  type ExistingAuthoritativeClaim,
} from './contracts.js';

const successfulClaim: ExistingAuthoritativeClaim = {
  attemptId: 'attempt-1',
  postgresClaimId: 'claim-1',
  idempotencyKey: 'idem-1',
  requestFingerprint: 'sha256:aaa',
  outcome: 'SUCCESS',
  canonicalBookingId: 'booking-1',
  finalizedAt: new Date('2026-08-09T12:00:00.000Z'),
};

test('same idempotency key semantics: same fingerprint replays canonical success', () => {
  assert.deepEqual(
    resolveExistingClaim(
      { requestFingerprint: 'sha256:aaa' },
      successfulClaim,
    ),
    {
      outcome: 'REPLAYED',
      postgresClaimId: 'claim-1',
      canonicalBookingId: 'booking-1',
      reasonCode: 'IDEMPOTENT_REPLAY',
    },
  );
});

test('same idempotency key semantics: different fingerprint fails closed', () => {
  assert.deepEqual(
    resolveExistingClaim(
      { requestFingerprint: 'sha256:bbb' },
      successfulClaim,
    ),
    {
      outcome: 'IDEMPOTENCY_CONFLICT',
      postgresClaimId: 'claim-1',
      reasonCode: 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD',
    },
  );
});

test('same fingerprint while authoritative claim is in progress is concurrency-rejected', () => {
  const inProgress: ExistingAuthoritativeClaim = {
    ...successfulClaim,
    outcome: null,
    canonicalBookingId: null,
    finalizedAt: null,
  };

  assert.deepEqual(
    resolveExistingClaim(
      { requestFingerprint: 'sha256:aaa' },
      inProgress,
    ),
    {
      outcome: 'CONCURRENCY_REJECTED',
      postgresClaimId: 'claim-1',
      reasonCode: 'AUTHORITATIVE_CLAIM_IN_PROGRESS',
    },
  );
});

test('same fingerprint replays an authoritative failure without creating a booking', () => {
  const failed: ExistingAuthoritativeClaim = {
    ...successfulClaim,
    outcome: 'FAILURE',
    canonicalBookingId: null,
    reasonCode: 'ROOM_CONFLICT',
  };

  assert.deepEqual(
    resolveExistingClaim(
      { requestFingerprint: 'sha256:aaa' },
      failed,
    ),
    {
      outcome: 'REPLAYED',
      postgresClaimId: 'claim-1',
      reasonCode: 'ROOM_CONFLICT',
    },
  );
});

test('successful replay without canonical booking id is rejected as corrupt evidence', () => {
  assert.throws(
    () =>
      resolveExistingClaim(
        { requestFingerprint: 'sha256:aaa' },
        { ...successfulClaim, canonicalBookingId: null },
      ),
    /BOOKING_ATTEMPT_REPLAY_MISSING_CANONICAL_BOOKING_ID/,
  );
});
