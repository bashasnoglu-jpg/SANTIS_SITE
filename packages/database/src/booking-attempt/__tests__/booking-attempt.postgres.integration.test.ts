import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';

import type { Sql } from 'postgres';

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

async function insertOwner(
  sql: Sql,
  key: string,
  fingerprint = 'sha256:aaa',
): Promise<{ attemptId: string; claimId: string }> {
  const rows = await sql<[{ attempt_id: string; postgres_claim_id: string }]>`
    INSERT INTO booking_create_attempts (
      request_id,
      idempotency_key,
      request_fingerprint,
      postgres_claim_id,
      claim_owner,
      writer_commit_sha,
      runtime_trace_id
    ) VALUES (
      ${`request-${key}`},
      ${key},
      ${fingerprint},
      gen_random_uuid(),
      TRUE,
      ${'a'.repeat(40)},
      ${`trace-${key}`}
    )
    RETURNING attempt_id, postgres_claim_id
  `;

  const row = rows[0];
  assert.ok(row);
  return { attemptId: row.attempt_id, claimId: row.postgres_claim_id };
}

async function insertCanonicalBooking(sql: Sql): Promise<string> {
  const rows = await sql<[{ id: string }]>`
    INSERT INTO bookings (id) VALUES (gen_random_uuid()) RETURNING id
  `;
  const row = rows[0];
  assert.ok(row);
  return row.id;
}

test(`${INTEGRATION_GATE_NAME}: REAL_23505_PARTIAL_UNIQUE = PASS`, async () => {
  await insertOwner(gate.sql, 'physical-23505');

  await assert.rejects(
    insertOwner(gate.sql, 'physical-23505'),
    (error: unknown) => {
      assert.equal((error as { code?: string }).code, '23505');
      return true;
    },
  );

  const owners = await gate.sql<[{ count: string }]>`
    SELECT count(*)::text AS count
    FROM booking_create_attempts
    WHERE idempotency_key = 'physical-23505' AND claim_owner = TRUE
  `;
  assert.equal(owners[0]?.count, '1');
});

test(`${INTEGRATION_GATE_NAME}: CONCURRENT_SINGLE_OWNER = PASS`, async () => {
  const key = 'physical-race';

  const results = await Promise.allSettled([
    insertOwner(gate.clientA, key, 'sha256:race'),
    insertOwner(gate.clientB, key, 'sha256:race'),
  ]);

  const fulfilled = results.filter((result) => result.status === 'fulfilled');
  const rejected = results.filter((result) => result.status === 'rejected');

  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal(
    ((rejected[0] as PromiseRejectedResult).reason as { code?: string }).code,
    '23505',
  );

  const owners = await gate.sql<[{ count: string }]>`
    SELECT count(*)::text AS count
    FROM booking_create_attempts
    WHERE idempotency_key = ${key} AND claim_owner = TRUE
  `;
  assert.equal(owners[0]?.count, '1');
});

test(`${INTEGRATION_GATE_NAME}: BUSINESS_ROLLBACK_CLAIM_PERSISTS = PASS`, async () => {
  const owner = await insertOwner(gate.sql, 'physical-rollback');

  await assert.rejects(
    gate.clientA.begin(async (tx) => {
      await tx`
        INSERT INTO booking_business_probe (attempt_id, marker)
        VALUES (${owner.attemptId}::uuid, 'ROLLBACK_ME')
      `;
      throw new Error('INTENTIONAL_BUSINESS_ROLLBACK');
    }),
    /INTENTIONAL_BUSINESS_ROLLBACK/,
  );

  await gate.sql`
    UPDATE booking_create_attempts
    SET outcome = 'FAILURE',
        reason_code = 'BUSINESS_ROLLBACK_TEST',
        finalized_at = NOW()
    WHERE attempt_id = ${owner.attemptId}::uuid
  `;

  const probe = await gate.sql<[{ count: string }]>`
    SELECT count(*)::text AS count
    FROM booking_business_probe
    WHERE attempt_id = ${owner.attemptId}::uuid
  `;
  assert.equal(probe[0]?.count, '0');

  const attempt = await gate.sql<[{ outcome: string; reason_code: string }]>`
    SELECT outcome::text, reason_code
    FROM booking_create_attempts
    WHERE attempt_id = ${owner.attemptId}::uuid
  `;
  assert.equal(attempt[0]?.outcome, 'FAILURE');
  assert.equal(attempt[0]?.reason_code, 'BUSINESS_ROLLBACK_TEST');
});

test(`${INTEGRATION_GATE_NAME}: FINALIZE_OUTBOX_ATOMICITY = PASS`, async () => {
  const owner = await insertOwner(gate.sql, 'physical-atomicity');
  const bookingId = await insertCanonicalBooking(gate.sql);

  await assert.rejects(
    gate.sql.begin(async (tx) => {
      await tx`
        UPDATE booking_create_attempts
        SET outcome = 'SUCCESS',
            canonical_booking_id = ${bookingId}::uuid,
            finalized_at = NOW()
        WHERE attempt_id = ${owner.attemptId}::uuid
      `;

      // Deliberately violates booking_outbox_processed_shape_ck.
      await tx`
        INSERT INTO booking_create_outbox (
          attempt_id,
          projection_payload,
          status,
          processed_at
        ) VALUES (
          ${owner.attemptId}::uuid,
          ${JSON.stringify({ proof: 'atomicity' })}::jsonb,
          'SUCCESS',
          NULL
        )
      `;
    }),
    (error: unknown) => {
      assert.equal((error as { code?: string }).code, '23514');
      return true;
    },
  );

  const attempt = await gate.sql<[{ outcome: string | null; finalized_at: Date | null }]>`
    SELECT outcome::text, finalized_at
    FROM booking_create_attempts
    WHERE attempt_id = ${owner.attemptId}::uuid
  `;
  assert.equal(attempt[0]?.outcome, null);
  assert.equal(attempt[0]?.finalized_at, null);

  const outbox = await gate.sql<[{ count: string }]>`
    SELECT count(*)::text AS count
    FROM booking_create_outbox
    WHERE attempt_id = ${owner.attemptId}::uuid
  `;
  assert.equal(outbox[0]?.count, '0');
});

test(`${INTEGRATION_GATE_NAME}: FINALIZED_ROW_UPDATE_DENIED = PASS`, async () => {
  const owner = await insertOwner(gate.sql, 'physical-update-denied');
  const bookingId = await insertCanonicalBooking(gate.sql);

  await gate.sql.begin(async (tx) => {
    await tx`
      UPDATE booking_create_attempts
      SET outcome = 'SUCCESS',
          canonical_booking_id = ${bookingId}::uuid,
          finalized_at = NOW()
      WHERE attempt_id = ${owner.attemptId}::uuid
    `;
    await tx`
      INSERT INTO booking_create_outbox (attempt_id, projection_payload)
      VALUES (${owner.attemptId}::uuid, ${JSON.stringify({ proof: 'immutability' })}::jsonb)
    `;
  });

  await assert.rejects(
    gate.sql`
      UPDATE booking_create_attempts
      SET outcome = 'FAILURE'
      WHERE attempt_id = ${owner.attemptId}::uuid
    `,
    /BOOKING_ATTEMPT_FINALIZED_IMMUTABLE/,
  );
});

test(`${INTEGRATION_GATE_NAME}: FINALIZED_ROW_DELETE_DENIED = PASS`, async () => {
  const owner = await insertOwner(gate.sql, 'physical-delete-denied');

  await gate.sql`
    UPDATE booking_create_attempts
    SET outcome = 'FAILURE',
        reason_code = 'FINALIZE_FOR_DELETE_TEST',
        finalized_at = NOW()
    WHERE attempt_id = ${owner.attemptId}::uuid
  `;

  await assert.rejects(
    gate.sql`
      DELETE FROM booking_create_attempts
      WHERE attempt_id = ${owner.attemptId}::uuid
    `,
    /BOOKING_ATTEMPT_DELETE_FORBIDDEN/,
  );
});

test(`${INTEGRATION_GATE_NAME}: DUPLICATE_OWNER = 0 / ORPHAN_OUTBOX = 0`, async () => {
  const duplicateOwners = await gate.sql<[{ count: string }]>`
    SELECT count(*)::text AS count
    FROM (
      SELECT idempotency_key
      FROM booking_create_attempts
      WHERE claim_owner = TRUE
      GROUP BY idempotency_key
      HAVING count(*) > 1
    ) duplicate_owner_keys
  `;
  assert.equal(duplicateOwners[0]?.count, '0');

  const orphanOutbox = await gate.sql<[{ count: string }]>`
    SELECT count(*)::text AS count
    FROM booking_create_outbox o
    LEFT JOIN booking_create_attempts a ON a.attempt_id = o.attempt_id
    WHERE a.attempt_id IS NULL
  `;
  assert.equal(orphanOutbox[0]?.count, '0');
});
