import type {
  DashboardSnapshot,
  SovereignAction,
  SovereignActionStatus,
} from "./action-engine.types";

export interface ActionEngineDeps {
  now?: () => string;
  idFactory?: (prefix: string) => string;
}

function defaultNow(): string {
  return new Date().toISOString();
}

function defaultIdFactory(prefix: string): string {
  return `${prefix}_${Date.now()}`;
}

export function deriveConciergeActions(
  snapshot: DashboardSnapshot,
  deps: ActionEngineDeps = {}
): SovereignAction[] {
  const now = deps.now ?? defaultNow;
  const idFactory = deps.idFactory ?? defaultIdFactory;
  const actions: SovereignAction[] = [];

  if (snapshot.dropRate > 10) {
    actions.push({
      id: idFactory("drop_alert"),
      type: "ALERT",
      severity: snapshot.dropRate > 18 ? "critical" : "high",
      title: "Keskin Drop-off Tespiti",
      description: `Akışta drop-off oranı %${snapshot.dropRate.toFixed(
        1
      )} seviyesine çıktı.`,
      source: "concierge_dashboard",
      metric: "dropRate",
      metricValue: snapshot.dropRate,
      threshold: 10,
      recommendedPatch: {
        kind: "audio_alert",
        payload: { sound: "danger", repeat: 1 },
      },
      createdAt: now(),
      requiresApproval: false,
      status: "new",
    });
  }

  if (snapshot.hotStep === "q2" && snapshot.dropRate > 12) {
    actions.push({
      id: idFactory("q2_optimization"),
      type: "OPTIMIZATION",
      severity: "high",
      title: "Q2 Sürtünme Optimizasyonu",
      description:
        "Q2 adımında beklenenden yüksek drop-off var. Copy sadeleştirmesi veya seçenek azaltımı önerilir.",
      source: "funnel_monitor",
      metric: "dropRate",
      metricValue: snapshot.dropRate,
      threshold: 12,
      recommendedPatch: {
        kind: "ui_copy",
        payload: {
          target: "q2",
          strategy: "simplify_options_and_reduce_cognitive_load",
        },
      },
      createdAt: now(),
      requiresApproval: true,
      status: "new",
    });
  }

  if (snapshot.dropRate > 10 && snapshot.conciergeRate < 5) {
    actions.push({
      id: idFactory("concierge_recovery"),
      type: "RECOVERY",
      severity: "high",
      title: "Concierge Fallback Önerisi",
      description:
        "Drop-off yüksek, concierge oranı düşük. Sonuç öncesi uzman destek fallback’i önerilir.",
      source: "boardroom_oracle",
      metric: "conciergeRate",
      metricValue: snapshot.conciergeRate,
      threshold: 5,
      recommendedPatch: {
        kind: "ui_flow",
        payload: {
          target: "pre_result_fallback",
          action: "show_concierge_assist_prompt",
        },
      },
      createdAt: now(),
      requiresApproval: true,
      status: "new",
    });
  }

  if (snapshot.premiumInterestRate < 3 && snapshot.completionRate > 40) {
    actions.push({
      id: idFactory("premium_advisory"),
      type: "ADVISORY",
      severity: "medium",
      title: "Premium İlgi Zayıf",
      description:
        "Completion güçlü ama premium ilgi düşük. Upgrade konumlandırması gözden geçirilmeli.",
      source: "concierge_dashboard",
      metric: "premiumInterestRate",
      metricValue: snapshot.premiumInterestRate,
      threshold: 3,
      recommendedPatch: {
        kind: "routing",
        payload: {
          target: "premium_upgrade_slot",
          strategy: "reposition_after_primary_result",
        },
      },
      createdAt: now(),
      requiresApproval: true,
      status: "new",
    });
  }

  return actions;
}

export function transitionActionStatus(
  action: SovereignAction,
  nextStatus: SovereignActionStatus
): SovereignAction {
  const validTransitions: Record<SovereignActionStatus, SovereignActionStatus[]> = {
    new: ["acknowledged", "approved", "rejected"],
    acknowledged: ["approved", "rejected"],
    approved: ["applied"],
    rejected: [],
    applied: [],
  };

  if (!validTransitions[action.status].includes(nextStatus)) {
    throw new Error(
      `Invalid action status transition: ${action.status} -> ${nextStatus}`
    );
  }

  return {
    ...action,
    status: nextStatus,
  };
}

export function shouldPlayDangerAlert(actions: SovereignAction[]): boolean {
  return actions.some(
    (action) =>
      action.type === "ALERT" &&
      (action.severity === "high" || action.severity === "critical")
  );
}

export interface CooldownState {
  lastTriggeredAt: number;
}

export function createDangerAlertGuard(cooldownMs = 30000) {
  const state: CooldownState = {
    lastTriggeredAt: 0,
  };

  return {
    canTrigger(nowMs: number): boolean {
      if (nowMs - state.lastTriggeredAt < cooldownMs) return false;
      state.lastTriggeredAt = nowMs;
      return true;
    },
    getState(): CooldownState {
      return { ...state };
    },
  };
}
