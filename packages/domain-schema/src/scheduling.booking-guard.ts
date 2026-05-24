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
} from "./scheduling.contract.js";

export type ConflictCode =
  | 'TENANT_SCOPE_VIOLATION'
  | 'SERVICE_NOT_FOUND'
  | 'ROOM_NOT_COMPATIBLE'
  | 'THERAPIST_NOT_COMPATIBLE'
  | 'OUTSIDE_OPERATING_HOURS'
  | 'THERAPIST_OUTSIDE_SHIFT'
  | 'ROOM_BLOCKED'
  | 'THERAPIST_BLOCKED'
  | 'ROOM_BOOKING_CONFLICT'
  | 'THERAPIST_BOOKING_CONFLICT'
  | 'INVALID_TIME_RANGE';

export interface BookingGuardResult {
  allowed: boolean;
  conflict_code?: ConflictCode;
  conflict_reason?: string;
  conflicting_resource_type?: 'room' | 'therapist' | 'service' | 'tenant' | 'time';
  conflicting_resource_id?: string;
}

export interface ProposedBooking {
  tenant_id: string;
  service_id: string;
  room_id: string;
  therapist_id: string;
  service_start_time: string; // ISO 8601
  service_end_time: string;   // ISO 8601
  cleanup_end_time: string;   // ISO 8601
}

export interface BookingGuardContext {
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

export function evaluateBooking(proposed: ProposedBooking, ctx: BookingGuardContext): BookingGuardResult {
  // 1. Time range validation
  let startMs: number, endMs: number, cleanupMs: number;
  try {
    startMs = parseTimeSafe(proposed.service_start_time);
    endMs = parseTimeSafe(proposed.service_end_time);
    cleanupMs = parseTimeSafe(proposed.cleanup_end_time);
  } catch (e) {
    return { allowed: false, conflict_code: 'INVALID_TIME_RANGE', conflict_reason: 'Invalid timestamp format', conflicting_resource_type: 'time' };
  }

  if (startMs >= endMs || endMs > cleanupMs) {
    return { allowed: false, conflict_code: 'INVALID_TIME_RANGE', conflict_reason: 'Start time must be before end time, and cleanup must be >= end time', conflicting_resource_type: 'time' };
  }

  // 2. Tenant scope and basic existence
  const service = ctx.services.find(s => s.id === proposed.service_id && s.tenant_id === proposed.tenant_id && s.is_active);
  if (!service) {
    return { allowed: false, conflict_code: 'SERVICE_NOT_FOUND', conflict_reason: 'Service not found or inactive', conflicting_resource_type: 'service', conflicting_resource_id: proposed.service_id };
  }

  const room = ctx.rooms.find(r => r.id === proposed.room_id && r.tenant_id === proposed.tenant_id && r.is_active);
  if (!room) {
    return { allowed: false, conflict_code: 'TENANT_SCOPE_VIOLATION', conflict_reason: 'Room not found in tenant scope', conflicting_resource_type: 'room', conflicting_resource_id: proposed.room_id };
  }

  const therapist = ctx.therapists.find(t => t.id === proposed.therapist_id && t.tenant_id === proposed.tenant_id && t.is_active);
  if (!therapist) {
    return { allowed: false, conflict_code: 'TENANT_SCOPE_VIOLATION', conflict_reason: 'Therapist not found in tenant scope', conflicting_resource_type: 'therapist', conflicting_resource_id: proposed.therapist_id };
  }

  // 3. Compatibilities
  const roomComp = ctx.room_compatibilities.find(c => c.tenant_id === proposed.tenant_id && c.service_id === service.id && c.room_id === room.id);
  if (!roomComp) {
    return { allowed: false, conflict_code: 'ROOM_NOT_COMPATIBLE', conflict_reason: 'Room cannot provide this service', conflicting_resource_type: 'room', conflicting_resource_id: room.id };
  }

  const therapistComp = ctx.therapist_compatibilities.find(c => c.tenant_id === proposed.tenant_id && c.service_id === service.id && c.therapist_id === therapist.id);
  if (!therapistComp) {
    return { allowed: false, conflict_code: 'THERAPIST_NOT_COMPATIBLE', conflict_reason: 'Therapist cannot provide this service', conflicting_resource_type: 'therapist', conflicting_resource_id: therapist.id };
  }

  // 4. Operating Hours
  const spaArea = ctx.spa_areas.find(sa => sa.id === room.spa_area_id);
  if (!spaArea) throw new Error("Spa area not found for room");
  const location = ctx.locations.find(l => l.id === spaArea.location_id);
  if (!location) throw new Error("Location not found for spa area");

  const targetDateObj = new Date(proposed.service_start_time);
  const dayOfWeek = targetDateObj.getUTCDay(); // Assuming UTC day matches local day for K-6 simple logic
  const dateStr = proposed.service_start_time.split('T')[0];

  const hours = ctx.operating_hours.find(oh => oh.tenant_id === proposed.tenant_id && oh.location_id === location.id && oh.day_of_week === dayOfWeek);
  if (!hours) {
    return { allowed: false, conflict_code: 'OUTSIDE_OPERATING_HOURS', conflict_reason: 'Location closed on this day', conflicting_resource_type: 'time' };
  }

  const openTimeMs = parseTimeSafe(`${dateStr}T${hours.open_time}Z`);
  const closeTimeMs = parseTimeSafe(`${dateStr}T${hours.close_time}Z`);
  
  if (startMs < openTimeMs || cleanupMs > closeTimeMs) {
    return { allowed: false, conflict_code: 'OUTSIDE_OPERATING_HOURS', conflict_reason: 'Booking falls outside operating hours', conflicting_resource_type: 'time' };
  }

  // 5. Therapist Shift
  const shift = ctx.shifts.find(s => 
    s.tenant_id === proposed.tenant_id && 
    s.therapist_id === therapist.id &&
    parseTimeSafe(s.starts_at) <= startMs &&
    parseTimeSafe(s.ends_at) >= endMs // Shift only needs to cover service time, not cleanup
  );
  if (!shift) {
    return { allowed: false, conflict_code: 'THERAPIST_OUTSIDE_SHIFT', conflict_reason: 'Therapist is not on shift', conflicting_resource_type: 'therapist', conflicting_resource_id: therapist.id };
  }

  // 6. Blockers
  const activeBlockers = ctx.blockers.filter(b => b.tenant_id === proposed.tenant_id);
  
  const roomBlocked = activeBlockers.some(b => b.room_id === room.id && intervalsOverlap(startMs, cleanupMs, parseTimeSafe(b.starts_at), parseTimeSafe(b.ends_at)));
  if (roomBlocked) {
    return { allowed: false, conflict_code: 'ROOM_BLOCKED', conflict_reason: 'Room is blocked', conflicting_resource_type: 'room', conflicting_resource_id: room.id };
  }

  const therapistBlocked = activeBlockers.some(b => b.therapist_id === therapist.id && intervalsOverlap(startMs, endMs, parseTimeSafe(b.starts_at), parseTimeSafe(b.ends_at)));
  if (therapistBlocked) {
    return { allowed: false, conflict_code: 'THERAPIST_BLOCKED', conflict_reason: 'Therapist is blocked', conflicting_resource_type: 'therapist', conflicting_resource_id: therapist.id };
  }

  // 7. Active Bookings Overlap
  const activeBookings = ctx.bookings.filter(b => 
    b.tenant_id === proposed.tenant_id && 
    // Ignore cancelled, completed, no_show
    (b.booking_status === "confirmed" || b.booking_status === "in_progress" || b.booking_status === "checked_in")
  );

  const roomBooked = activeBookings.some(b => b.room_id === room.id && intervalsOverlap(startMs, cleanupMs, parseTimeSafe(b.service_start_time), parseTimeSafe(b.cleanup_end_time)));
  if (roomBooked) {
    return { allowed: false, conflict_code: 'ROOM_BOOKING_CONFLICT', conflict_reason: 'Room is already booked', conflicting_resource_type: 'room', conflicting_resource_id: room.id };
  }

  const therapistBooked = activeBookings.some(b => b.therapist_id === therapist.id && intervalsOverlap(startMs, endMs, parseTimeSafe(b.service_start_time), parseTimeSafe(b.service_end_time)));
  if (therapistBooked) {
    return { allowed: false, conflict_code: 'THERAPIST_BOOKING_CONFLICT', conflict_reason: 'Therapist is already booked', conflicting_resource_type: 'therapist', conflicting_resource_id: therapist.id };
  }

  // Allowed
  return { allowed: true };
}
