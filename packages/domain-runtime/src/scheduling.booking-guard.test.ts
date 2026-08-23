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
  MOCK_BLOCKERS,
  MOCK_BOOKINGS
} from "./scheduling.fixtures.js";

describe("Phase K-6: Booking Guard Engine", () => {
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

  const validBooking: ProposedBooking = {
    tenant_id: MOCK_TENANT_ID,
    service_id: MOCK_SERVICES[0].id,
    room_id: MOCK_ROOMS[0].id,
    therapist_id: MOCK_THERAPISTS[0].id,
    service_start_time: "2026-06-01T09:00:00Z",
    service_end_time: "2026-06-01T10:00:00Z",
    cleanup_end_time: "2026-06-01T10:15:00Z"
  };

  it("1. Allows valid booking", () => {
    const res = evaluateBooking(validBooking, baseContext);
    assert.strictEqual(res.allowed, true);
  });

  it("2. Rejects INVALID_TIME_RANGE", () => {
    const res = evaluateBooking({
      ...validBooking,
      service_start_time: "2026-06-01T10:00:00Z",
      service_end_time: "2026-06-01T09:00:00Z" // End before start
    }, baseContext);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.conflictCode, 'INVALID_TIME_RANGE');
  });

  it("3. Rejects TENANT_SCOPE_VIOLATION (wrong tenant)", () => {
    const res = evaluateBooking({
      ...validBooking,
      tenant_id: "66666666-6666-6666-6666-666666666666"
    }, baseContext);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.conflictCode, 'SERVICE_NOT_FOUND'); // First lookup to fail
  });

  it("4. Rejects ROOM_NOT_COMPATIBLE", () => {
    const res = evaluateBooking({
      ...validBooking,
      room_id: MOCK_ROOMS[2].id // Room 3 is not compatible with Service 1 in fixtures
    }, baseContext);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.conflictCode, 'ROOM_NOT_COMPATIBLE');
  });

  it("5. Rejects THERAPIST_NOT_COMPATIBLE", () => {
    const res = evaluateBooking({
      ...validBooking,
      therapist_id: MOCK_THERAPISTS[1].id // Therapist 2 is not compatible with Service 1 in fixtures
    }, baseContext);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.conflictCode, 'THERAPIST_NOT_COMPATIBLE');
  });

  it("6. Rejects OUTSIDE_OPERATING_HOURS", () => {
    const res = evaluateBooking({
      ...validBooking,
      service_start_time: "2026-06-01T07:00:00Z", // Opens at 08:00
      service_end_time: "2026-06-01T08:00:00Z",
      cleanup_end_time: "2026-06-01T08:15:00Z"
    }, baseContext);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.conflictCode, 'OUTSIDE_OPERATING_HOURS');
  });

  it("7. Rejects THERAPIST_OUTSIDE_SHIFT", () => {
    const res = evaluateBooking({
      ...validBooking,
      service_start_time: "2026-06-01T17:00:00Z",
      service_end_time: "2026-06-01T18:00:00Z",
      cleanup_end_time: "2026-06-01T18:15:00Z"
    }, baseContext);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.conflictCode, 'THERAPIST_OUTSIDE_SHIFT');
  });

  it("8. Rejects ROOM_BLOCKED", () => {
    const ctx: BookingGuardContext = {
      ...baseContext,
      blockers: [{
        ...MOCK_BLOCKERS[1], // Room 1 blocker
        starts_at: "2026-06-01T09:30:00Z",
        ends_at: "2026-06-01T10:30:00Z"
      }]
    };
    const res = evaluateBooking(validBooking, ctx);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.conflictCode, 'ROOM_BLOCKED');
  });

  it("9. Rejects THERAPIST_BLOCKED", () => {
    const ctx: BookingGuardContext = {
      ...baseContext,
      blockers: [{
        id: "777",
        tenant_id: MOCK_TENANT_ID,
        room_id: null,
        therapist_id: MOCK_THERAPISTS[0].id,
        starts_at: "2026-06-01T09:30:00Z",
        ends_at: "2026-06-01T10:30:00Z",
        reason: "Break"
      }]
    };
    const res = evaluateBooking(validBooking, ctx);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.conflictCode, 'THERAPIST_BLOCKED');
  });

  it("10. Rejects ROOM_BOOKING_CONFLICT (confirmed)", () => {
    const ctx: BookingGuardContext = {
      ...baseContext,
      bookings: [{
        ...MOCK_BOOKINGS[0],
        room_id: MOCK_ROOMS[0].id,
        therapist_id: MOCK_THERAPISTS[1].id, // Different therapist
        service_start_time: "2026-06-01T09:30:00Z",
        service_end_time: "2026-06-01T10:30:00Z",
        cleanup_end_time: "2026-06-01T10:45:00Z",
        booking_status: "confirmed"
      }]
    };
    const res = evaluateBooking(validBooking, ctx);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.conflictCode, 'ROOM_BOOKING_CONFLICT');
  });

  it("11. Rejects THERAPIST_BOOKING_CONFLICT (in_progress)", () => {
    const ctx: BookingGuardContext = {
      ...baseContext,
      bookings: [{
        ...MOCK_BOOKINGS[0],
        room_id: MOCK_ROOMS[1].id, // Different room
        therapist_id: MOCK_THERAPISTS[0].id,
        service_start_time: "2026-06-01T08:30:00Z",
        service_end_time: "2026-06-01T09:30:00Z",
        cleanup_end_time: "2026-06-01T09:45:00Z",
        booking_status: "in_progress"
      }]
    };
    const res = evaluateBooking(validBooking, ctx);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.conflictCode, 'THERAPIST_BOOKING_CONFLICT');
  });

  it("12. Ignores cancelled bookings", () => {
    const ctx: BookingGuardContext = {
      ...baseContext,
      bookings: [{
        ...MOCK_BOOKINGS[0],
        room_id: MOCK_ROOMS[0].id,
        therapist_id: MOCK_THERAPISTS[0].id,
        service_start_time: "2026-06-01T09:00:00Z",
        service_end_time: "2026-06-01T10:00:00Z",
        cleanup_end_time: "2026-06-01T10:15:00Z",
        booking_status: "cancelled" // Cancelled! Should not conflict
      }]
    };
    const res = evaluateBooking(validBooking, ctx);
    assert.strictEqual(res.allowed, true);
  });
});
