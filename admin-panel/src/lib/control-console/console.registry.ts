export const controlConsoleRegistry = {
  REORDER_SERVICES: {
    operatorVisible: true,
    requiresApproval: false,
  },
  HIDE_LOW_CONFIDENCE_SLOTS: {
    operatorVisible: true,
    requiresApproval: false,
  },
  SHOW_CONCIERGE_PRIORITY_CTA: {
    operatorVisible: true,
    requiresApproval: false,
  },
  SHOW_QUOTE_RECOVERY_BANNER: {
    operatorVisible: true,
    requiresApproval: false,
  },
  ENABLE_COMPACT_LAYOUT: {
    operatorVisible: true,
    requiresApproval: false,
  },
  SUPPRESS_UPSELLS: {
    operatorVisible: true,
    requiresApproval: false,
  },
  SUGGEST_HUMAN_ESCALATION: {
    operatorVisible: true,
    requiresApproval: true,
  },
} as const;
