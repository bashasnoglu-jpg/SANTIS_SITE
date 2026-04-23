import { db } from '../../db';
import { eq, desc, and } from 'drizzle-orm';
import {
  themeVersions,
  themeAuditLog,
  tenantThemeOverride
} from '../../db/schema/theme_governance';

export async function findActiveThemeVersion() {
  return db.query.themeVersions.findFirst({
    where: eq(themeVersions.isActive, true)
  });
}

export async function findThemeVersionByHash(versionHash: string) {
  return db.query.themeVersions.findFirst({
    where: eq(themeVersions.versionHash, versionHash)
  });
}

export async function findThemeVersionById(id: number) {
  return db.query.themeVersions.findFirst({
    where: eq(themeVersions.id, id)
  });
}

export async function listThemeVersions(params?: { limit?: number }) {
  return db.query.themeVersions.findMany({
    orderBy: [desc(themeVersions.deployedAt)],
    limit: params?.limit
  });
}

export async function createThemeVersion(input: {
  versionHash: string;
  manifestPayload: unknown;
  deployedBy: string;
  source: string;
  notes?: string | null;
  isActive?: boolean;
}) {
  const [row] = await db.insert(themeVersions).values({
    versionHash: input.versionHash,
    manifestPayload: input.manifestPayload,
    deployedBy: input.deployedBy,
    source: input.source,
    notes: input.notes ?? null,
    isActive: input.isActive ?? false
  }).returning();

  return row;
}

export async function deactivateAllThemeVersions() {
  await db.update(themeVersions).set({ isActive: false });
}

export async function activateThemeVersionById(id: number) {
  const [row] = await db.update(themeVersions)
    .set({ isActive: true })
    .where(eq(themeVersions.id, id))
    .returning();

  return row;
}

export async function insertThemeAuditLog(input: {
  versionId?: number | null;
  action: string;
  details?: unknown;
}) {
  const [row] = await db.insert(themeAuditLog).values({
    versionId: input.versionId ?? null,
    action: input.action,
    details: input.details ?? null
  }).returning();

  return row;
}

export async function listThemeAuditLog(params?: {
  limit?: number;
  versionId?: number;
}) {
  const queryLimit = params?.limit ?? 100;
  
  const conditions = [];
  if (params?.versionId) {
    conditions.push(eq(themeAuditLog.versionId, params.versionId));
  }

  const whereClause = conditions.length > 0 
    ? (conditions.length === 1 ? conditions[0] : and(...conditions))
    : undefined;

  return db.query.themeAuditLog.findMany({
    where: whereClause,
    orderBy: [desc(themeAuditLog.createdAt)],
    limit: queryLimit
  });
}

export async function findActiveTenantOverride(tenantId: string) {
  return db.query.tenantThemeOverride.findFirst({
    where: and(
      eq(tenantThemeOverride.tenantId, tenantId),
      eq(tenantThemeOverride.isActive, true)
    ),
    orderBy: [desc(tenantThemeOverride.createdAt)]
  });
}

export async function listTenantOverrides(tenantId: string) {
  return db.query.tenantThemeOverride.findMany({
    where: eq(tenantThemeOverride.tenantId, tenantId),
    orderBy: [desc(tenantThemeOverride.createdAt)]
  });
}

export async function deactivateTenantOverrides(tenantId: string) {
  await db.update(tenantThemeOverride)
    .set({ isActive: false })
    .where(eq(tenantThemeOverride.tenantId, tenantId));
}

export async function createTenantOverride(input: {
  tenantId: string;
  overridePayload: unknown;
  approvedBy: string;
  isActive?: boolean;
}) {
  const [row] = await db.insert(tenantThemeOverride).values({
    tenantId: input.tenantId,
    overridePayload: input.overridePayload,
    approvedBy: input.approvedBy,
    isActive: input.isActive ?? true
  }).returning();

  return row;
}
