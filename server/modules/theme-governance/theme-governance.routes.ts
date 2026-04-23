import { Router, Request, Response, NextFunction } from 'express';
import {
  syncManifestToDatabase,
  activateThemeVersion,
  resolveThemeForTenant,
  createTenantThemeOverrideVersion
} from './theme-governance.service';
import { listThemeVersions } from './theme-governance.repository';

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

router.get('/versions', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const versions = await listThemeVersions();
    res.json({ ok: true, data: versions });
  } catch (err) {
    next(err);
  }
});

router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await syncManifestToDatabase({
      deployedBy: req.body.deployedBy,
      source: req.body.source,
      notes: req.body.notes
    });

    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
});

router.post('/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await activateThemeVersion(req.body.versionId, req.body.actor);
    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
});

router.post('/override', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await createTenantThemeOverrideVersion({
      tenantId: req.body.tenantId,
      approvedBy: req.body.approvedBy,
      overridePayload: req.body.overridePayload
    });

    res.json({ ok: true, data: row });
  } catch (err) {
    next(err);
  }
});

export default router;
