import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  findActiveThemeVersion,
  findThemeVersionByHash,
  createThemeVersion,
  deactivateAllThemeVersions,
  activateThemeVersionById,
  insertThemeAuditLog,
  findActiveTenantOverride,
  deactivateTenantOverrides,
  createTenantOverride,
  listThemeVersions,
  listThemeAuditLog
} from './theme-governance.repository';
import {
  getCache,
  setCache,
  deleteCache,
  clearByPrefix,
  buildResolvedThemeCacheKey
} from './theme-governance.cache';
import {
  RuntimeThemeManifestSchema,
  TenantThemeOverrideSchema,
  AuditActions
} from './theme-governance.schemas';
import { resolveRuntimeTheme } from './theme-resolver';

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readLocalManifest() {
  const manifestPath = path.resolve(process.cwd(), 'packages/design-system/theme-manifest.json');
  const raw = fs.readFileSync(manifestPath, 'utf8');
  const parsed = JSON.parse(raw);
  return {
    raw,
    parsed: RuntimeThemeManifestSchema.parse(parsed)
  };
}

export async function syncManifestToDatabase(params: {
  deployedBy: string;
  source: string;
  notes?: string;
}) {
  const { raw, parsed } = readLocalManifest();
  const versionHash = sha256(raw);

  const existing = await findThemeVersionByHash(versionHash);
  if (existing) {
    await insertThemeAuditLog({
      versionId: existing.id,
      action: AuditActions.SYNC_SKIPPED_ALREADY_EXISTS,
      details: { versionHash }
    });

    return existing;
  }

  const row = await createThemeVersion({
    versionHash,
    manifestPayload: parsed,
    deployedBy: params.deployedBy,
    source: params.source,
    notes: params.notes ?? null,
    isActive: false
  });

  await insertThemeAuditLog({
    versionId: row.id,
    action: AuditActions.SYNC_CREATED,
    details: { versionHash, source: params.source }
  });

  return row;
}

export async function activateThemeVersion(versionId: number, actor: string) {
  await deactivateAllThemeVersions();
  const active = await activateThemeVersionById(versionId);

  await insertThemeAuditLog({
    versionId: active.id,
    action: AuditActions.ACTIVATED,
    details: { actor }
  });

  deleteCache('active-theme');
  clearByPrefix('resolved-theme:');

  return active;
}

export async function resolveThemeForTenant(tenantId?: string | null) {
  const cacheKey = buildResolvedThemeCacheKey(tenantId);
  const cached = getCache(cacheKey);
  if (cached) return cached;

  let active = getCache('active-theme') as Awaited<ReturnType<typeof findActiveThemeVersion>>;
  if (!active) {
    active = await findActiveThemeVersion();
    if (!active) {
      throw new Error('No active theme version found');
    }
    setCache('active-theme', active);
  }

  const baseManifest = RuntimeThemeManifestSchema.parse(active.manifestPayload);

  let overridePayload = null;
  if (tenantId) {
    const activeOverride = await findActiveTenantOverride(tenantId);
    if (activeOverride) {
      overridePayload = TenantThemeOverrideSchema.parse(activeOverride.overridePayload);
    }
  }

  const resolved = resolveRuntimeTheme({
    baseManifest,
    tenantOverride: overridePayload
  });

  setCache(cacheKey, resolved);

  return resolved;
}

export async function createTenantThemeOverrideVersion(input: {
  tenantId: string;
  approvedBy: string;
  overridePayload: unknown;
}) {
  const parsedOverride = TenantThemeOverrideSchema.parse(input.overridePayload);

  await deactivateTenantOverrides(input.tenantId);

  const row = await createTenantOverride({
    tenantId: input.tenantId,
    approvedBy: input.approvedBy,
    overridePayload: parsedOverride,
    isActive: true
  });

  await insertThemeAuditLog({
    action: AuditActions.TENANT_OVERRIDE_CREATED,
    details: {
      tenantId: input.tenantId,
      overrideId: row.id,
      approvedBy: input.approvedBy
    }
  });

  deleteCache(buildResolvedThemeCacheKey(input.tenantId));

  return row;
}

export async function logEnforcePass(versionHash: string) {
  const existing = await findThemeVersionByHash(versionHash);
  if (existing) {
    await insertThemeAuditLog({
      versionId: existing.id,
      action: AuditActions.ENFORCE_PASS
    });
  } else {
    await insertThemeAuditLog({
      versionId: null,
      action: AuditActions.ENFORCE_PASS,
      details: { versionHash }
    });
  }
}

export async function logViolation(versionHash: string, details: unknown) {
  const existing = await findThemeVersionByHash(versionHash);
  await insertThemeAuditLog({
    versionId: existing ? existing.id : null,
    action: AuditActions.VIOLATION_DETECTED,
    details: { versionHash, ...((typeof details === 'object' && details !== null) ? details : { raw: details }) }
  });
}

export async function listThemeVersionsForRead(params?: { limit?: number }) {
  const versions = await listThemeVersions(params);
  return versions.map(v => ({
    id: v.id,
    versionHash: v.versionHash,
    isActive: v.isActive,
    source: v.source,
    notes: v.notes,
    deployedAt: v.deployedAt,
    deployedBy: v.deployedBy
  }));
}

export async function listThemeAuditForRead(params?: { limit?: number; versionId?: number }) {
  const logs = await listThemeAuditLog(params);
  return logs.map(l => ({
    id: l.id,
    versionId: l.versionId,
    action: l.action,
    details: l.details,
    createdAt: l.createdAt
  }));
}
