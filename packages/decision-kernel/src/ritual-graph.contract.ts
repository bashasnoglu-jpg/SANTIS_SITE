import { z } from "zod";
import { BiologicalTargetVectorSchema } from "@santis/domain-schema/src/intent.contract";

export const ContraindicationSchema = z.enum([
  "HIGH_BLOOD_PRESSURE",
  "PREGNANCY",
  "ACUTE_INFLAMMATION",
  "RECENT_SURGERY",
  "CARDIOVASCULAR_RISK",
  "SKIN_SENSITIVITY",
]);

export const RitualNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  vectorDelta: BiologicalTargetVectorSchema,
  baseCost: z.number().nonnegative(),
  durationMinutes: z.number().int().positive(),
  loadScore: z.number().min(0).max(1),
});

export const RitualEdgeSchema = z.object({
  fromNodeId: z.string().min(1),
  toNodeId: z.string().min(1),
  constraints: z.object({
    minRestMinutes: z.number().int().min(0),
    maxSequentialLoad: z.number().min(0).max(2),
    contraindications: z.array(ContraindicationSchema).default([]),
  }),
  synergyMultiplier: z.number().min(0.5).max(1.75).default(1),
});

export const RitualGraphSchema = z.object({
  tenantId: z.string().uuid(),
  nodes: z.array(RitualNodeSchema).min(1),
  edges: z.array(RitualEdgeSchema),
});

export type Contraindication = z.infer<typeof ContraindicationSchema>;
export type RitualNode = z.infer<typeof RitualNodeSchema>;
export type RitualEdge = z.infer<typeof RitualEdgeSchema>;
export type RitualGraph = z.infer<typeof RitualGraphSchema>;
