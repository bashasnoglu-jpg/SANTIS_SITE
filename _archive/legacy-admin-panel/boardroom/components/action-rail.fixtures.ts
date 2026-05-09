import type { SovereignAction } from "../engine/action-engine.types";

export const ACTION_RAIL_FIXTURES: SovereignAction[] = [
  {
    id: "drop_alert_1",
    type: "ALERT",
    severity: "high",
    title: "Keskin Drop-off Tespiti",
    description: "Akışta Q2 merkezli keskin bir terk oranı yükselişi algılandı.",
    source: "concierge_dashboard",
    metric: "dropRate",
    metricValue: 12.4,
    threshold: 10,
    recommendedPatch: {
      kind: "audio_alert",
      payload: {
        sound: "danger",
        repeat: 1,
      },
    },
    createdAt: "2026-04-16T19:00:00.000Z",
    requiresApproval: false,
    status: "new",
  },
  {
    id: "q2_opt_1",
    type: "OPTIMIZATION",
    severity: "high",
    title: "Q2 Sürtünme Optimizasyonu",
    description:
      "Q2 cevap yüzeyinde bilişsel yük artıyor. Copy sadeleştirmesi önerildi.",
    source: "funnel_monitor",
    metric: "dropRate",
    metricValue: 12.4,
    threshold: 12,
    recommendedPatch: {
      kind: "ui_copy",
      payload: {
        target: "q2",
        strategy: "simplify_options_and_reduce_cognitive_load",
      },
    },
    createdAt: "2026-04-16T19:00:01.000Z",
    requiresApproval: true,
    status: "new",
  },
  {
    id: "recovery_1",
    type: "RECOVERY",
    severity: "high",
    title: "Concierge Fallback Önerisi",
    description:
      "Drop-off yüksek, concierge oranı düşük. Sonuç öncesi uzman destek yönlendirmesi önerilir.",
    source: "boardroom_oracle",
    metric: "conciergeRate",
    metricValue: 3.2,
    threshold: 5,
    recommendedPatch: {
      kind: "ui_flow",
      payload: {
        target: "pre_result_fallback",
        action: "show_concierge_assist_prompt",
      },
    },
    createdAt: "2026-04-16T19:00:02.000Z",
    requiresApproval: true,
    status: "new",
  },
];
