import { autonomousActionRules } from './actions.rules.ts';

export const actionRegistry = {
  REORDER_SERVICES: {
    autoExecutable: autonomousActionRules.allowAutoReorderServices,
    severity: 'low',
  },
  HIDE_LOW_CONFIDENCE_SLOTS: {
    autoExecutable: autonomousActionRules.allowAutoHideLowConfidenceSlots,
    severity: 'low',
  },
  SHOW_CONCIERGE_PRIORITY_CTA: {
    autoExecutable: autonomousActionRules.allowAutoShowConciergeCta,
    severity: 'low',
  },
  SHOW_QUOTE_RECOVERY_BANNER: {
    autoExecutable: autonomousActionRules.allowAutoQuoteRecoveryBanner,
    severity: 'low',
  },
  ENABLE_COMPACT_LAYOUT: {
    autoExecutable: autonomousActionRules.allowAutoCompactLayout,
    severity: 'low',
  },
  SUPPRESS_UPSELLS: {
    autoExecutable: autonomousActionRules.allowAutoSuppressUpsells,
    severity: 'medium',
  },
  SUGGEST_HUMAN_ESCALATION: {
    autoExecutable: autonomousActionRules.allowAutoHumanEscalation,
    severity: 'high',
  },
} as const;
