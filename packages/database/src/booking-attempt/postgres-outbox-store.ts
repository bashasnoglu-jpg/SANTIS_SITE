import type { Sql } from 'postgres';

import type {
  BookingAttemptOutboxItem,
  BookingAttemptOutboxStore,
} from './outbox-worker.js';

interface OutboxRow {
  outbox_id: string;
  attempt_id: string;
  projection_payload: unknown;
  retry_count: number;
}

export class PostgresBookingAttemptOutboxStore implements BookingAttemptOutboxStore {
  constructor(private readonly sql: Sql) {}

  async claimNext(now: Date, leaseUntil: Date): Promise<BookingAttemptOutboxItem | null> {
    const nowIso = now.toISOString();
    const leaseUntilIso = leaseUntil.toISOString();

    return this.sql.begin(async (tx) => {
      const rows = await tx<OutboxRow[]>`
        SELECT outbox_id, attempt_id, projection_payload, retry_count
        FROM booking_create_outbox
        WHERE (
          status = 'PENDING'
          AND (next_attempt_at IS NULL OR next_attempt_at <= ${nowIso}::timestamptz)
        ) OR (
          status = 'FAILED'
          AND next_attempt_at IS NOT NULL
          AND next_attempt_at <= ${nowIso}::timestamptz
        ) OR (
          status = 'PROCESSING'
          AND next_attempt_at IS NOT NULL
          AND next_attempt_at <= ${nowIso}::timestamptz
        )
        ORDER BY created_at ASC, outbox_id ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      `;

      const row = rows[0];
      if (!row) return null;

      await tx`
        UPDATE booking_create_outbox
        SET status = 'PROCESSING',
            next_attempt_at = ${leaseUntilIso}::timestamptz,
            last_error_code = NULL
        WHERE outbox_id = ${row.outbox_id}::uuid
      `;

      return {
        outboxId: row.outbox_id,
        attemptId: row.attempt_id,
        projectionPayload: row.projection_payload,
        retryCount: Number(row.retry_count),
      };
    });
  }

  async markSuccess(outboxId: string, processedAt: Date): Promise<void> {
    const rows = await this.sql<[{ outbox_id: string }]>`
      UPDATE booking_create_outbox
      SET status = 'SUCCESS',
          processed_at = ${processedAt.toISOString()}::timestamptz,
          next_attempt_at = NULL,
          last_error_code = NULL
      WHERE outbox_id = ${outboxId}::uuid
        AND status = 'PROCESSING'
      RETURNING outbox_id
    `;

    if (rows.length !== 1) {
      throw new Error('BOOKING_ATTEMPT_OUTBOX_SUCCESS_CARDINALITY_VIOLATION');
    }
  }

  async markFailure(
    outboxId: string,
    errorCode: string,
    nextAttemptAt: Date,
  ): Promise<void> {
    const rows = await this.sql<[{ outbox_id: string }]>`
      UPDATE booking_create_outbox
      SET status = 'FAILED',
          retry_count = retry_count + 1,
          last_error_code = ${errorCode},
          next_attempt_at = ${nextAttemptAt.toISOString()}::timestamptz,
          processed_at = NULL
      WHERE outbox_id = ${outboxId}::uuid
        AND status = 'PROCESSING'
      RETURNING outbox_id
    `;

    if (rows.length !== 1) {
      throw new Error('BOOKING_ATTEMPT_OUTBOX_FAILURE_CARDINALITY_VIOLATION');
    }
  }

  async markTerminalFailure(outboxId: string, errorCode: string): Promise<void> {
    const rows = await this.sql<[{ outbox_id: string }]>`
      UPDATE booking_create_outbox
      SET status = 'FAILED',
          retry_count = retry_count + 1,
          last_error_code = ${errorCode},
          next_attempt_at = NULL,
          processed_at = NULL
      WHERE outbox_id = ${outboxId}::uuid
        AND status = 'PROCESSING'
      RETURNING outbox_id
    `;

    if (rows.length !== 1) {
      throw new Error('BOOKING_ATTEMPT_OUTBOX_TERMINAL_CARDINALITY_VIOLATION');
    }
  }
}
