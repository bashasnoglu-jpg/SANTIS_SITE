import type {
  ResolveExperienceCommand,
  RoutingPolicyAppliedEvent,
} from "@santis-core/event-contracts";
import {
  RoutingPolicyAppliedEventSchema,
} from "@santis-core/event-contracts";
export interface SovereignBus {
  events: {
    publish(event: any): Promise<void> | void;
  };
}
// Mocked createEvent since it's likely internal
const createEvent = (data: any) => ({
  eventId: "11111111-1111-1111-1111-111111111111", // Use UUID generator in production
  schemaVersion: "v1",
  occurredAt: new Date().toISOString(),
  ...data
});

import {
  PolicyEngine,
  type DeviceTier,
  type ExperiencePolicyOutcome,
} from "./policy-engine";

export interface ResolveExperienceInput {
  command: ResolveExperienceCommand;
  deviceTier?: DeviceTier;
  ambientMoodState?: Record<string, number>;
}

export class ExperienceRouter {
  constructor(
    private readonly bus: SovereignBus,
    private readonly policyEngine: PolicyEngine
  ) {}

  public async resolve(input: ResolveExperienceInput): Promise<RoutingPolicyAppliedEvent> {
    const { tenant, traceId, sessionId } = input.command;
    const intent = input.command.payload.intent;

    const resolution = this.policyEngine.resolveExperience({
      tenant,
      intent,
      deviceTier: input.deviceTier,
      ambientMoodState: input.ambientMoodState,
    });

    const finalOutcome: ExperiencePolicyOutcome = resolution.outcome ?? {
      experienceFlow: "guided_ritual",
      revealHiddenPremium: false,
      animationTier: tenant.fallbackMode ? "static_luxury" : "assisted",
    };

    const eventPayload = {
      tenant,
      intent,
      traceId,
      sessionId,
      eventType: "routing.policy.applied",
      payload: {
        assignedFlow: finalOutcome.experienceFlow,
        animationTier: finalOutcome.animationTier,
        premiumRevealed: finalOutcome.revealHiddenPremium,
        policyId: resolution.policyId,
        resolutionReason:
          resolution.matched
            ? tenant.fallbackMode
              ? "fallback_forced"
              : "policy_matched"
            : "default_applied",
        prestigeMultiplier: finalOutcome.prestigeMultiplier,
      },
    };

    const event = createEvent(eventPayload);
    const parsedEvent = RoutingPolicyAppliedEventSchema.parse(event);

    await this.bus.events.publish(parsedEvent);

    // Faz 7: Eğer katsayı varsa UI için PricingMidasEngagedEvent fırlat!
    if (finalOutcome.prestigeMultiplier && (finalOutcome.prestigeMultiplier as number) > 1) {
      const dominantMood = intent.moodAffinity.length > 0 ? intent.moodAffinity[0] : "deep_relaxation";
      const surgeEvent = createEvent({
        tenant,
        intent,
        traceId,
        sessionId,
        eventType: "pricing.midas.engaged",
        payload: {
          prestigeMultiplier: finalOutcome.prestigeMultiplier,
          dominantMood,
          thresholdSurpassed: 0.40, 
        }
      });
      await this.bus.events.publish(surgeEvent);
    }

    return parsedEvent;
  }
}
