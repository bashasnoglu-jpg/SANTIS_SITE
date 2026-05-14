import type { Request, Response, NextFunction } from 'express';

const WRITE_ROLES = new Set(['admin', 'system']);

export function requireThemeWriteAccess(req: Request, res: Response, next: NextFunction) {
  const actor = req.header('x-theme-actor');
  const role = req.header('x-theme-role');

  if (!actor || !role || !WRITE_ROLES.has(role)) {
    return res.status(403).json({
      ok: false,
      error: 'THEME_GOVERNANCE_WRITE_FORBIDDEN'
    });
  }

  (req as any).themeActor = actor;
  (req as any).themeRole = role;
  next();
}
