import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';

import {
  bookingCreateAttempts,
  bookingCreateOutbox,
} from '../schema/booking-attempt.js';
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

function projectionJsonb(payload: ProjectionEnvelope) {
  // Drizzle 0.30 + postgres-js can otherwise double-encode an object supplied to
  // this JSONB column into a JSON string. Explicit SQL JSONB construction keeps
  // the physical database value an object, which is part of the evidence contract.
  return sql`${JSON.stringify(payload)}::jsonb`;
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

      const payload = buildProjection(row.attemptId);
      await tx.insert(bookingCreateOutbox).values({
        attemptId: row.attemptId,
        projectionPayload: projectionJsonb(payload),
      });

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

      await tx.insert(bookingCreateOutbox).values({
        attemptId: input.attemptId,
        projectionPayload: projectionJsonb(payload),
      });
    });
  }
}
