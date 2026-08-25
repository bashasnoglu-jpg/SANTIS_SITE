import type { CoreState, SovereignContext } from "@santis-core/domain-contracts/core-state.interface";

export const createCoreState = (): CoreState => {
  const activeTenants = new Map<string, SovereignContext>();

  return {
    activeTenants,
    suspendTenant: (tenantId: string, reason: string) => {
      const ctx = activeTenants.get(tenantId);
      if (!ctx) return;
      console.warn(`[CORE] Tenant suspended: ${tenantId} | ${reason}`);
      activeTenants.delete(tenantId);
    },
  };
};
