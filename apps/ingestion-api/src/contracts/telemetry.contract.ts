import { z } from 'zod';

/**
 * PHASE K-4: PRODUCER VALIDATION SHIELD
 * İstemciden (Public) gelen ham telemetri paketleri bu acımasız kalkanlardan geçer.
 * Tanımlanmayan (ekstra) alanlar otomatik olarak soyulur (strip).
 * Bozuk/hatalı alanlar anında reddedilir.
 */

export const RegisterTelemetrySchema = z.object({
  page: z.string().max(255).default('/spa/unknown'),
  status: z.enum(['active', 'idle']).default('active')
}).strict(); // strict() ensures NO extra fields like IP spoofing are allowed

export const UpdateTelemetrySchema = z.object({
  page: z.string().max(255).optional(),
  status: z.enum(['active', 'idle']).optional()
}).strict(); // strict() ensures NO extra fields

// PHASE K-3B: Flight Risk Radar Shield
export const TelemetryAnomalySchema = z.object({
  anomalyType: z.enum(['exit_intent', 'rage_scroll', 'idle']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  riskScore: z.number().min(0).max(100)
}).strict();

// PHASE K-6: Sovereign Financial Pulse (The Wealth Contract)
export const FinancialVitalsSchema = z.object({
  dailyRevenue: z.number().int().nonnegative("Ciro negatif olamaz"),
  activeSessions: z.number().int().nonnegative("Seans sayısı negatif olamaz"),
  capacityPercent: z.number().min(0).max(100),
  conversionRate: z.number().min(0).max(100)
}).strict();
