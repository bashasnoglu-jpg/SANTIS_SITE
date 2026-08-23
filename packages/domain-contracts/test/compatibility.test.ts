import assert from "node:assert/strict";
import test from "node:test";

import {
  ActionPriorityResultSchema,
  ActionRecommendationSchema,
  AuditLogEntrySchema,
  AuditLogEvents,
  CanonicalBookingSchema,
  GuestIntentSignalSchema,
  RitualGraphNodeSchema,
  SantisSessionContextSchema,
  SchedulingResourcesRequestSchema,
  SsePatchEnvelopeSchema,
  TenantSchema,
  insertSignalSchema,
} from "../src/index.ts";
import type { BoardroomState } from "../src/index.ts";

type BoardroomStateCompatibility = BoardroomState;

test("legacy validation-safe domain export groups remain available", () => {
  assert.equal(typeof TenantSchema.safeParse, "function");
  assert.equal(typeof GuestIntentSignalSchema.safeParse, "function");
  assert.equal(typeof SsePatchEnvelopeSchema.safeParse, "function");
  assert.equal(typeof AuditLogEntrySchema.safeParse, "function");
  assert.equal(typeof ActionRecommendationSchema.safeParse, "function");
  assert.equal(Array.isArray(AuditLogEvents), true);
  assert.equal(typeof SantisSessionContextSchema.safeParse, "function");
  assert.equal(typeof RitualGraphNodeSchema.safeParse, "function");
  assert.equal(typeof SchedulingResourcesRequestSchema.safeParse, "function");
  assert.equal(typeof CanonicalBookingSchema.safeParse, "function");
  assert.equal(typeof ActionPriorityResultSchema.safeParse, "function");
  assert.equal(typeof insertSignalSchema.safeParse, "function");
  const compileOnly: BoardroomStateCompatibility | undefined = undefined;
  assert.equal(compileOnly, undefined);
});
