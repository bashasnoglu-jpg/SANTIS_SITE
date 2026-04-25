import { z } from "zod";

export type SignalType = "stress_index" | "hesitation_index" | "abandon_risk" | "therapist_stress";

export const SafeSignal = z.object({
  signalType: z.enum([
    "stress_index",
    "hesitation_index",
    "abandon_risk",
    "therapist_stress",
  ]).optional(),
});

export const signalTokenMap: Record<SignalType, string> = {
  stress_index: "bg-sovereign-signal-stress text-white",
  hesitation_index: "bg-sovereign-signal-hesitation text-black",
  abandon_risk: "bg-sovereign-signal-abandon text-white",
  therapist_stress: "bg-sovereign-signal-therapist text-white",
};

export function resolveSignalClass(type: SignalType) {
  return signalTokenMap[type] || "bg-sovereign-surface text-sovereign-text";
}
