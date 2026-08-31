import type {
  CanonicalBooking,
  GuardResult,
} from "@santis-core/domain-contracts";
import { resolveActionPriority } from "./resolve-action-priority.js";
import { resolveBadges, resolveVisualState } from "./resolve-visual-state.js";
import { resolveProgress } from "./resolve-progress.js";

export function resolveDomainState(
  booking: CanonicalBooking,
  guards: readonly GuardResult[],
  now: Date,
) {
  const progress = resolveProgress(booking, now);
  const actionPriority = resolveActionPriority(guards);
  const badges = resolveBadges(guards);
  const visualState = resolveVisualState(
    booking,
    progress,
    actionPriority,
    badges,
  );

  return { progress, actionPriority, badges, visualState };
}
