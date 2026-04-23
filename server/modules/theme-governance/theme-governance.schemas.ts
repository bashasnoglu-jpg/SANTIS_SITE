import { z } from 'zod';

const TokenValue = z.string().min(1);

export const RuntimeThemeManifestSchema = z.object({
  meta: z.record(z.unknown()),
  colors: z.record(TokenValue).optional(),
  fontFamily: z.record(z.array(z.string())).optional(),
  fontSize: z.record(TokenValue).optional(),
  spacing: z.record(TokenValue).optional(),
  radius: z.record(TokenValue).optional(),
  shadow: z.record(TokenValue).optional(),
  easing: z.record(TokenValue).optional()
});

export const TenantThemeOverrideSchema = RuntimeThemeManifestSchema.pick({
  colors: true,
  fontFamily: true,
  fontSize: true,
  spacing: true,
  radius: true,
  shadow: true,
  easing: true
}).partial();

export const SyncThemeManifestSchema = z.object({
  deployedBy: z.string().min(1),
  source: z.string().min(1),
  notes: z.string().optional()
});

export const ActivateThemeVersionSchema = z.object({
  versionId: z.number().int().positive(),
  actor: z.string().min(1)
});

export const CreateTenantOverrideSchema = z.object({
  tenantId: z.string().min(1),
  approvedBy: z.string().min(1),
  overridePayload: TenantThemeOverrideSchema
});

// Type exports
export type RuntimeThemeManifest = z.infer<typeof RuntimeThemeManifestSchema>;
export type TenantThemeOverrideInput = z.infer<typeof TenantThemeOverrideSchema>;
export type SyncThemeManifestInput = z.infer<typeof SyncThemeManifestSchema>;
export type ActivateThemeVersionInput = z.infer<typeof ActivateThemeVersionSchema>;
export type CreateTenantOverrideInput = z.infer<typeof CreateTenantOverrideSchema>;

export const AuditActions = {
  SYNC_CREATED: 'SYNC_CREATED',
  SYNC_SKIPPED_ALREADY_EXISTS: 'SYNC_SKIPPED_ALREADY_EXISTS',
  ACTIVATED: 'ACTIVATED',
  ENFORCE_PASS: 'ENFORCE_PASS',
  VIOLATION_DETECTED: 'VIOLATION_DETECTED',
  TENANT_OVERRIDE_CREATED: 'TENANT_OVERRIDE_CREATED',
  SEED_INITIAL_THEME: 'SEED_INITIAL_THEME'
} as const;

export const ListThemeAuditQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  versionId: z.coerce.number().int().positive().optional()
});

export const ListThemeVersionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional()
});

export const ThemeGovernanceActorSchema = z.object({
  actor: z.string().min(1),
  role: z.enum(['admin', 'system', 'operator']).optional()
});
