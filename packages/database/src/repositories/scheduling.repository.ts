import { eq, and, gte, lt, gt, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  locations,
  spaAreas,
  treatmentRooms,
  therapists,
  services,
  serviceRoomCompatibilities,
  serviceTherapistCompatibilities,
  operatingHours,
  therapistShifts,
  blockers,
  bookings,
  bookingHolds
} from '../schema/scheduling.js';
import { createHash } from 'crypto';

export function hashHoldToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function advisoryInt(value: string): number {
  return parseInt(createHash('md5').update(value).digest('hex').substring(0, 8), 16) | 0;
}

/**
 * Phase 4H: every canonical scheduling write must serialize on both physical
 * resources. Stable sorting prevents opposite lock order from creating a
 * deadlock when two requests target overlapping resource sets.
 */
export function getBookingResourceAdvisoryLocks(
  tenantId: string,
  roomId: string,
  therapistId: string,
): Array<readonly [number, number]> {
  const tenantKey = advisoryInt(`tenant:${tenantId}`);
  return [
    `room:${roomId}`,
    `therapist:${therapistId}`,
  ]
    .sort()
    .map((resource) => [tenantKey, advisoryInt(resource)] as const);
}

async function acquireBookingResourceLocks(
  tx: any,
  tenantId: string,
  roomId: string,
  therapistId: string,
): Promise<void> {
  for (const [tenantKey, resourceKey] of getBookingResourceAdvisoryLocks(tenantId, roomId, therapistId)) {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${tenantKey}, ${resourceKey})`);
  }
}

export interface HydratedBookingGuardContext {
  locations: any[];
  spa_areas: any[];
  rooms: any[];
  therapists: any[];
  services: any[];
  room_compatibilities: any[];
  therapist_compatibilities: any[];
  operating_hours: any[];
  shifts: any[];
  blockers: any[];
  bookings: any[];
  booking_holds: any[];
}

export class SchedulingRepository {
  constructor(private readonly db: NodePgDatabase<any>) {}

  async getBookingGuardContext(
    tenantId: string,
    targetDateIso: string,
  ): Promise<HydratedBookingGuardContext> {
    void targetDateIso;

    const [
      dbLocations,
      dbSpaAreas,
      dbRooms,
      dbTherapists,
      dbServices,
      dbRoomComps,
      dbTherapistComps,
      dbOperatingHours,
      dbShifts,
      dbBlockers,
      dbBookings,
      dbHolds
    ] = await Promise.all([
      this.db.select().from(locations).where(eq(locations.tenantId, tenantId)),
      this.db.select().from(spaAreas).where(eq(spaAreas.tenantId, tenantId)),
      this.db.select().from(treatmentRooms).where(eq(treatmentRooms.tenantId, tenantId)),
      this.db.select().from(therapists).where(eq(therapists.tenantId, tenantId)),
      this.db.select().from(services).where(eq(services.tenantId, tenantId)),
      this.db.select().from(serviceRoomCompatibilities).where(eq(serviceRoomCompatibilities.tenantId, tenantId)),
      this.db.select().from(serviceTherapistCompatibilities).where(eq(serviceTherapistCompatibilities.tenantId, tenantId)),
      this.db.select().from(operatingHours).where(eq(operatingHours.tenantId, tenantId)),
      this.db.select().from(therapistShifts).where(eq(therapistShifts.tenantId, tenantId)),
      this.db.select().from(blockers).where(eq(blockers.tenantId, tenantId)),
      this.db.select().from(bookings).where(eq(bookings.tenantId, tenantId)),
      this.db.select().from(bookingHolds).where(and(eq(bookingHolds.tenantId, tenantId), eq(bookingHolds.status, 'active')))
    ]);

    return {
      locations: dbLocations.map(l => ({ ...l, tenant_id: l.tenantId })),
      spa_areas: dbSpaAreas.map(sa => ({ ...sa, tenant_id: sa.tenantId, location_id: sa.locationId, default_slot_interval_minutes: sa.defaultSlotIntervalMinutes })),
      rooms: dbRooms.map(r => ({ ...r, tenant_id: r.tenantId, spa_area_id: r.spaAreaId, room_type: r.roomType, is_active: r.isActive })),
      therapists: dbTherapists.map(t => ({ ...t, tenant_id: t.tenantId, location_id: t.locationId, is_active: t.isActive })),
      services: dbServices.map(s => ({ ...s, tenant_id: s.tenantId, duration_minutes: s.durationMinutes, cleanup_minutes: s.cleanupMinutes, is_active: s.isActive })),
      room_compatibilities: dbRoomComps.map(c => ({ tenant_id: c.tenantId, service_id: c.serviceId, room_id: c.roomId })),
      therapist_compatibilities: dbTherapistComps.map(c => ({ tenant_id: c.tenantId, service_id: c.serviceId, therapist_id: c.therapistId })),
      operating_hours: dbOperatingHours.map(oh => ({
        id: oh.id, tenant_id: oh.tenantId, location_id: oh.locationId, day_of_week: oh.dayOfWeek,
        open_time: oh.openTime, close_time: oh.closeTime
      })),
      shifts: dbShifts.map(s => ({
        id: s.id, tenant_id: s.tenantId, therapist_id: s.therapistId, location_id: s.locationId,
        starts_at: s.startsAt.toISOString(), ends_at: s.endsAt.toISOString(), recurrence_rule: s.recurrenceRule
      })),
      blockers: dbBlockers.map(b => ({
        id: b.id, tenant_id: b.tenantId, room_id: b.roomId, therapist_id: b.therapistId,
        starts_at: b.startsAt.toISOString(), ends_at: b.endsAt.toISOString(), reason: b.reason
      })),
      bookings: dbBookings.map(b => ({
        id: b.id, tenant_id: b.tenantId, service_id: b.serviceId, room_id: b.roomId, therapist_id: b.therapistId,
        service_start_time: b.serviceStartTime.toISOString(), service_end_time: b.serviceEndTime.toISOString(), cleanup_end_time: b.cleanupEndTime.toISOString(),
        booking_source: b.bookingSource, booking_status: b.bookingStatus, customer_info: b.customerInfo, notes: b.notes
      })),
      booking_holds: dbHolds.map(h => ({
        id: h.id, tenant_id: h.tenantId, service_id: h.serviceId, room_id: h.roomId, therapist_id: h.therapistId,
        service_start_time: h.serviceStartTime.toISOString(), service_end_time: h.serviceEndTime.toISOString(), cleanup_end_time: h.cleanupEndTime.toISOString(),
        status: h.status, expires_at: h.expiresAt.toISOString()
      }))
    };
  }

  async findActiveConflictingHolds(
    tenantId: string,
    roomId: string,
    therapistId: string,
    startTime: Date,
    endTime: Date,
    cleanupTime: Date
  ) {
    const now = new Date();
    return this.db.select().from(bookingHolds).where(
      and(
        eq(bookingHolds.tenantId, tenantId),
        eq(bookingHolds.status, 'active'),
        gte(bookingHolds.expiresAt, now),
        or(
          and(
            eq(bookingHolds.roomId, roomId),
            lt(bookingHolds.serviceStartTime, cleanupTime),
            gt(bookingHolds.cleanupEndTime, startTime)
          ),
          and(
            eq(bookingHolds.therapistId, therapistId),
            lt(bookingHolds.serviceStartTime, endTime),
            gt(bookingHolds.serviceEndTime, startTime)
          )
        )
      )
    );
  }

  async createHold(holdData: typeof bookingHolds.$inferInsert) {
    return this.db.insert(bookingHolds).values(holdData).returning();
  }

  async createPersistentHoldTransaction(
    tenantId: string,
    roomId: string,
    therapistId: string,
    proposed: any,
    evaluateFn: (proposed: any, ctx: HydratedBookingGuardContext) => any,
    holdDataFn: (tokenHash: string) => typeof bookingHolds.$inferInsert,
    rawToken: string
  ) {
    return this.db.transaction(async (tx: any) => {
      const txRepo = new SchedulingRepository(tx);

      await acquireBookingResourceLocks(tx, tenantId, roomId, therapistId);

      const ctx = await txRepo.getBookingGuardContext(tenantId, proposed.service_start_time);
      const validationResult = evaluateFn(proposed, ctx);
      if (!validationResult.allowed) {
        return { success: false, conflictCode: validationResult.conflictCode, validationResult };
      }

      const startTime = new Date(proposed.service_start_time);
      const endTime = new Date(proposed.service_end_time);
      const cleanupTime = new Date(proposed.cleanup_end_time);
      const conflictingHolds = await txRepo.findActiveConflictingHolds(
        tenantId, roomId, therapistId, startTime, endTime, cleanupTime
      );

      if (conflictingHolds.length > 0) {
        return {
          success: false,
          conflictCode: 'BOOKING_RESOURCE_CONFLICT',
          validationResult: {
            ...validationResult,
            allowed: false,
            conflictCode: 'BOOKING_RESOURCE_CONFLICT',
            reason: 'Resource is currently held by another request',
            severity: 'critical'
          }
        };
      }

      const tokenHash = hashHoldToken(rawToken);
      const holdToInsert = holdDataFn(tokenHash);
      const inserted = await txRepo.createHold(holdToInsert);

      return {
        success: true,
        hold: inserted[0],
        validationResult
      };
    });
  }

  /**
   * Phase 4H transactional writer primitive. The same room+therapist advisory
   * locks are held across context re-read, guard evaluation, hold check and
   * INSERT, so a second concurrent request cannot pass a stale occupancy scan.
   */
  async createBookingTransaction(
    tenantId: string,
    roomId: string,
    therapistId: string,
    proposed: any,
    evaluateFn: (proposed: any, ctx: HydratedBookingGuardContext) => any,
    bookingData: typeof bookings.$inferInsert,
  ) {
    return this.db.transaction(async (tx: any) => {
      const txRepo = new SchedulingRepository(tx);

      await acquireBookingResourceLocks(tx, tenantId, roomId, therapistId);

      const ctx = await txRepo.getBookingGuardContext(tenantId, proposed.service_start_time);
      const validationResult = evaluateFn(proposed, ctx);
      if (!validationResult.allowed) {
        return { success: false, conflictCode: validationResult.conflictCode, validationResult };
      }

      const conflictingHolds = await txRepo.findActiveConflictingHolds(
        tenantId,
        roomId,
        therapistId,
        new Date(proposed.service_start_time),
        new Date(proposed.service_end_time),
        new Date(proposed.cleanup_end_time),
      );
      if (conflictingHolds.length > 0) {
        return {
          success: false,
          conflictCode: 'BOOKING_RESOURCE_CONFLICT',
          validationResult: {
            ...validationResult,
            allowed: false,
            conflictCode: 'BOOKING_RESOURCE_CONFLICT',
            reason: 'Resource is currently held by another request',
            severity: 'critical'
          }
        };
      }

      const inserted = await tx.insert(bookings).values(bookingData).returning();
      return { success: true, booking: inserted[0], validationResult };
    });
  }

  async findHoldByTokenHash(tenantId: string, tokenHash: string) {
    const result = await this.db.select().from(bookingHolds).where(
      and(
        eq(bookingHolds.tenantId, tenantId),
        eq(bookingHolds.holdTokenHash, tokenHash)
      )
    ).limit(1);
    return result[0] || null;
  }

  async releaseHold(tenantId: string, holdId: string) {
    return this.db.update(bookingHolds)
      .set({ status: 'released', updatedAt: new Date() })
      .where(
        and(
          eq(bookingHolds.tenantId, tenantId),
          eq(bookingHolds.id, holdId)
        )
      )
      .returning();
  }
}
