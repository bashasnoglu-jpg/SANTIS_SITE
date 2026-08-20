import test from "node:test";
import assert from "node:assert";
import { calculateAvailability, AvailabilityEngineContext } from "./scheduling.availability";
import {
  MOCK_TENANT_ID,
  MOCK_LOCATION,
  MOCK_SPA_AREA,
  MOCK_ROOMS,
  MOCK_THERAPISTS,
  MOCK_SERVICES,
  MOCK_SERVICE_ROOM_COMPATIBILITIES,
  MOCK_SERVICE_THERAPIST_COMPATIBILITIES,
  MOCK_OPERATING_HOURS,
  MOCK_SHIFTS,
  MOCK_BLOCKERS,
  MOCK_BOOKINGS
} from "./scheduling.fixtures";

const baseContext: AvailabilityEngineContext = {
  tenant_id: MOCK_TENANT_ID,
  target_date: "2026-06-01", // Monday
  service_id: "55555555-5555-5555-5555-555555555551", // Deep Tissue Massage (60 min + 15 min cleanup)
  spa_area_id: MOCK_SPA_AREA.id,
  locations: [MOCK_LOCATION],
  spa_areas: [MOCK_SPA_AREA],
  rooms: MOCK_ROOMS,
  therapists: MOCK_THERAPISTS,
  services: MOCK_SERVICES,
  room_compatibilities: MOCK_SERVICE_ROOM_COMPATIBILITIES,
  therapist_compatibilities: MOCK_SERVICE_THERAPIST_COMPATIBILITIES,
  operating_hours: MOCK_OPERATING_HOURS,
  shifts: MOCK_SHIFTS,
  blockers: [],
  bookings: []
};

test("Availability Engine - Pure Function Tests", async (t) => {
  await t.test("returns advisory slots quantized by default interval", () => {
    const slots = calculateAvailability(baseContext);
    assert.ok(slots.length > 0, "Should generate available slots");
    
    const firstSlot = slots[0];
    assert.strictEqual(firstSlot.is_advisory, true, "Must include is_advisory flag");
    assert.strictEqual(firstSlot.slot_start, "2026-06-01T09:00:00.000Z");
    assert.strictEqual(firstSlot.service_end_time, "2026-06-01T10:00:00.000Z");
    assert.strictEqual(firstSlot.cleanup_end_time, "2026-06-01T10:15:00.000Z");
  });

  await t.test("blocks room correctly via booking overlap", () => {
    // We change the booking's therapist so that Therapist 1 remains free.
    // This allows Room 02 to be picked since Therapist 1 is free and Room 01 is booked.
    const context = {
      ...baseContext,
      bookings: [{ ...MOCK_BOOKINGS[0], therapist_id: "some-other-therapist" }] 
    };
    const slots = calculateAvailability(context);
    
    const overlappingSlot = slots.find(s => s.slot_start === "2026-06-01T10:00:00.000Z");
    assert.ok(overlappingSlot, "Slot should exist using Room 02");
    assert.strictEqual(overlappingSlot.room_id, "33333333-3333-3333-3333-333333333332");
  });

  await t.test("blocks therapist correctly via blocker", () => {
    const context = {
      ...baseContext,
      blockers: MOCK_BLOCKERS // Therapist 1 is blocked 12:00-13:00
    };
    const slots = calculateAvailability(context);
    const blockedSlot = slots.find(s => s.slot_start === "2026-06-01T12:00:00.000Z");
    
    // Therapist 1 is the only compatible therapist for this service in the fixtures!
    // So 12:00 should not exist in slots.
    assert.strictEqual(blockedSlot, undefined, "Slot should be removed because therapist is blocked");
  });

  await t.test("respects tenant isolation", () => {
    const otherTenantId = "other-tenant-id";
    const context = {
      ...baseContext,
      tenant_id: otherTenantId,
      // Pass the same arrays but they belong to MOCK_TENANT_ID, so they should be filtered out
    };
    const slots = calculateAvailability(context);
    assert.strictEqual(slots.length, 0, "Should return 0 slots for empty tenant data");
  });
  
  await t.test("ignores cancelled bookings", () => {
    const context = {
      ...baseContext,
      bookings: [
        { ...MOCK_BOOKINGS[0], booking_status: "cancelled" as const }
      ]
    };
    const slots = calculateAvailability(context);
    const overlappingSlot = slots.find(s => s.slot_start === "2026-06-01T10:00:00.000Z");
    
    // Should fallback to room 01 because the booking is cancelled
    assert.ok(overlappingSlot);
    assert.strictEqual(overlappingSlot.room_id, "33333333-3333-3333-3333-333333333331");
  });

  await t.test("1. cleanup buffer conflict", () => {
    // Room 01 has a booking from 09:00 to 10:00, with cleanup until 10:15
    const context = {
      ...baseContext,
      bookings: [{
        ...MOCK_BOOKINGS[0],
        room_id: "33333333-3333-3333-3333-333333333331",
        service_start_time: "2026-06-01T09:00:00Z",
        service_end_time: "2026-06-01T10:00:00Z",
        cleanup_end_time: "2026-06-01T10:15:00Z"
      }]
    };
    const slots = calculateAvailability(context);
    // A slot starting at 10:00 should NOT be able to use Room 01 because cleanup runs until 10:15
    const slotAt10 = slots.find(s => s.slot_start === "2026-06-01T10:00:00.000Z");
    assert.ok(slotAt10);
    assert.notStrictEqual(slotAt10.room_id, "33333333-3333-3333-3333-333333333331");
  });

  await t.test("2. outside operating hours", () => {
    const slots = calculateAvailability(baseContext);
    // Operating hours close at 21:00. Service + cleanup is 75 mins.
    // So latest possible start time is 19:45 (ends 21:00).
    // A slot starting at 20:00 would end at 21:15, which is outside hours.
    const slotAt20 = slots.find(s => s.slot_start === "2026-06-01T20:00:00.000Z");
    assert.strictEqual(slotAt20, undefined, "Slot should not exist outside operating hours");
  });

  await t.test("3. therapist outside shift", () => {
    // MOCK_SHIFTS is 09:00 to 17:00 for Therapist 1.
    // Service is 60 mins. A slot starting at 16:15 would end at 17:15.
    const slots = calculateAvailability(baseContext);
    const slotAt1615 = slots.find(s => s.slot_start === "2026-06-01T16:15:00.000Z");
    assert.strictEqual(slotAt1615, undefined, "Slot should not exist if therapist shift ends before service finishes");
  });

  await t.test("4. incompatible room", () => {
    // Hammam Ritual (srv-03) only allowed in Hammam room (room-03)
    const context = {
      ...baseContext,
      service_id: "55555555-5555-5555-5555-555555555553", // Hammam
      shifts: [{ ...MOCK_SHIFTS[0], therapist_id: "44444444-4444-4444-4444-444444444442" }] // Kael needs a shift for this to even return slots
    };
    const slots = calculateAvailability(context);
    const slot = slots[0];
    assert.ok(slot);
    assert.strictEqual(slot.room_id, "33333333-3333-3333-3333-333333333333", "Must only use compatible Hammam room");
  });

  await t.test("5. incompatible therapist", () => {
    // Hammam Ritual (srv-03) only allowed by Kael (therapist-02)
    const context = {
      ...baseContext,
      service_id: "55555555-5555-5555-5555-555555555553", // Hammam
      shifts: [{ ...MOCK_SHIFTS[0], therapist_id: "44444444-4444-4444-4444-444444444442" }] // Give Kael a shift
    };
    const slots = calculateAvailability(context);
    const slot = slots[0];
    assert.strictEqual(slot.therapist_id, "44444444-4444-4444-4444-444444444442", "Must only use compatible Hammam therapist");
  });

  await t.test("6. half-open back-to-back boundary", () => {
    // Room 01 booked 09:00 to 10:00 (no cleanup for simplicity of this test)
    const context = {
      ...baseContext,
      bookings: [{
        ...MOCK_BOOKINGS[0],
        room_id: "33333333-3333-3333-3333-333333333331",
        service_start_time: "2026-06-01T09:00:00Z",
        service_end_time: "2026-06-01T10:00:00Z",
        cleanup_end_time: "2026-06-01T10:00:00Z"
      }]
    };
    const slots = calculateAvailability(context);
    // Since interval is [start, end), a new booking at 10:00 should perfectly fit without overlap
    const slotAt10 = slots.find(s => s.slot_start === "2026-06-01T10:00:00.000Z");
    assert.ok(slotAt10);
    assert.strictEqual(slotAt10.room_id, "33333333-3333-3333-3333-333333333331", "Back to back bookings should be allowed via half-open interval");
  });

  await t.test("7. in_progress booking blocks", () => {
    const context = {
      ...baseContext,
      bookings: [{ ...MOCK_BOOKINGS[0], booking_status: "in_progress" as const }]
    };
    const slots = calculateAvailability(context);
    const slotAt10 = slots.find(s => s.slot_start === "2026-06-01T10:00:00.000Z");
    assert.strictEqual(slotAt10, undefined, "Slot should be fully blocked because Therapist 1 is in_progress");
  });

  await t.test("8. checked_in booking blocks", () => {
    const context = {
      ...baseContext,
      bookings: [{ ...MOCK_BOOKINGS[0], booking_status: "checked_in" as const }]
    };
    const slots = calculateAvailability(context);
    const slotAt10 = slots.find(s => s.slot_start === "2026-06-01T10:00:00.000Z");
    assert.strictEqual(slotAt10, undefined, "Slot should be fully blocked because Therapist 1 is checked_in");
  });

  await t.test("9. completed booking ignored", () => {
    const context = {
      ...baseContext,
      bookings: [{ ...MOCK_BOOKINGS[0], booking_status: "completed" as const }]
    };
    const slots = calculateAvailability(context);
    const slotAt10 = slots.find(s => s.slot_start === "2026-06-01T10:00:00.000Z");
    assert.ok(slotAt10);
    assert.strictEqual(slotAt10.room_id, "33333333-3333-3333-3333-333333333331");
  });

  await t.test("10. no_show booking ignored", () => {
    const context = {
      ...baseContext,
      bookings: [{ ...MOCK_BOOKINGS[0], booking_status: "no_show" as const }]
    };
    const slots = calculateAvailability(context);
    const slotAt10 = slots.find(s => s.slot_start === "2026-06-01T10:00:00.000Z");
    assert.ok(slotAt10);
    assert.strictEqual(slotAt10.room_id, "33333333-3333-3333-3333-333333333331");
  });
});
