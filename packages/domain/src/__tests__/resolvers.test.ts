import assert from "node:assert/strict";
import test from "node:test";
import type { CanonicalBooking } from "@santis/domain-contracts";
import {
  resolveActionPriority,
  resolveBadges,
  resolveGuardStates,
  resolveProgress,
  resolveVisualState,
} from "../resolvers/index.js";

const ayseBooking: CanonicalBooking = {
  Booking_ID: "booking-001",
  Tenant_Link: "santis-club",
  Location_Link: "budva",
  Environment: "Live",
  Client_Link: "ayse-yilmaz",
  Service_Link: "premium-bali",
  Therapist_Link: "mehmet",
  Room_Link: "room-1",
  Status: "IN_PROGRESS",
  Service_Category: "PREMIUM_SIGNATURE",
  Guest_Tier: "VIP",
  VIP: true,
  Manual_Lock: false,
  Payment_Status: "UNPAID",
  Payment_Authorization_Status: "FAILED",
  Scheduled_Start: "2026-07-13T11:00:00Z",
  Scheduled_End: "2026-07-13T12:30:00Z",
  Planned_Duration_Minutes: 90,
  Actual_Start: "2026-07-13T11:00:00Z",
  Actual_End: null,
  Pause_Minutes: 0,
  Extension_Minutes: 0,
};

test("Ayşe Yılmaz fixture resolves canonical progress, priority and badges", () => {
  const progress = resolveProgress(
    ayseBooking,
    new Date("2026-07-13T12:00:00Z"),
  );
  assert.equal(progress.state, "NORMAL");
  assert.ok(Math.abs((progress.progressPercent ?? 0) - 66.6667) < 0.01);
  assert.equal(progress.expectedEnd, "2026-07-13T12:30:00.000Z");

  const guards = resolveGuardStates([
    {
      guard: "ConflictGuard",
      type: "CONFLICT",
      state: "FAIL",
      code: "CONFLICT_HARD_OVERLAP",
      message: "12:00 çakışması",
      suggestedAction: "RESOLVE_CONFLICT",
      evaluatedAt: "2026-07-13T12:00:00Z",
    },
    {
      guard: "PaymentGuard",
      type: "PAYMENT",
      state: "FAIL",
      code: "PAYMENT_AUTH_FAILED",
      message: "Provizyon başarısız",
      suggestedAction: "RETRY_PAYMENT",
      evaluatedAt: "2026-07-13T12:00:00Z",
    },
  ]);

  const actionPriority = resolveActionPriority(guards);
  const badges = resolveBadges(guards);
  const visual = resolveVisualState(
    ayseBooking,
    progress,
    actionPriority,
    badges,
  );

  assert.equal(actionPriority.highest_priority, "P0");
  assert.deepEqual(actionPriority.reasons.map((reason) => reason.priority), ["P0", "P2"]);
  assert.deepEqual(badges.map((badge) => badge.code), [
    "CONFLICT_HARD_OVERLAP",
    "PAYMENT_AUTH_FAILED",
  ]);
  assert.equal(visual.statusKey, "IN_PROGRESS");
  assert.equal(visual.categoryKey, "PREMIUM_SIGNATURE");
  assert.equal(visual.guestPriority, "VIP");
  assert.equal(visual.actionPriority, "P0");
});

test("no active reasons resolves to a silent priority state", () => {
  const priority = resolveActionPriority([]);
  assert.equal(priority.highest_priority, null);
  assert.deepEqual(priority.reasons, []);
});
