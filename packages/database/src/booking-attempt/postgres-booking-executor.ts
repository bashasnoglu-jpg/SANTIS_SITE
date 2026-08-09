import type { Sql } from 'postgres';

import type {
  AttemptClaim,
  BookingExecutionResult,
} from './contracts.js';
import type { BookingBusinessExecutor } from './service.js';

export interface CanonicalBookingCreateInput {
  tenantId: string;
  serviceId: string;
  roomId: string;
  therapistId: string;
  serviceStartTime: Date;
  serviceEndTime: Date;
  cleanupEndTime: Date;
  bookingSource:
    | 'manual'
    | 'online'
    | 'hotel_front_desk'
    | 'concierge'
    | 'phone'
    | 'walk_in';
  bookingStatus:
    | 'draft'
    | 'confirmed'
    | 'checked_in'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'no_show';
  customerInfo?: Record<string, unknown>;
  notes?: string;
}

function postgresReasonCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' && code.length > 0) {
      return `POSTGRES_${code}`;
    }
  }
  return 'CANONICAL_BOOKING_WRITE_FAILED';
}

/**
 * Canonical PostgreSQL booking writer boundary for BOOKING-CREATE-ATTEMPT-1.0.
 * It does not know about Airtable and never writes evidence projections directly.
 */
export class PostgresCanonicalBookingExecutor
  implements BookingBusinessExecutor<CanonicalBookingCreateInput>
{
  constructor(private readonly sql: Sql) {}

  async execute(
    _claim: AttemptClaim,
    businessData: CanonicalBookingCreateInput,
  ): Promise<BookingExecutionResult> {
    try {
      const rows = await this.sql<[{ id: string }]>`
        INSERT INTO bookings (
          tenant_id,
          service_id,
          room_id,
          therapist_id,
          service_start_time,
          service_end_time,
          cleanup_end_time,
          booking_source,
          booking_status,
          customer_info,
          notes
        ) VALUES (
          ${businessData.tenantId}::uuid,
          ${businessData.serviceId}::uuid,
          ${businessData.roomId}::uuid,
          ${businessData.therapistId}::uuid,
          ${businessData.serviceStartTime},
          ${businessData.serviceEndTime},
          ${businessData.cleanupEndTime},
          ${businessData.bookingSource}::booking_source,
          ${businessData.bookingStatus}::booking_status,
          ${JSON.stringify(businessData.customerInfo ?? {})}::jsonb,
          ${businessData.notes ?? null}
        )
        RETURNING id
      `;

      const row = rows[0];
      if (!row) {
        return { status: 'FAILURE', reasonCode: 'CANONICAL_BOOKING_INSERT_RETURNED_NO_ROW' };
      }

      return { status: 'SUCCESS', canonicalBookingId: row.id };
    } catch (error) {
      return { status: 'FAILURE', reasonCode: postgresReasonCode(error) };
    }
  }
}
