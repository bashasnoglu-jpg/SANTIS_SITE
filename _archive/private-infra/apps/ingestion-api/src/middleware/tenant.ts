import type { Request, Response, NextFunction } from 'express';

// ─── Tenant context augmentation ─────────────────────────────────────────────
// Attach tenantId to every request passing through this middleware.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenantId: string;
    }
  }
}

// ─── Allowlist (Phase 4 baseline) ────────────────────────────────────────────
// Phase 4: Allowlist-based validation. Expansion path:
//   → DB-backed tenant registry
//   → JWT claim extraction
//   → API-key → tenant mapping
//
// Şu an sadece 'santis' tenant'ı canonical.
// Yeni tenant onboarding: buraya ekle veya env var'dan oku.

const VALID_TENANTS: Set<string> = new Set(
  (process.env.VALID_TENANTS ?? 'santis').split(',').map((t) => t.trim()).filter(Boolean),
);

const DEFAULT_TENANT = 'santis';

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * resolveTenant
 *
 * Reads `x-tenant-id` header. Falls back to DEFAULT_TENANT.
 * If the resolved tenant is not in VALID_TENANTS, returns 403.
 *
 * Attach point: app.use(resolveTenant) — before any route that needs tenantId.
 */
export function resolveTenant(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const raw = req.headers['x-tenant-id'];
  const tenantId = Array.isArray(raw) ? raw[0] : (raw ?? DEFAULT_TENANT);

  if (!VALID_TENANTS.has(tenantId)) {
    res.status(403).json({
      error: 'ForbiddenTenant',
      message: `Unknown tenant: "${tenantId}". Contact platform support.`,
    });
    return;
  }

  req.tenantId = tenantId;
  next();
}

/**
 * requireTenant
 *
 * Stricter variant: header must be explicitly provided (no fallback).
 * Use on endpoints that must never mix tenant data.
 */
export function requireTenant(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const raw = req.headers['x-tenant-id'];
  const tenantId = Array.isArray(raw) ? raw[0] : raw;

  if (!tenantId) {
    res.status(400).json({
      error: 'MissingTenantHeader',
      message: 'x-tenant-id header is required for this endpoint.',
    });
    return;
  }

  if (!VALID_TENANTS.has(tenantId)) {
    res.status(403).json({
      error: 'ForbiddenTenant',
      message: `Unknown tenant: "${tenantId}".`,
    });
    return;
  }

  req.tenantId = tenantId;
  next();
}
