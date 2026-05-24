import { eq, and, gte, lte, or } from 'drizzle-orm';
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
  bookings 
} from '../schema/scheduling.js';

// Define the shape that BookingGuardContext expects
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
}

export class SchedulingRepository {
  constructor(private readonly db: NodePgDatabase<any>) {}

  async getBookingGuardContext(
    tenantId: string,
    targetDateIso: string, // Not strictly filtering by date yet to match full hydrate, but could in future
  ): Promise<HydratedBookingGuardContext> {
    
    // Read-only operations to hydrate the context
    const dbLocations = await this.db.select().from(locations).where(eq(locations.tenantId, tenantId));
    const dbSpaAreas = await this.db.select().from(spaAreas).where(eq(spaAreas.tenantId, tenantId));
    const dbRooms = await this.db.select().from(treatmentRooms).where(eq(treatmentRooms.tenantId, tenantId));
    const dbTherapists = await this.db.select().from(therapists).where(eq(therapists.tenantId, tenantId));
    const dbServices = await this.db.select().from(services).where(eq(services.tenantId, tenantId));
    
    const dbRoomComps = await this.db.select()
      .from(serviceRoomCompatibilities)
      .where(eq(serviceRoomCompatibilities.tenantId, tenantId));
      
    const dbTherapistComps = await this.db.select()
      .from(serviceTherapistCompatibilities)
      .where(eq(serviceTherapistCompatibilities.tenantId, tenantId));

    const dbOperatingHours = await this.db.select()
      .from(operatingHours)
      .where(eq(operatingHours.tenantId, tenantId));

    const dbShifts = await this.db.select()
      .from(therapistShifts)
      .where(eq(therapistShifts.tenantId, tenantId));

    const dbBlockers = await this.db.select()
      .from(blockers)
      .where(eq(blockers.tenantId, tenantId));

    const dbBookings = await this.db.select()
      .from(bookings)
      .where(eq(bookings.tenantId, tenantId));

    // Map DB rows to Domain schema structure (snakes case and stringifying dates)
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
      }))
    };
  }
}
