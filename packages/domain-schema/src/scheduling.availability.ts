import {
  Location,
  SpaArea,
  TreatmentRoom,
  Therapist,
  Service,
  ServiceRoomCompatibility,
  ServiceTherapistCompatibility,
  OperatingHours,
  TherapistShift,
  Blocker,
  Booking
} from "./scheduling.contract";
import { AvailabilitySlot } from "./scheduling.api";

export interface AvailabilityEngineContext {
  tenant_id: string;
  target_date: string; // YYYY-MM-DD
  service_id: string;
  spa_area_id: string;
  locations: Location[];
  spa_areas: SpaArea[];
  rooms: TreatmentRoom[];
  therapists: Therapist[];
  services: Service[];
  room_compatibilities: ServiceRoomCompatibility[];
  therapist_compatibilities: ServiceTherapistCompatibility[];
  operating_hours: OperatingHours[];
  shifts: TherapistShift[];
  blockers: Blocker[];
  bookings: Booking[];
}

// Overlap logic using half-open interval: [start, end)
// aStart < bEnd && aEnd > bStart
function intervalsOverlap(aStartMs: number, aEndMs: number, bStartMs: number, bEndMs: number): boolean {
  if (!Number.isFinite(aStartMs) || !Number.isFinite(aEndMs) || !Number.isFinite(bStartMs) || !Number.isFinite(bEndMs)) {
    throw new Error("Invalid timestamp encountered during overlap check");
  }
  return aStartMs < bEndMs && aEndMs > bStartMs;
}

function parseTimeSafe(isoString: string): number {
  const ms = Date.parse(isoString);
  if (!Number.isFinite(ms)) {
    throw new Error(`Invalid ISO timestamp: ${isoString}`);
  }
  return ms;
}

export function calculateAvailability(ctx: AvailabilityEngineContext): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];

  // 1. Basic lookups
  const service = ctx.services.find(s => s.id === ctx.service_id && s.tenant_id === ctx.tenant_id && s.is_active);
  const spaArea = ctx.spa_areas.find(sa => sa.id === ctx.spa_area_id && sa.tenant_id === ctx.tenant_id);
  
  if (!service || !spaArea) {
    return slots; // Invalid service or spa area, no availability
  }

  const location = ctx.locations.find(l => l.id === spaArea.location_id && l.tenant_id === ctx.tenant_id);
  if (!location) return slots;

  // 2. Filter compatibilities (Tenant isolated)
  const validRoomIds = new Set(
    ctx.room_compatibilities
      .filter(c => c.tenant_id === ctx.tenant_id && c.service_id === service.id)
      .map(c => c.room_id)
  );
  
  const validTherapistIds = new Set(
    ctx.therapist_compatibilities
      .filter(c => c.tenant_id === ctx.tenant_id && c.service_id === service.id)
      .map(c => c.therapist_id)
  );

  const availableRooms = ctx.rooms.filter(r => 
    r.tenant_id === ctx.tenant_id && 
    r.spa_area_id === spaArea.id && 
    r.is_active && 
    validRoomIds.has(r.id)
  );

  const availableTherapists = ctx.therapists.filter(t => 
    t.tenant_id === ctx.tenant_id && 
    t.location_id === location.id &&
    t.is_active && 
    validTherapistIds.has(t.id)
  );

  if (availableRooms.length === 0 || availableTherapists.length === 0) {
    return slots;
  }

  // 3. Operating hours for target_date
  // Assume simple JS Date parsed UTC for day of week for K-3 pure mode
  const targetDateObj = new Date(`${ctx.target_date}T00:00:00Z`);
  const dayOfWeek = targetDateObj.getUTCDay(); // 0 = Sunday
  
  const hours = ctx.operating_hours.find(oh => 
    oh.tenant_id === ctx.tenant_id && 
    oh.location_id === location.id && 
    oh.day_of_week === dayOfWeek
  );

  if (!hours) return slots; // Closed on this day

  // Quantization and Slot Generation
  // Build epoch ms bounds for the operating day
  const openTimeMs = Date.parse(`${ctx.target_date}T${hours.open_time}:00Z`);
  const closeTimeMs = Date.parse(`${ctx.target_date}T${hours.close_time}:00Z`);
  
  if (!Number.isFinite(openTimeMs) || !Number.isFinite(closeTimeMs)) return slots;

  const intervalMs = spaArea.default_slot_interval_minutes * 60 * 1000;
  const durationMs = service.duration_minutes * 60 * 1000;
  const cleanupMs = service.cleanup_minutes * 60 * 1000;

  // Filter bookings (tenant, active states only)
  const activeBookings = ctx.bookings.filter(b => 
    b.tenant_id === ctx.tenant_id && 
    (b.booking_status === "confirmed" || b.booking_status === "in_progress" || b.booking_status === "checked_in")
  );
  
  const activeBlockers = ctx.blockers.filter(b => b.tenant_id === ctx.tenant_id);
  const activeShifts = ctx.shifts.filter(s => s.tenant_id === ctx.tenant_id);

  for (let slotStartMs = openTimeMs; slotStartMs < closeTimeMs; slotStartMs += intervalMs) {
    const serviceEndMs = slotStartMs + durationMs;
    const cleanupEndMs = serviceEndMs + cleanupMs;

    // Must fit within operating hours
    if (cleanupEndMs > closeTimeMs) {
      continue;
    }

    let foundPair = false;

    for (const room of availableRooms) {
      if (foundPair) break;

      // Check room blockers and bookings
      const roomBlocked = activeBlockers.some(b => 
        b.room_id === room.id && 
        intervalsOverlap(slotStartMs, cleanupEndMs, parseTimeSafe(b.starts_at), parseTimeSafe(b.ends_at))
      );
      if (roomBlocked) continue;

      const roomBooked = activeBookings.some(b => 
        b.room_id === room.id && 
        intervalsOverlap(slotStartMs, cleanupEndMs, parseTimeSafe(b.service_start_time), parseTimeSafe(b.cleanup_end_time))
      );
      if (roomBooked) continue;

      for (const therapist of availableTherapists) {
        // Therapist shift must COVER the full service (cleanup not strictly requiring therapist)
        const therapistOnShift = activeShifts.some(s => 
          s.therapist_id === therapist.id &&
          parseTimeSafe(s.starts_at) <= slotStartMs &&
          parseTimeSafe(s.ends_at) >= serviceEndMs
        );
        if (!therapistOnShift) continue;

        // Check therapist blockers and bookings
        const therapistBlocked = activeBlockers.some(b => 
          b.therapist_id === therapist.id && 
          intervalsOverlap(slotStartMs, serviceEndMs, parseTimeSafe(b.starts_at), parseTimeSafe(b.ends_at))
        );
        if (therapistBlocked) continue;

        const therapistBooked = activeBookings.some(b => 
          b.therapist_id === therapist.id && 
          intervalsOverlap(slotStartMs, serviceEndMs, parseTimeSafe(b.service_start_time), parseTimeSafe(b.service_end_time)) // Assuming therapist is free during cleanup
        );
        if (therapistBooked) continue;

        // Found valid pairing
        slots.push({
          slot_start: new Date(slotStartMs).toISOString(),
          slot_end: new Date(serviceEndMs).toISOString(),
          service_end_time: new Date(serviceEndMs).toISOString(),
          cleanup_end_time: new Date(cleanupEndMs).toISOString(),
          room_id: room.id,
          therapist_id: therapist.id,
          confidence: 100,
          reason: null,
          is_advisory: true
        });

        foundPair = true;
        break;
      }
    }
  }

  return slots;
}
