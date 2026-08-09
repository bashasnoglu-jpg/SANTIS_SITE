import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';

import { bookingCreateAttempts } from '../schema/booking-attempt.js';
import {
  ClaimOwnerAlreadyExistsError,
  type AttemptFinalizeInput,
  type AttemptObservationInsert,
  type AttemptOwnerInsert,
  type BookingAttemptRepository,
} from './repository.js';
import type {
  ExistingAuthoritativeClaim,
  ProjectionEnvelope,
} from './contracts.js';

interface DrizzleLikeDb {
  insert(table: unknown): any;
  select(fields?: unknown): any;
  update(table: unknown): any;
  execute(query: unknown): any;
  transaction<T>(callback: (tx: DrizzleLikeDb) => Promise<T>): Promise<T>;
}

function isPostgresUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === '23505',
  );
}

async function insertProjectionIntent(
  tx: DrizzleLikeDb,
  attemptId: string,
  payload: ProjectionEnvelope,
): Promise<void> {
  // Do not pass the full object through the Drizzle JSONB mapper. With the current
  // Drizzle/postgres-js versions that path can physically persist JSON text as a
  // JSONB string. Build the object inside PostgreSQL from scalar parameters so the
  // database itself guarantees jsonb_typeof(projection_payload) = 'object'.
  await tx.execute(sql`
    INSERT INTO booking_create_outbox (attempt_id, projection_payload)
    VALUES (
      ${attemptId}::uuid,
      jsonb_strip_nulls(
        jsonb_build_object(
          'contractVersion', ${payload.contractVersion},
          'attemptId', ${payload.attemptId},
          'requestId', ${payload.requestId},
          'idempotencyKey', ${payload.idempotencyKey},
          'requestFingerprint', ${payload.requestFingerprint},
          'postgresClaimId', ${payload.postgresClaimId},
          'writerCommitSha', ${payload.writerCommitSha},
          'runtimeTraceId', ${payload.runtimeTraceId},
          'outcome', ${payload.outcome},
          'reasonCode', ${payload.reasonCode ?? null},
          'canonicalBookingId', ${payload.canonicalBookingId ?? null},
          'claimedAt', ${payload.claimedAt},
          'finalizedAt', ${payload.finalizedAt}
        )
      )
    )
  `);
}

export class DrizzleBookingAttemptRepository implements BookingAttemptRepository {
  constructor(private readonly db: DrizzleLikeDb) {}

  async insertClaimOwner(input: AttemptOwnerInsert) {
    try {
      const [row] = await this.db
        .insert(bookingCreateAttempts)
        .values({
          requestId: input.requestId,
          idempotencyKey: input.idempotencyKey,
          requestFingerprint: input.requestFingerprint,
          writerCommitSha: input.writerCommitSha,
          runtimeTraceId: input.runtimeTraceId,
          postgresClaimId: randomUUID(),
          claimOwner: true,
        })
        .returning({
          attemptId: bookingCreateAttempts.attemptId,
          postgresClaimId: bookingCreateAttempts.postgresClaimId,
          claimedAt: bookingCreateAttempts.claimedAt,
        });

      if (!row) throw new Error('BOOKING_ATTEMPT_OWNER_INSERT_RETURNED_NO_ROW');
      return row;
    } catch (error) {
      if (isPostgresUniqueViolation(error)) {
        throw new ClaimOwnerAlreadyExistsError(input.idempotencyKey);
      }
      throw error;
    }
  }

  async findClaimOwner(idempotencyKey: string): Promise<ExistingAuthoritativeClaim | null> {
    const rows = await this.db
      .select()
      .from(bookingCreateAttempts)
      .where(
        and(
          eq(bookingCreateAttempts.idempotencyKey, idempotencyKey),
          eq(bookingCreateAttempts.claimOwner, true),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      attemptId: row.attemptId,
      postgresClaimId: row.postgresClaimId,
      idempotencyKey: row.idempotencyKey,
      requestFingerprint: row.requestFingerprint,
      outcome: row.outcome,
      reasonCode: row.reasonCode,
      canonicalBookingId: row.canonicalBookingId,
      finalizedAt: row.finalizedAt,
    };
  }

  async appendObservationWithProjection(
    input: AttemptObservationInsert,
    buildProjection: (attemptId: string) => ProjectionEnvelope,
  ): Promise<{ attemptId: string }> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(bookingCreateAttempts)
        .values({
          requestId: input.requestId,
          idempotencyKey: input.idempotencyKey,
          requestFingerprint: input.requestFingerprint,
          writerCommitSha: input.writerCommitSha,
          runtimeTraceId: input.runtimeTraceId,
          postgresClaimId: input.postgresClaimId,
          claimOwner: false,
          outcome: input.outcome,
          reasonCode: input.reasonCode,
          canonicalBookingId: input.canonicalBookingId,
          finalizedAt: new Date(),
        })
        .returning({ attemptId: bookingCreateAttempts.attemptId });

      if (!row) throw new Error('BOOKING_ATTEMPT_OBSERVATION_INSERT_RETURNED_NO_ROW');

      await insertProjectionIntent(tx, row.attemptId, buildProjection(row.attemptId));
      return row;
    });
  }

  async finalizeOwnerWithProjection(
    input: AttemptFinalizeInput,
    payload: ProjectionEnvelope,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const finalized = await tx
        .update(bookingCreateAttempts)
        .set({
          outcome: input.outcome,
          reasonCode: input.reasonCode,
          canonicalBookingId: input.canonicalBookingId,
          finalizedAt: new Date(payload.finalizedAt),
        })
        .where(
          and(
            eq(bookingCreateAttempts.attemptId, input.attemptId),
            eq(bookingCreateAttempts.claimOwner, true),
          ),
        )
        .returning({ attemptId: bookingCreateAttempts.attemptId });

      if (finalized.length !== 1) {
        throw new Error('BOOKING_ATTEMPT_OWNER_FINALIZE_CARDINALITY_VIOLATION');
      }

      await insertProjectionIntent(tx, input.attemptId, payload);
    });
  }
}
