import {
  Location,
  SpaArea,
  TreatmentRoom,
  Therapist,
  Service,
  OperatingHours,
  TherapistShift,
  Blocker,
  Booking
} from "./scheduling.contract";

// --- TENANT ID ---
export const MOCK_TENANT_ID = "00000000-0000-0000-0000-000000000001";

// --- LOCATION & SPA AREA ---
export const MOCK_LOCATION: Location = {
  id: "11111111-1111-1111-1111-111111111111",
  tenant_id: MOCK_TENANT_ID,
  name: "Santis Grand Hotel",
  timezone: "Europe/Istanbul",
};

export const MOCK_SPA_AREA: SpaArea = {
  id: "22222222-2222-2222-2222-222222222222",
  tenant_id: MOCK_TENANT_ID,
  location_id: MOCK_LOCATION.id,
  name: "Santis Core Spa",
  default_slot_interval_minutes: 15,
};

// --- ROOMS (3) ---
export const MOCK_ROOMS: TreatmentRoom[] = [
  { id: "33333333-3333-3333-3333-333333333331", tenant_id: MOCK_TENANT_ID, spa_area_id: MOCK_SPA_AREA.id, name: "Massage 1", room_type: "massage", capacity: 1, is_active: true },
  { id: "33333333-3333-3333-3333-333333333332", tenant_id: MOCK_TENANT_ID, spa_area_id: MOCK_SPA_AREA.id, name: "VIP Suite", room_type: "vip_suite", capacity: 2, is_active: true },
  { id: "33333333-3333-3333-3333-333333333333", tenant_id: MOCK_TENANT_ID, spa_area_id: MOCK_SPA_AREA.id, name: "Traditional Hammam", room_type: "hammam", capacity: 1, is_active: true },
];

// --- THERAPISTS (3) ---
export const MOCK_THERAPISTS: Therapist[] = [
  { id: "44444444-4444-4444-4444-444444444441", tenant_id: MOCK_TENANT_ID, location_id: MOCK_LOCATION.id, name: "Aria", is_active: true },
  { id: "44444444-4444-4444-4444-444444444442", tenant_id: MOCK_TENANT_ID, location_id: MOCK_LOCATION.id, name: "Kael", is_active: true },
  { id: "44444444-4444-4444-4444-444444444443", tenant_id: MOCK_TENANT_ID, location_id: MOCK_LOCATION.id, name: "Elena", is_active: true },
];

// --- SERVICES (5) ---
export const MOCK_SERVICES: Service[] = [
  { id: "55555555-5555-5555-5555-555555555551", tenant_id: MOCK_TENANT_ID, name: "Deep Tissue Massage", duration_minutes: 60, cleanup_minutes: 15, is_active: true },
  { id: "55555555-5555-5555-5555-555555555552", tenant_id: MOCK_TENANT_ID, name: "Swedish Massage", duration_minutes: 60, cleanup_minutes: 15, is_active: true },
  { id: "55555555-5555-5555-5555-555555555553", tenant_id: MOCK_TENANT_ID, name: "Hammam Ritual", duration_minutes: 45, cleanup_minutes: 20, is_active: true },
  { id: "55555555-5555-5555-5555-555555555554", tenant_id: MOCK_TENANT_ID, name: "Couples Massage", duration_minutes: 90, cleanup_minutes: 20, is_active: true },
  { id: "55555555-5555-5555-5555-555555555555", tenant_id: MOCK_TENANT_ID, name: "Express Facial", duration_minutes: 30, cleanup_minutes: 10, is_active: true },
];

// --- COMPATIBILITIES ---
export const MOCK_SERVICE_ROOM_COMPATIBILITIES = [
  { tenant_id: MOCK_TENANT_ID, service_id: "55555555-5555-5555-5555-555555555551", room_id: "33333333-3333-3333-3333-333333333331" },
  { tenant_id: MOCK_TENANT_ID, service_id: "55555555-5555-5555-5555-555555555551", room_id: "33333333-3333-3333-3333-333333333332" },
  { tenant_id: MOCK_TENANT_ID, service_id: "55555555-5555-5555-5555-555555555553", room_id: "33333333-3333-3333-3333-333333333333" }, // Hammam ritual only in hammam room
  { tenant_id: MOCK_TENANT_ID, service_id: "55555555-5555-5555-5555-555555555554", room_id: "33333333-3333-3333-3333-333333333332" }, // Couples only in VIP suite
];

export const MOCK_SERVICE_THERAPIST_COMPATIBILITIES = [
  { tenant_id: MOCK_TENANT_ID, service_id: "55555555-5555-5555-5555-555555555551", therapist_id: "44444444-4444-4444-4444-444444444441" },
  { tenant_id: MOCK_TENANT_ID, service_id: "55555555-5555-5555-5555-555555555553", therapist_id: "44444444-4444-4444-4444-444444444442" }, // Kael does Hammam
];

// --- OPERATING HOURS ---
export const MOCK_OPERATING_HOURS: OperatingHours[] = [
  { id: "66666666-6666-6666-6666-666666666661", tenant_id: MOCK_TENANT_ID, location_id: MOCK_LOCATION.id, day_of_week: 1, open_time: "09:00", close_time: "21:00" }, // Monday
  { id: "66666666-6666-6666-6666-666666666662", tenant_id: MOCK_TENANT_ID, location_id: MOCK_LOCATION.id, day_of_week: 2, open_time: "09:00", close_time: "21:00" }, // Tuesday
];

// --- THERAPIST SHIFTS ---
export const MOCK_SHIFTS: TherapistShift[] = [
  { id: "77777777-7777-7777-7777-777777777771", tenant_id: MOCK_TENANT_ID, therapist_id: "44444444-4444-4444-4444-444444444441", location_id: MOCK_LOCATION.id, starts_at: "2026-06-01T09:00:00Z", ends_at: "2026-06-01T17:00:00Z", recurrence_rule: null },
];

// --- BLOCKERS ---
export const MOCK_BLOCKERS: Blocker[] = [
  { id: "88888888-8888-8888-8888-888888888881", tenant_id: MOCK_TENANT_ID, room_id: null, therapist_id: "44444444-4444-4444-4444-444444444441", starts_at: "2026-06-01T12:00:00Z", ends_at: "2026-06-01T13:00:00Z", reason: "Lunch break" },
  { id: "88888888-8888-8888-8888-888888888882", tenant_id: MOCK_TENANT_ID, room_id: "33333333-3333-3333-3333-333333333331", therapist_id: null, starts_at: "2026-06-02T09:00:00Z", ends_at: "2026-06-02T12:00:00Z", reason: "Deep cleaning" },
];

// --- BOOKINGS ---
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "99999999-9999-9999-9999-999999999991",
    tenant_id: MOCK_TENANT_ID,
    service_id: "55555555-5555-5555-5555-555555555551",
    room_id: "33333333-3333-3333-3333-333333333331",
    therapist_id: "44444444-4444-4444-4444-444444444441",
    service_start_time: "2026-06-01T10:00:00Z",
    service_end_time: "2026-06-01T11:00:00Z",
    cleanup_end_time: "2026-06-01T11:15:00Z",
    booking_source: "online",
    booking_status: "confirmed",
    customer_info: { name: "John Doe" },
    notes: "First time guest",
  }
];
