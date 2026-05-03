import { z } from 'zod';

export const RitualDriftSchema = z.object({
  id: z.string().min(1),
  ts: z.number().int().positive(),
  ritualPhase: z.enum(['threshold', 'preparation', 'handoff', 'embodiment', 'closure']),
  driftType: z.enum(['pacing', 'sensory_alignment', 'staff_timing', 'surface_visibility', 'safety', 'invariant']),
  severity: z.number().min(0).max(1),
  guestVisible: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({})
});

export type RitualDrift = z.infer<typeof RitualDriftSchema>;

export const RitualResponseSchema = z.object({
  action: z.enum(['absorb_into_pacing', 'subtle_realignment', 'explicit_hold', 'flow_freeze']),
  reason: z.string(),
  preserveSilence: z.boolean(),
  allowedAdjustments: z.array(z.enum(['light_crossfade', 'sound_crossfade', 'temperature_step', 'surface_evaporation', 'staff_pause', 'truth_packet_refresh'])),
  disallowedAdjustments: z.array(z.enum(['announcement', 'apology_script', 'dramatic_cue', 'performative_gesture', 'hidden_inference'])),
  metadata: z.record(z.unknown()).default({})
});

export type RitualResponse = z.infer<typeof RitualResponseSchema>;

export function evaluateRitualDrift(input: unknown): RitualResponse {
  const parsed = RitualDriftSchema.safeParse(input);

  if (!parsed.success) {
    return {
      action: 'explicit_hold',
      reason: 'Ritual drift payload failed validation; use explicit low-drama hold.',
      preserveSilence: false,
      allowedAdjustments: ['staff_pause', 'truth_packet_refresh'],
      disallowedAdjustments: ['announcement', 'apology_script', 'dramatic_cue', 'performative_gesture', 'hidden_inference'],
      metadata: { issues: parsed.error.issues }
    };
  }

  const drift = parsed.data;

  if (drift.driftType === 'safety' || drift.driftType === 'invariant' || drift.severity >= 0.85) {
    return {
      action: 'flow_freeze',
      reason: 'Safety, invariant, or severe drift cannot be absorbed into ritual pacing.',
      preserveSilence: false,
      allowedAdjustments: ['staff_pause', 'truth_packet_refresh'],
      disallowedAdjustments: ['announcement', 'apology_script', 'dramatic_cue', 'performative_gesture', 'hidden_inference'],
      metadata: { driftType: drift.driftType, severity: drift.severity }
    };
  }

  if (!drift.guestVisible && drift.severity < 0.35) {
    return {
      action: 'absorb_into_pacing',
      reason: 'Minor invisible drift should be absorbed into ritual tempo without drawing attention.',
      preserveSilence: true,
      allowedAdjustments: ['light_crossfade', 'sound_crossfade', 'surface_evaporation'],
      disallowedAdjustments: ['announcement', 'apology_script', 'dramatic_cue', 'performative_gesture', 'hidden_inference'],
      metadata: { ritualPhase: drift.ritualPhase }
    };
  }

  return {
    action: 'subtle_realignment',
    reason: 'Recoverable ritual drift should be corrected through low-drama sensory and timing realignment.',
    preserveSilence: true,
    allowedAdjustments: ['light_crossfade', 'sound_crossfade', 'temperature_step', 'staff_pause', 'truth_packet_refresh'],
    disallowedAdjustments: ['announcement', 'apology_script', 'dramatic_cue', 'performative_gesture', 'hidden_inference'],
    metadata: { ritualPhase: drift.ritualPhase, severity: drift.severity }
  };
}
