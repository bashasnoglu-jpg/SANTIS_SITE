import type { TenantContract } from "./tenant.contract";

export interface SovereignContext {
  tenant: TenantContract;
  requestId: string;
  timestamp: number;
}

export type SovereignAction<TPayload, TResult> = (
  ctx: SovereignContext,
  payload: TPayload
) => Promise<TResult>;

export interface CoreState {
  activeTenants: Map<string, SovereignContext>;
  suspendTenant: (tenantId: string, reason: string) => void;
}

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
