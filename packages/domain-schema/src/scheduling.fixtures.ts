import {
  Location,
  SpaArea,
  TreatmentRoom,
  Therapist,
  Service,
  ServiceRoomCompatibilitySchema,
  ServiceTherapistCompatibilitySchema,
  OperatingHours,
  TherapistShift,
  Blocker,
  Booking
} from "./scheduling.contract";

// --- TENANT ID ---
export const MOCK_TENANT_ID = "00000000-0000-0000-0000-000000000001";

// --- LOCATION & SPA AREA ---
export const MOCK_LOCATION: Location = {
  id: "loc-001",
  tenant_id: MOCK_TENANT_ID,
  name: "Santis Grand Hotel",
  timezone: "Europe/Istanbul",
};

export const MOCK_SPA_AREA: SpaArea = {
  id: "spa-001",
  tenant_id: MOCK_TENANT_ID,
  location_id: MOCK_LOCATION.id,
  name: "Santis Core Spa",
  default_slot_interval_minutes: 15,
};

// --- ROOMS (3) ---
export const MOCK_ROOMS: TreatmentRoom[] = [
  { id: "room-01", tenant_id: MOCK_TENANT_ID, spa_area_id: MOCK_SPA_AREA.id, name: "Massage 1", room_type: "massage", capacity: 1, is_active: true },
  { id: "room-02", tenant_id: MOCK_TENANT_ID, spa_area_id: MOCK_SPA_AREA.id, name: "VIP Suite", room_type: "vip_suite", capacity: 2, is_active: true },
  { id: "room-03", tenant_id: MOCK_TENANT_ID, spa_area_id: MOCK_SPA_AREA.id, name: "Traditional Hammam", room_type: "hammam", capacity: 1, is_active: true },
];

// --- THERAPISTS (3) ---
export const MOCK_THERAPISTS: Therapist[] = [
  { id: "therapist-01", tenant_id: MOCK_TENANT_ID, location_id: MOCK_LOCATION.id, name: "Aria", is_active: true },
  { id: "therapist-02", tenant_id: MOCK_TENANT_ID, location_id: MOCK_LOCATION.id, name: "Kael", is_active: true },
  { id: "therapist-03", tenant_id: MOCK_TENANT_ID, location_id: MOCK_LOCATION.id, name: "Elena", is_active: true },
];

// --- SERVICES (5) ---
export const MOCK_SERVICES: Service[] = [
  { id: "srv-01", tenant_id: MOCK_TENANT_ID, name: "Deep Tissue Massage", duration_minutes: 60, cleanup_minutes: 15, is_active: true },
  { id: "srv-02", tenant_id: MOCK_TENANT_ID, name: "Swedish Massage", duration_minutes: 60, cleanup_minutes: 15, is_active: true },
  { id: "srv-03", tenant_id: MOCK_TENANT_ID, name: "Hammam Ritual", duration_minutes: 45, cleanup_minutes: 20, is_active: true },
  { id: "srv-04", tenant_id: MOCK_TENANT_ID, name: "Couples Massage", duration_minutes: 90, cleanup_minutes: 20, is_active: true },
  { id: "srv-05", tenant_id: MOCK_TENANT_ID, name: "Express Facial", duration_minutes: 30, cleanup_minutes: 10, is_active: true },
];

// --- COMPATIBILITIES ---
export const MOCK_SERVICE_ROOM_COMPATIBILITIES = [
  { tenant_id: MOCK_TENANT_ID, service_id: "srv-01", room_id: "room-01" },
  { tenant_id: MOCK_TENANT_ID, service_id: "srv-01", room_id: "room-02" },
  { tenant_id: MOCK_TENANT_ID, service_id: "srv-03", room_id: "room-03" }, // Hammam ritual only in hammam room
  { tenant_id: MOCK_TENANT_ID, service_id: "srv-04", room_id: "room-02" }, // Couples only in VIP suite
];

export const MOCK_SERVICE_THERAPIST_COMPATIBILITIES = [
  { tenant_id: MOCK_TENANT_ID, service_id: "srv-01", therapist_id: "therapist-01" },
  { tenant_id: MOCK_TENANT_ID, service_id: "srv-03", therapist_id: "therapist-02" }, // Kael does Hammam
];

// --- OPERATING HOURS ---
export const MOCK_OPERATING_HOURS: OperatingHours[] = [
  { id: "oh-1", tenant_id: MOCK_TENANT_ID, location_id: MOCK_LOCATION.id, day_of_week: 1, open_time: "09:00", close_time: "21:00" }, // Monday
  { id: "oh-2", tenant_id: MOCK_TENANT_ID, location_id: MOCK_LOCATION.id, day_of_week: 2, open_time: "09:00", close_time: "21:00" }, // Tuesday
];

// --- THERAPIST SHIFTS ---
export const MOCK_SHIFTS: TherapistShift[] = [
  { id: "shift-01", tenant_id: MOCK_TENANT_ID, therapist_id: "therapist-01", location_id: MOCK_LOCATION.id, starts_at: "2026-06-01T09:00:00Z", ends_at: "2026-06-01T17:00:00Z", recurrence_rule: null },
];

// --- BLOCKERS ---
export const MOCK_BLOCKERS: Blocker[] = [
  { id: "block-01", tenant_id: MOCK_TENANT_ID, room_id: null, therapist_id: "therapist-01", starts_at: "2026-06-01T12:00:00Z", ends_at: "2026-06-01T13:00:00Z", reason: "Lunch break" },
  { id: "block-02", tenant_id: MOCK_TENANT_ID, room_id: "room-01", therapist_id: null, starts_at: "2026-06-02T09:00:00Z", ends_at: "2026-06-02T12:00:00Z", reason: "Deep cleaning" },
];

// --- BOOKINGS ---
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "book-01",
    tenant_id: MOCK_TENANT_ID,
    service_id: "srv-01",
    room_id: "room-01",
    therapist_id: "therapist-01",
    service_start_time: "2026-06-01T10:00:00Z",
    service_end_time: "2026-06-01T11:00:00Z",
    cleanup_end_time: "2026-06-01T11:15:00Z",
    booking_source: "online",
    booking_status: "confirmed",
    customer_info: { name: "John Doe" },
    notes: "First time guest",
  }
];
