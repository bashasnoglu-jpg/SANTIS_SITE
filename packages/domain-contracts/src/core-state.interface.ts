import type { TenantContract } from "./tenant.contract.js";

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
