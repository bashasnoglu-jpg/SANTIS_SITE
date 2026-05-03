import { z } from "zod";

export const TechnicalDebtSeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export const TechnicalDebtSignalTypeSchema = z.enum([
  "workspace_script_missing",
  "forbidden_lockfile",
  "node_version_drift",
  "pnpm_version_drift",
  "dependency_drift",
  "bundle_size_regression",
  "security_advisory",
  "runtime_contract_violation",
]);

export const TechnicalDebtSignalSchema = z.object({
  id: z.string().min(1),
  source: z.enum(["ci", "docker", "local", "runtime"]),
  type: TechnicalDebtSignalTypeSchema,
  severity: TechnicalDebtSeveritySchema,
  title: z.string().min(1),
  detail: z.string().min(1),
  workspace: z.string().optional(),
  filePath: z.string().optional(),
  detectedAt: z.string().datetime(),
  euroRisk: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
  remediation: z.string().min(1),
});

export const TechnicalDebtSnapshotSchema = z.object({
  generatedAt: z.string().datetime(),
  totalSignals: z.number().int().nonnegative(),
  criticalSignals: z.number().int().nonnegative(),
  highSignals: z.number().int().nonnegative(),
  euroRiskTotal: z.number().nonnegative(),
  posture: z.enum(["sealed", "watch", "degraded", "breach"]),
  signals: z.array(TechnicalDebtSignalSchema),
});

export type TechnicalDebtSeverity = z.infer<typeof TechnicalDebtSeveritySchema>;
export type TechnicalDebtSignalType = z.infer<typeof TechnicalDebtSignalTypeSchema>;
export type TechnicalDebtSignal = z.infer<typeof TechnicalDebtSignalSchema>;
export type TechnicalDebtSnapshot = z.infer<typeof TechnicalDebtSnapshotSchema>;
