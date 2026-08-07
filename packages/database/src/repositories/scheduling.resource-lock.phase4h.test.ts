import { describe, it } from "node:test";
import * as assert from "node:assert";
import { getBookingResourceAdvisoryLocks } from "./scheduling.repository.js";

const TENANT = "11111111-1111-1111-1111-111111111111";
const ROOM_A = "22222222-2222-2222-2222-222222222222";
const ROOM_B = "33333333-3333-3333-3333-333333333333";
const THERAPIST_A = "44444444-4444-4444-4444-444444444444";
const THERAPIST_B = "55555555-5555-5555-5555-555555555555";

function key(pair: readonly [number, number]): string {
  return `${pair[0]}:${pair[1]}`;
}

describe("Phase 4H PostgreSQL resource lock policy", () => {
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
