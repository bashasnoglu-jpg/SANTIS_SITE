import { TenantSchema } from "@santis-core/domain-contracts/tenant.contract";

export const DefaultSantisTenant = TenantSchema.parse({
  tenantId: "00000000-0000-4000-8000-000000000001",
  slug: "santis-club-default",
  name: "Santis Club",
  isDefault: true,
  isActive: true,
  economics: { baseCurrency: "EUR", commissionModel: "STANDARD", taxRate: 0.21 },
  guardPolicy: { fatalEuroDebtThreshold: 5000, maxVelocityEuroPerDay: 500, allowBoardroomOverride: true },
  features: { intentEngineEnabled: true, ritualStackAlgorithm: true },
});
