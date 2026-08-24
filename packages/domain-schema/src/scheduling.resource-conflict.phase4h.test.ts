import { describe, it } from "node:test";
import * as assert from "node:assert";
import { evaluateBooking, ProposedBooking, BookingGuardContext } from "./scheduling.booking-guard.js";
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
  MOCK_BOOKINGS
} from "./scheduling.fixtures.js";

const baseContext: BookingGuardContext = {
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

const candidate: ProposedBooking = {
  tenant_id: MOCK_TENANT_ID,
  service_id: MOCK_SERVICES[0].id,
  room_id: MOCK_ROOMS[0].id,
  therapist_id: MOCK_THERAPISTS[0].id,
  service_start_time: "2026-06-01T09:00:00Z",
  service_end_time: "2026-06-01T10:00:00Z",
  cleanup_end_time: "2026-06-01T10:15:00Z"
};

function existing(overrides: Record<string, unknown>) {
  return {
    ...MOCK_BOOKINGS[0],
    room_id: MOCK_ROOMS[0].id,
    therapist_id: MOCK_THERAPISTS[0].id,
    service_start_time: "2026-06-01T09:15:00Z",
    service_end_time: "2026-06-01T09:45:00Z",
    cleanup_end_time: "2026-06-01T10:00:00Z",
    booking_status: "draft" as const,
    ...overrides
  };
}

describe("Phase 4H resource conflict guard", () => {
  it("rejects same therapist and room overlap even when existing booking is Draft", () => {
    const result = evaluateBooking(candidate, {
      ...baseContext,
      bookings: [existing({})]
    });
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.conflictCode, "BOOKING_RESOURCE_CONFLICT");
  });

  it("rejects therapist-only overlap", () => {
    const result = evaluateBooking(candidate, {
      ...baseContext,
      bookings: [existing({ room_id: MOCK_ROOMS[1].id })]
    });
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.conflictCode, "THERAPIST_BOOKING_CONFLICT");
  });

  it("rejects room-only overlap", () => {
    const result = evaluateBooking(candidate, {
      ...baseContext,
      bookings: [existing({ therapist_id: MOCK_THERAPISTS[1].id })]
    });
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.conflictCode, "ROOM_BOOKING_CONFLICT");
  });

  it("allows adjacent half-open intervals", () => {
    const result = evaluateBooking(candidate, {
      ...baseContext,
      bookings: [existing({
        service_start_time: "2026-06-01T08:00:00Z",
        service_end_time: "2026-06-01T08:45:00Z",
        cleanup_end_time: "2026-06-01T09:00:00Z",
        booking_status: "confirmed"
      })]
    });
    assert.strictEqual(result.allowed, true);
  });

  it("fails closed when canonical context is incomplete", () => {
    const result = evaluateBooking({
      ...candidate,
      service_end_time: ""
    }, baseContext);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.conflictCode, "CONFLICT_CONTEXT_INCOMPLETE");
  });

  it("ignores cancelled bookings", () => {
    const result = evaluateBooking(candidate, {
      ...baseContext,
      bookings: [existing({ booking_status: "cancelled" })]
    });
    assert.strictEqual(result.allowed, true);
  });

  it("ignores no-show bookings", () => {
    const result = evaluateBooking(candidate, {
      ...baseContext,
      bookings: [existing({ booking_status: "no_show" })]
    });
    assert.strictEqual(result.allowed, true);
  });
});
