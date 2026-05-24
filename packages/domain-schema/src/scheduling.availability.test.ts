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
    const context = {
      ...baseContext,
      bookings: MOCK_BOOKINGS // Has booking on room-01 from 10:00 to 11:15
    };
    const slots = calculateAvailability(context);
    
    const overlappingSlot = slots.find(s => s.slot_start === "2026-06-01T10:00:00.000Z");
    if (overlappingSlot) {
      // Room 01 is booked, but Room 02 is also compatible!
      // So overlappingSlot room_id should be Room 02 ("33333333-3333-3333-3333-333333333332")
      assert.strictEqual(overlappingSlot.room_id, "33333333-3333-3333-3333-333333333332");
    }
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
});
