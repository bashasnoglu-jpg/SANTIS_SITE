import { z } from "zod";

export const TenantEconomicsSchema = z.object({
  baseCurrency: z.literal("EUR"),
  commissionModel: z.enum(["STANDARD", "TIERED", "CUSTOM"]),
  taxRate: z.number().min(0).max(1),
});

export const TenantGuardSchema = z.object({
  fatalEuroDebtThreshold: z.number().min(1000).default(5000),
  maxVelocityEuroPerDay: z.number().min(100).default(500),
  allowBoardroomOverride: z.boolean().default(true),
});

export const TenantFeaturesSchema = z.object({
  intentEngineEnabled: z.boolean().default(false),
  ritualStackAlgorithm: z.boolean().default(false),
});

export const TenantSchema = z.object({
  tenantId: z.string().uuid(),
  slug: z.string().min(2),
  name: z.string().min(1),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  economics: TenantEconomicsSchema,
  guardPolicy: TenantGuardSchema,
  features: TenantFeaturesSchema,
});

export const DefaultSantisTenant = TenantSchema.parse({
  tenantId: "00000000-0000-4000-8000-000000000001",
  slug: "santis-club-default",
  name: "Santis Club",
  isDefault: true,
  isActive: true,
  economics: {
    baseCurrency: "EUR",
    commissionModel: "STANDARD",
    taxRate: 0.21,
  },
  guardPolicy: {
    fatalEuroDebtThreshold: 5000,
    maxVelocityEuroPerDay: 500,
    allowBoardroomOverride: true,
  },
  features: {
    intentEngineEnabled: true,
    ritualStackAlgorithm: true,
  },
});

export type TenantEconomics = z.infer<typeof TenantEconomicsSchema>;
export type TenantGuard = z.infer<typeof TenantGuardSchema>;
export type TenantFeatures = z.infer<typeof TenantFeaturesSchema>;
export type TenantContract = z.infer<typeof TenantSchema>;
