import type { SantisCommand, SantisEvent } from "@santis/event-contracts";

type SelectMoodCommand = Extract<
  SantisCommand,
  { commandType: "guest.select_mood" }
>;

export function mapSelectMoodCommandToEvent(params: {
  command: SelectMoodCommand;
  tenant: {
    hotelId: string;
    hotelCode: string;
    region: Extract<SantisEvent["tenant"]["region"], string>;
    locale: Extract<SantisEvent["tenant"]["locale"], string>;
    currency: Extract<SantisEvent["tenant"]["currency"], string>;
    activePolicies?: string[];
    fallbackMode?: boolean;
  };
  intent: {
    guestId?: string;
    isReturningGuest: boolean;
    segment: Extract<SantisEvent["intent"]["segment"], string>;
    moodAffinity: string[];
    premiumThreshold: number;
  };
  source: Extract<Extract<SantisEvent, { eventType: "experience.interaction.mood_selected" }>["payload"]["source"], string>;
}): SantisEvent {
  return {
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    traceId: params.command.traceId,
    sessionId: params.command.sessionId,
    schemaVersion: "v1",
    tenant: {
      hotelId: params.tenant.hotelId,
      hotelCode: params.tenant.hotelCode,
      region: params.tenant.region as any,
      locale: params.tenant.locale as any,
      currency: params.tenant.currency as any,
      activePolicies: params.tenant.activePolicies ?? [],
      fallbackMode: params.tenant.fallbackMode ?? false,
    },
    intent: {
      guestId: params.intent.guestId,
      isReturningGuest: params.intent.isReturningGuest,
      segment: params.intent.segment as any,
      moodAffinity: params.intent.moodAffinity as any,
      premiumThreshold: params.intent.premiumThreshold,
    },
    eventType: "experience.interaction.mood_selected",
    payload: {
      mood: params.command.payload.mood as any,
      source: params.source as any,
    },
  };
}
