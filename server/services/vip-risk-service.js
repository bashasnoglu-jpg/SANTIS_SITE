// ORCHESTRATION LAYER
import { evaluateVipRisk } from "../core/vip-risk/vip-risk-engine.js";

export async function getVipRiskEvaluation(guestId, deps) {
  const { crmRepo, bookingRepo } = deps;

  const [profile, history] = await Promise.all([
    crmRepo.getProfile(guestId),
    bookingRepo.getHistory(guestId),
  ]);

  const input = {
    complaintCount: profile.recentComplaints || 0,
    hasDowngradeRisk: profile.isConsideringDowngrade || false,
    daysSinceLastVisit: history.lastVisitDaysAgo || 0,
    isHighSpender: profile.lifetimeValue > 10000,
  };

  const result = evaluateVipRisk(input);

  return {
    guestId,
    ...result,
  };
}
