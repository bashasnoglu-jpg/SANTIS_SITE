export const SovereignEventMap = {
  EXPERIENCE: {
    MOOD_SELECTED: "experience.interaction.mood_selected",
    FLOW_ABANDONED: "experience.flow.abandoned",
  },
  COMMERCE: {
    UPSELL_THERAPIST_ACCEPTED: "commerce.upsell.therapist_accepted",
    CHECKOUT_COMPLETED: "commerce.checkout.completed",
  },
  RISK: {
    FALLBACK_ENGAGED: "risk.fallback.engaged",
    SIGNAL_TRIGGERED: "risk.signal_triggered",
  },
  ROUTING: {
    POLICY_APPLIED: "routing.policy.applied",
  },
  PRICING: {
    MIDAS_ENGAGED: "pricing.midas.engaged",
    RECOMMENDATION_EMITTED: "pricing.recommendation.emitted",
    RECOMMENDATION_CREATED: "pricing.recommendation.created",
    AUTONOMOUS_RECOMMENDED: "pricing.autonomous.recommended",
    OVERRIDE_APPLIED: "pricing.override.applied",
  },
  BOARDROOM: {
    ORACLE_EXECUTED: "boardroom.oracle.executed",
    STRATEGY_APPLIED: "boardroom.strategy.applied",
    OVERRIDE_APPLIED: "boardroom.override.applied",
  },
  SYSTEM: {
    RADAR_ONLINE: "system.radar.online",
    STATUS: "system.status",
  },
  COMMUNICATION: {
    WHATSAPP_DELIVERED: "communication.whatsapp.delivered",
  },
} as const;

export const SovereignCommandMap = {
  GUEST: {
    SELECT_MOOD: "guest.select_mood",
  },
  PRICING: {
    CALCULATE_OFFER: "pricing.calculate_offer",
    OVERRIDE_APPLY: "pricing.override.apply",
  },
  ROUTING: {
    RESOLVE_EXPERIENCE: "routing.resolve_experience",
  },
  COMMERCE: {
    RECORD_CHECKOUT: "commerce.record_checkout",
  },
  RISK: {
    TRIGGER_SIGNAL: "risk.trigger_signal",
  },
  BOARDROOM: {
    ORACLE_EXECUTE: "boardroom.oracle.execute",
    STRATEGY_APPLY: "boardroom.strategy.apply",
    OVERRIDE_APPLY: "boardroom.override.apply",
  },
} as const;

type NestedValueOf<T> = T extends object
  ? { [K in keyof T]: NestedValueOf<T[K]> }[keyof T]
  : T;

export type SovereignEventType = NestedValueOf<typeof SovereignEventMap>;
export type SovereignCommandType = NestedValueOf<typeof SovereignCommandMap>;
