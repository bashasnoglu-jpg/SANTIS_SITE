import { Router, Request, Response, NextFunction } from 'express';
import {
  syncManifestToDatabase,
  activateThemeVersion,
  resolveThemeForTenant,
  createTenantThemeOverrideVersion,
  listThemeVersionsForRead,
  listThemeAuditForRead
} from './theme-governance.service';
import { requireThemeWriteAccess } from './theme-governance.guard';
import { ListThemeVersionsQuerySchema, ListThemeAuditQuerySchema } from './theme-governance.schemas';

const router = Router();

router.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const theme = await resolveThemeForTenant(null);
    res.json({ ok: true, data: theme });
  } catch (err) {
    next(err);
  }
});

router.get('/resolved', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = typeof req.query.tenantId === 'string' ? req.query.tenantId : null;
    const theme = await resolveThemeForTenant(tenantId);
    res.json({ ok: true, data: theme });
  } catch (err) {
    next(err);
  }
});

router.get('/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = ListThemeVersionsQuerySchema.parse(req.query);
    const versions = await listThemeVersionsForRead(query);
    res.json({ ok: true, data: versions });
  } catch (err) {
    next(err);
  }
});

router.get('/audit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = ListThemeAuditQuerySchema.parse(req.query);
    const logs = await listThemeAuditForRead(query);
    res.json({ ok: true, data: logs });
  } catch (err) {
    next(err);
  }
});

router.post('/sync', requireThemeWriteAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await syncManifestToDatabase({
      deployedBy: (req as any).themeActor,
      source: req.body.source,
      notes: req.body.notes
    });

    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
});

router.post('/activate', requireThemeWriteAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await activateThemeVersion(req.body.versionId, (req as any).themeActor);
    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
});

router.post('/override', requireThemeWriteAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await createTenantThemeOverrideVersion({
      tenantId: req.body.tenantId,
      approvedBy: (req as any).themeActor,
      overridePayload: req.body.overridePayload
    });

    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
});

export default router;
