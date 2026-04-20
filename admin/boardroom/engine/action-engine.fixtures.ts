import type { DashboardSnapshot } from "./action-engine.types";

export const SNAPSHOT_HIGH_ALERT: DashboardSnapshot = {
  dropRate: 12.4,
  completionRate: 61.8,
  conciergeRate: 3.2,
  premiumInterestRate: 8.1,
  hotStep: "q2",
};

export const SNAPSHOT_CRITICAL_ALERT: DashboardSnapshot = {
  dropRate: 19.1,
  completionRate: 44.3,
  conciergeRate: 2.1,
  premiumInterestRate: 7.2,
  hotStep: "q3",
};

export const SNAPSHOT_LOW_NO_ALERT: DashboardSnapshot = {
  dropRate: 7.1,
  completionRate: 68.4,
  conciergeRate: 7.2,
  premiumInterestRate: 5.4,
  hotStep: "q1",
};

export const SNAPSHOT_PREMIUM_WEAK: DashboardSnapshot = {
  dropRate: 8.6,
  completionRate: 52.2,
  conciergeRate: 6.7,
  premiumInterestRate: 2.4,
  hotStep: "result",
};

export const SNAPSHOT_Q2_FRICTION_ONLY: DashboardSnapshot = {
  dropRate: 13.0,
  completionRate: 63.1,
  conciergeRate: 8.4,
  premiumInterestRate: 4.6,
  hotStep: "q2",
};
