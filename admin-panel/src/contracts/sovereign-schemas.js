import { z } from 'zod';

/**
 * Santis OS - Sovereign Data Contracts
 * Truth Layer'dan gelen verilerin çalışma zamanı (runtime) doğrulamalarını içerir.
 */

// 1. God's Eye Radar Sözleşmesi
export const RadarEventSchema = z.object({
  action: z.string().min(3, "Aksiyon açıklaması çok kısa"),
  ftrIndex: z.number().min(0).max(1.5).optional(), 
  timestamp: z.string(),
  systemTime: z.string().optional()
});

// 2. Revenue Intelligence (Finansal Veri) Sözleşmesi
export const FinancialDataSchema = z.object({
  liveRevenue: z.number().nonnegative("Ciro negatif olamaz"),
  activeSessions: z.number().int().nonnegative("Seans sayısı tam sayı ve pozitif olmalı"),
  pendingCommissions: z.number().optional().default(0)
});

// 3. Strategist's Journal (AI Karar) Sözleşmesi
export const PricingDecisionSchema = z.object({
  multiplier: z.number().positive("Çarpan pozitif olmalı"),
  reason: z.string().min(5, "Açıklanabilirlik gerekçesi (reason) eksik veya yetersiz").nullable()
});

// 4. Predictive Booking (Öngörü) Sözleşmesi
export const PredictionEventSchema = z.object({
  target: z.string(),
  probability: z.string(),
  insight: z.string(),
  timestamp: z.string()
});

export const StrategyReportSchema = z.object({
  reportId: z.string(),
  period: z.string(),
  executiveSummary: z.string().min(10, "Yönetici özeti yetersiz"),
  keyInsights: z.array(z.string()).min(1, "En az bir temel içgörü gereklidir"),
  recommendedAction: z.string(),
  confidenceScore: z.number().min(0).max(100)
});

export const ArchiveLogSchema = z.object({
  id: z.string(),
  type: z.enum(['STRATEGY_EXECUTION', 'CRITICAL_ALERT', 'REALITY_LOCK']),
  description: z.string(),
  impact: z.string(),
  timestamp: z.string()
});

// 7. Sovereign Simulator Sözleşmesi
export const SimulationResultSchema = z.object({
  projectedRevenue: z.number().positive("Tahmini ciro pozitif olmalıdır"),
  projectedFtr: z.number().min(0).max(1.5),
  insight: z.string().min(10, "Simülasyon içgörüsü detaylı olmalıdır"),
  timestamp: z.string()
});

// 8. Active Connections (God Mode) Sözleşmesi
export const ActiveConnectionSchema = z.object({
  id: z.string(),
  page: z.string(),
  status: z.enum(['active', 'idle']),
  ipMask: z.string(),
  lastSeen: z.string().datetime()
});

export const ActiveConnectionsUpdateSchema = z.object({
  connections: z.array(ActiveConnectionSchema),
  timestamp: z.string().datetime()
});

// 9. Flight Risk Radar Sözleşmesi
export const FlightRiskAnomalySchema = z.object({
  id: z.string(),
  type: z.enum(['code_1006', 'soft_risk', 'rapid_scroll']),
  user: z.string(),
  detail: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  time: z.string().datetime()
});

export const FlightRiskUpdateSchema = z.object({
  anomalies: z.array(FlightRiskAnomalySchema),
  timestamp: z.string().datetime()
});

// 10. Sovereign Command Palette Sözleşmesi
export const CommandExecutionSchema = z.object({
  commandId: z.string(),
  timestamp: z.string().datetime(),
  authContext: z.object({
    actorId: z.string().optional(),
    role: z.string().optional(),
    source: z.literal('sovereign-command-palette')
  })
});
