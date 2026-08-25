import type {
  ActionPriorityResult,
  CanonicalBooking,
  GuardBadge,
  GuardResult,
  ProgressState,
  VisualState,
} from "@santis-core/domain-contracts";
import { VisualStateSchema } from "@santis-core/domain-contracts";

const BADGE_TYPE_ORDER = {
  QUARANTINE: 0,
  CONFLICT: 1,
  BRANCH: 2,
  CAPABILITY: 3,
  PAYMENT: 4,
  LOCK: 5,
  DATA_QUALITY: 6,
} as const;

export function resolveBadges(
  guards: readonly GuardResult[],
): GuardBadge[] {
  return guards
    .filter(
      (guard): guard is GuardResult & { state: "WARNING" | "FAIL" } =>
        guard.state === "WARNING" || guard.state === "FAIL"
    )
    .map((guard) => ({
      type: guard.type,
      severity: guard.state,
      code: guard.code ?? `${guard.type}_${guard.state}`,
      label: guard.message ?? `${guard.guard} ${guard.state}`,
    }))
    .sort((a, b) => {
      return (
        (a.severity === b.severity ? 0 : a.severity === "FAIL" ? -1 : 1) ||
        BADGE_TYPE_ORDER[a.type] - BADGE_TYPE_ORDER[b.type] ||
        a.code.localeCompare(b.code)
      );
    });
}

export function resolveVisualState(
  booking: CanonicalBooking,
  progress: ProgressState,
  actionPriority: ActionPriorityResult,
  badges: readonly GuardBadge[],
): VisualState {
  const progressVisible = booking.Status === "IN_PROGRESS";
  const progressLabel = progressVisible && progress.progressPercent !== null
    ? progress.delayMinutes && progress.delayMinutes > 0
      ? `${Math.round(progress.elapsedMinutes ?? 0)} / ${Math.round(progress.totalMinutes ?? 0)} dk +${Math.round(progress.delayMinutes)} dk gecikme`
      : `${Math.round(progress.elapsedMinutes ?? 0)} / ${Math.round(progress.totalMinutes ?? 0)} dk`
    : null;

  return VisualStateSchema.parse({
    statusKey: booking.Status,
    categoryKey: booking.Service_Category,
    guestPriority: booking.Guest_Tier,
    actionPriority: actionPriority.highest_priority,
    progressPercent: progressVisible ? progress.progressPercent : null,
    progressState: progress.state,
    progressLabel,
    badges,
  });
}
