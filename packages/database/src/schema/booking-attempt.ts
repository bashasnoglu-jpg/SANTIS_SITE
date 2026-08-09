import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { bookings } from './scheduling.js';

export const bookingAttemptOutcomeEnum = pgEnum('booking_attempt_outcome', [
  'SUCCESS',
  'FAILURE',
  'REPLAYED',
  'IDEMPOTENCY_CONFLICT',
  'CONCURRENCY_REJECTED',
]);

export const bookingProjectionStatusEnum = pgEnum('booking_projection_status', [
  'PENDING',
  'PROCESSING',
  'SUCCESS',
  'FAILED',
]);

export const bookingCreateAttempts = pgTable(
  'booking_create_attempts',
  {
    attemptId: uuid('attempt_id').defaultRandom().primaryKey(),
    requestId: varchar('request_id', { length: 255 }).notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 512 }).notNull(),
    requestFingerprint: varchar('request_fingerprint', { length: 128 }).notNull(),
    postgresClaimId: uuid('postgres_claim_id').notNull(),
    claimOwner: boolean('claim_owner').notNull().default(false),
    writerCommitSha: varchar('writer_commit_sha', { length: 64 }).notNull(),
    runtimeTraceId: varchar('runtime_trace_id', { length: 255 }).notNull(),
    outcome: bookingAttemptOutcomeEnum('outcome'),
    reasonCode: varchar('reason_code', { length: 128 }),
    canonicalBookingId: uuid('canonical_booking_id').references(() => bookings.id),
    claimedAt: timestamp('claimed_at', { withTimezone: true }).notNull().defaultNow(),
    finalizedAt: timestamp('finalized_at', { withTimezone: true }),
  },
  (t) => ({
    claimOwnerUnique: uniqueIndex('uq_booking_attempt_claim_owner')
      .on(t.idempotencyKey)
      .where(sql`${t.claimOwner} = true`),
    requestIdx: index('ix_booking_attempt_request').on(t.requestId, t.claimedAt),
    claimIdx: index('ix_booking_attempt_claim').on(t.postgresClaimId, t.claimedAt),
    traceIdx: index('ix_booking_attempt_trace').on(t.runtimeTraceId),
  }),
);

export const bookingCreateOutbox = pgTable(
  'booking_create_outbox',
  {
    outboxId: uuid('outbox_id').defaultRandom().primaryKey(),
    attemptId: uuid('attempt_id')
      .notNull()
      .references(() => bookingCreateAttempts.attemptId, { onDelete: 'restrict' }),
    projectionPayload: jsonb('projection_payload').notNull(),
    status: bookingProjectionStatusEnum('status').notNull().default('PENDING'),
    retryCount: integer('retry_count').notNull().default(0),
    lastErrorCode: varchar('last_error_code', { length: 128 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (t) => ({
    attemptUnique: uniqueIndex('uq_booking_outbox_attempt').on(t.attemptId),
    deliveryIdx: index('ix_booking_outbox_delivery').on(
      t.status,
      t.nextAttemptAt,
      t.createdAt,
    ),
  }),
);
