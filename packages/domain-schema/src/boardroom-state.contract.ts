import { z } from "zod";

export const ActionRecommendationSchema = z.object({
  id: z.string(),
  type: z.enum(["pricing_adjustment", "inventory_alert", "vip_service_alert", "manual_intervention"]),
  title: z.string(),
  description: z.string(),
  impactScore: z.number().min(0).max(1), // 0 to 1
  priority: z.enum(["low", "medium", "high", "critical"]),
  payload: z.record(z.any()),
  expiresAt: z.string().optional(),
  createdAt: z.string()
});

export type ActionRecommendation = z.infer<typeof ActionRecommendationSchema>;

export interface BoardroomState {
  metrics: {
    totalRevenue: number;
    scp: any;
  };
  activeActions: ActionRecommendation[];
  oracleIntelligence: {
    actionsResolved: number;
    lastOperatorAction: any;
    actionMemory: any[];
  };
}
