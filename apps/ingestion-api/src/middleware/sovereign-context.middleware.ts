import { Request, Response, NextFunction } from "express";
import { createCoreState } from "@santis/domain-schema/src/core-state.interface";

const coreState = createCoreState();

export function requireSovereignContext(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.headers["x-santis-tenant-id"] as string | undefined;

  if (!tenantId) {
    return res.status(400).json({ error: "FATAL: Sovereign Context Required" });
  }

  const ctx = coreState.activeTenants.get(tenantId);

  if (!ctx) {
    return res.status(404).json({ error: "FATAL: Tenant Reality Not Found" });
  }

  (req as any).sovereignContext = {
    tenant: ctx.tenant,
    requestId: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  next();
}
