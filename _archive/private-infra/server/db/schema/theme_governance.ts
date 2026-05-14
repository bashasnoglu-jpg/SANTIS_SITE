import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  jsonb,
  boolean
} from 'drizzle-orm/pg-core';

export const themeVersions = pgTable('theme_versions', {
  id: serial('id').primaryKey(),
  versionHash: text('version_hash').notNull().unique(), // theme-manifest.json hash
  manifestPayload: jsonb('manifest_payload').notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  source: text('source').notNull(), // 'stitch-manual', 'stitch-sync', 'tenant-override' vb.
  notes: text('notes'), // deploy açıklaması / commit mesajı / operatör notu
  deployedAt: timestamp('deployed_at', { withTimezone: true }).defaultNow().notNull(),
  deployedBy: text('deployed_by').notNull()
});

export const themeAuditLog = pgTable('theme_audit_log', {
  id: serial('id').primaryKey(),
  versionId: integer('version_id').references(() => themeVersions.id),
  action: text('action').notNull(), // 'VALIDATE', 'ENFORCE_PASS', 'VIOLATION_DETECTED' vs.
  details: jsonb('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const tenantThemeOverride = pgTable('tenant_theme_override', {
  id: serial('id').primaryKey(),
  tenantId: text('tenant_id').notNull(), // Bilinçli olarak unique değil, override geçmişini tutuyoruz
  overridePayload: jsonb('override_payload').notNull(), // Örn: Sovereign-Gold yerine özel renk
  approvedBy: text('approved_by').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});
