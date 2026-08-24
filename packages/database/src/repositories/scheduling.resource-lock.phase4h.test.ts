import { describe, it } from "node:test";
import * as assert from "node:assert";
import {
  getBookingResourceAdvisoryLocks,
  resolvePhase4HCandidate,
} from "./phase4h-booking-writer.js";

const TENANT = "11111111-1111-1111-1111-111111111111";
const SERVICE = "66666666-6666-6666-6666-666666666666";
const ROOM_A = "22222222-2222-2222-2222-222222222222";
const ROOM_B = "33333333-3333-3333-3333-333333333333";
const THERAPIST_A = "44444444-4444-4444-4444-444444444444";
const THERAPIST_B = "55555555-5555-5555-5555-555555555555";

function key(pair: readonly [number, number]): string {
  return `${pair[0]}:${pair[1]}`;
}

describe("Phase 4H PostgreSQL resource lock policy", () => {
  it("resolves end time from canonical duration", () => {
    const resolved = resolvePhase4HCandidate({
      tenant_id: TENANT,
      service_id: SERVICE,
      room_id: ROOM_A,
      therapist_id: THERAPIST_A,
      service_start_time: "2026-08-07T10:00:00.000Z",
      duration_minutes: 50,
      cleanup_minutes: 10,
    });

    assert.ok(resolved);
    assert.strictEqual(resolved.service_end_time, "2026-08-07T10:50:00.000Z");
    assert.strictEqual(resolved.cleanup_end_time, "2026-08-07T11:00:00.000Z");
  });

  it("fails closed when no end or trusted duration exists", () => {
    const resolved = resolvePhase4HCandidate({
      tenant_id: TENANT,
      service_id: SERVICE,
      room_id: ROOM_A,
      therapist_id: THERAPIST_A,
      service_start_time: "2026-08-07T10:00:00.000Z",
    });
    assert.strictEqual(resolved, null);
  });

  it("acquires two deterministic tenant-scoped locks", () => {
    const first = getBookingResourceAdvisoryLocks(TENANT, ROOM_A, THERAPIST_A);
    const second = getBookingResourceAdvisoryLocks(TENANT, ROOM_A, THERAPIST_A);

    assert.strictEqual(first.length, 2);
    assert.deepStrictEqual(first, second);
    assert.strictEqual(first[0][0], first[1][0]);
    assert.notStrictEqual(first[0][1], first[1][1]);
  });

  it("serializes same therapist even when rooms differ", () => {
    const requestA = new Set(getBookingResourceAdvisoryLocks(TENANT, ROOM_A, THERAPIST_A).map(key));
    const requestB = new Set(getBookingResourceAdvisoryLocks(TENANT, ROOM_B, THERAPIST_A).map(key));
    const shared = [...requestA].filter((value) => requestB.has(value));

    assert.strictEqual(shared.length, 1);
  });

  it("serializes same room even when therapists differ", () => {
    const requestA = new Set(getBookingResourceAdvisoryLocks(TENANT, ROOM_A, THERAPIST_A).map(key));
    const requestB = new Set(getBookingResourceAdvisoryLocks(TENANT, ROOM_A, THERAPIST_B).map(key));
    const shared = [...requestA].filter((value) => requestB.has(value));

    assert.strictEqual(shared.length, 1);
  });

  it("does not serialize unrelated resources in the same tenant", () => {
    const requestA = new Set(getBookingResourceAdvisoryLocks(TENANT, ROOM_A, THERAPIST_A).map(key));
    const requestB = new Set(getBookingResourceAdvisoryLocks(TENANT, ROOM_B, THERAPIST_B).map(key));
    const shared = [...requestA].filter((value) => requestB.has(value));

    assert.strictEqual(shared.length, 0);
  });
});
