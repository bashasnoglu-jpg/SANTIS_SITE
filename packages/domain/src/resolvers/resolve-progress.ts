import type {
  CanonicalBooking,
  ProgressState,
} from "@santis-core/domain-contracts";
import { ProgressStateSchema } from "@santis-core/domain-contracts";

const MINUTE_MS = 60_000;

export function resolveProgress(
  booking: CanonicalBooking,
  now: Date,
): ProgressState {
  if (booking.Status === "COMPLETED") {
    return ProgressStateSchema.parse({
      state: "COMPLETED",
      elapsedMinutes: booking.Planned_Duration_Minutes + booking.Extension_Minutes,
      totalMinutes: booking.Planned_Duration_Minutes + booking.Extension_Minutes,
      progressPercent: 100,
      delayMinutes: null,
      expectedEnd: booking.Actual_End,
    });
  }

  if (booking.Status !== "IN_PROGRESS") {
    return ProgressStateSchema.parse({
      state: "NOT_APPLICABLE",
      elapsedMinutes: null,
      totalMinutes: null,
      progressPercent: null,
      delayMinutes: null,
      expectedEnd: null,
    });
  }

  if (!booking.Actual_Start) {
    return ProgressStateSchema.parse({
      state: "NOT_STARTED",
      elapsedMinutes: null,
      totalMinutes: null,
      progressPercent: null,
      delayMinutes: null,
      expectedEnd: null,
    });
  }

  const actualStartMs = Date.parse(booking.Actual_Start);
  const totalMinutes = booking.Planned_Duration_Minutes + booking.Extension_Minutes;
  const elapsedMinutes = Math.max(
    0,
    (now.getTime() - actualStartMs) / MINUTE_MS - booking.Pause_Minutes,
  );
  const progressPercent = (elapsedMinutes / totalMinutes) * 100;
  const delayMinutes = Math.max(0, elapsedMinutes - totalMinutes);
  const expectedEnd = new Date(
    actualStartMs +
      (booking.Planned_Duration_Minutes +
        booking.Pause_Minutes +
        booking.Extension_Minutes) *
        MINUTE_MS,
  ).toISOString();

  const state =
    progressPercent <= 100
      ? "NORMAL"
      : progressPercent <= 115
        ? "DELAY_WARNING"
        : "CRITICAL_DELAY";

  return ProgressStateSchema.parse({
    state,
    elapsedMinutes,
    totalMinutes,
    progressPercent,
    delayMinutes: delayMinutes > 0 ? delayMinutes : null,
    expectedEnd,
  });
}
