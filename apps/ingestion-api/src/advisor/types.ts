export interface AdvisorContext {
  mode: string;
  guestId?: string;
  tenantId: string;
  traits: string[];
  intents: string[];
  recentSessions: string[];
  activeMemory: string[];
  recommendation: {
    suggestedServices: string[];
    messagingTone: string;
    nextBestAction: string;
  };
}

export interface IntentPayload {
  guestId?: string;
  tenantId: string;
  currentAction: string;
}
