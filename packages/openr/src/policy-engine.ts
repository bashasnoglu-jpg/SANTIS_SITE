import { z } from "zod";
import type {
  GuestIntent,
  GuestSegment,
  Locale,
  Mood,
  TenantContext,
} from "@santis/event-contracts";
import {
  AnimationModeSchema,
  ExperienceFlowSchema,
  GuestSegmentSchema,
  LocaleSchema,
  MoodSchema,
} from "@santis/event-contracts";

export const DeviceTierSchema = z.enum(["low", "mid", "high"]);
export type DeviceTier = z.infer<typeof DeviceTierSchema>;

export const ExperiencePolicyConditionsSchema = z.object({
  segmentIn: z.array(GuestSegmentSchema).default([]),
  localeIn: z.array(LocaleSchema).default([]),
  moodAffinityIn: z.array(MoodSchema).default([]),
  fallbackMode: z.boolean().optional(),
  premiumThresholdMin: z.number().min(0).max(100).optional(),
  premiumThresholdMax: z.number().min(0).max(100).optional(),
  hotelCodeIn: z.array(z.string().min(2).max(32)).default([]),
  activePolicyIncludes: z.array(z.string().min(1)).default([]),
  deviceTierIn: z.array(DeviceTierSchema).default([]),
});

export const ExperiencePolicyOutcomeSchema = z.object({
  experienceFlow: ExperienceFlowSchema,
  revealHiddenPremium: z.boolean().default(false),
  animationTier: AnimationModeSchema,
  prestigeMultiplier: z.number().min(1).optional(),
});

export const ExperiencePolicySchema = z.object({
  policyId: z.string().uuid(),
  tenantId: z.string().uuid(),
  enabled: z.boolean().default(true),
  priority: z.number().int().default(0),
  conditions: ExperiencePolicyConditionsSchema,
  outcome: ExperiencePolicyOutcomeSchema,
});

export type ExperiencePolicy = z.infer<typeof ExperiencePolicySchema>;
export type ExperiencePolicyConditions = z.infer<typeof ExperiencePolicyConditionsSchema>;
export type ExperiencePolicyOutcome = z.infer<typeof ExperiencePolicyOutcomeSchema>;

export interface PolicyResolutionInput {
  tenant: TenantContext;
  intent: GuestIntent;
  deviceTier?: DeviceTier;
  ambientMoodState?: Record<string, number>;
}

export interface PolicyResolutionResult {
  matched: boolean;
  policyId?: string;
  outcome?: ExperiencePolicyOutcome;
  reason: "policy_matched" | "no_policy_matched";
}

export class PolicyEngine {
  private readonly policies: ExperiencePolicy[];

  constructor(initialPolicies: unknown) {
    const parsedPolicies = z.array(ExperiencePolicySchema).parse(initialPolicies);

    this.policies = parsedPolicies.sort((a, b) => b.priority - a.priority);
  }

  public resolveExperience(input: PolicyResolutionInput): PolicyResolutionResult {
    for (const policy of this.policies) {
      if (!policy.enabled) continue;
      if (policy.tenantId !== input.tenant.hotelId) continue;

      if (this.evaluateConditions(policy.conditions, input)) {
        // Clone outcome to avoid mutating cached policies
        const outcome = { ...policy.outcome };

        // Faz 7: Kuantum Çarpanı (Midas Surge) Entegrasyonu
        if (input.ambientMoodState && input.intent.moodAffinity.length > 0) {
          const midasMultiplier = this.evaluateMidasSurge(input.ambientMoodState, input.intent.moodAffinity);
          if (midasMultiplier > 1) {
            outcome.prestigeMultiplier = midasMultiplier;
          }
        }

        return {
          matched: true,
          policyId: policy.policyId,
          outcome,
          reason: "policy_matched",
        };
      }
    }

    return {
      matched: false,
      reason: "no_policy_matched",
    };
  }

  /**
   * Midas Surge Algorithm: ambientMoodState'deki duygu yoğunluğunu ölçer.
   * Eğer misafirin aradığı duygular %40 üzerindeyse 1.45 katsayısı uygular.
   */
  private evaluateMidasSurge(ambientMoodState: Record<string, number>, requestedMoods: Mood[]): number {
    const totalEvents = Object.values(ambientMoodState).reduce((acc, val) => acc + val, 0);
    if (totalEvents === 0) return 1.0;

    for (const mood of requestedMoods) {
      const moodEvents = ambientMoodState[mood] || 0;
      const density = moodEvents / totalEvents;

      // Eşik %40'ı aşıyorsa Midas Katsayısını dön
      if (density > 0.40) {
        return 1.45;
      }
    }
    
    return 1.0;
  }

  private evaluateConditions(
    conditions: ExperiencePolicyConditions,
    input: PolicyResolutionInput
  ): boolean {
    const { tenant, intent, deviceTier } = input;

    if (
      conditions.segmentIn.length > 0 &&
      !conditions.segmentIn.includes(intent.segment)
    ) {
      return false;
    }

    if (
      conditions.localeIn.length > 0 &&
      !conditions.localeIn.includes(tenant.locale as any) // Type issue fallback depending on version
    ) {
      return false;
    }

    if (
      conditions.hotelCodeIn.length > 0 &&
      !conditions.hotelCodeIn.includes(tenant.hotelCode)
    ) {
      return false;
    }

    if (
      conditions.fallbackMode !== undefined &&
      conditions.fallbackMode !== tenant.fallbackMode
    ) {
      return false;
    }

    if (
      conditions.premiumThresholdMin !== undefined &&
      intent.premiumThreshold < conditions.premiumThresholdMin
    ) {
      return false;
    }

    if (
      conditions.premiumThresholdMax !== undefined &&
      intent.premiumThreshold > conditions.premiumThresholdMax
    ) {
      return false;
    }

    if (conditions.moodAffinityIn.length > 0) {
      const hasMatchingMood = intent.moodAffinity.some((mood: Mood) =>
        conditions.moodAffinityIn.includes(mood)
      );

      if (!hasMatchingMood) {
        return false;
      }
    }

    if (conditions.activePolicyIncludes.length > 0) {
      const hasRequiredPolicy = conditions.activePolicyIncludes.every((policy) =>
        tenant.activePolicies.includes(policy)
      );

      if (!hasRequiredPolicy) {
        return false;
      }
    }

    if (
      conditions.deviceTierIn.length > 0 &&
      (!deviceTier || !conditions.deviceTierIn.includes(deviceTier))
    ) {
      return false;
    }

    return true;
  }
}
