import { z } from "zod";

export const ActionRecommendationSchema = z.object({
  id: z.string(),
  type: z.enum(["pricing_adjustment", "reduce_choice", "concierge_handoff", "risk_review"]),
  title: z.string(),
  description: z.string(),
  impactScore: z.number().min(0).max(1), // 0 to 1
  priority: z.enum(["low", "medium", "high", "critical"]),
  expiresAt: z.string(),
  createdAt: z.string(),
  payload: z.record(z.unknown()).optional()
});

export type ActionRecommendation = z.infer<typeof ActionRecommendationSchema>;

export interface BoardroomState {
  metrics: {
    totalRevenue: number;
    scp: Record<string, unknown>;
  };
  activeActions: ActionRecommendation[];
  oracleIntelligence: {
    actionsResolved: number;
    lastOperatorAction: Record<string, unknown> | null;
    actionMemory: Record<string, unknown>[];
  };
}
