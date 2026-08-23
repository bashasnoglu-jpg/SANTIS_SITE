import { z } from "zod";

export const OperatorRoleSchema = z.enum([
  "admin",
  "boardroom",
  "concierge",
  "manager",
  "owner",
  "system"
]);

export const OperatorCapabilitySchema = z.enum([
  "boardroom:read",
  "boardroom:write",
  "audit-log:read",
  "audit-log:write",
  "tenant:read",
  "tenant:write"
]);

export const SessionOperatorSchema = z.object({
  operatorId: z.string().min(1),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  roles: z.array(OperatorRoleSchema),
  capabilities: z.array(OperatorCapabilitySchema).default([])
});

export const SessionTenantScopeSchema = z.object({
  tenantId: z.string().uuid(),
  tenantSlug: z.string().min(2).optional()
});

export const SantisSessionContextSchema = z.object({
  sessionId: z.string().min(1),
  operator: SessionOperatorSchema,
  tenant: SessionTenantScopeSchema,
  issuedAt: z.number(),
  expiresAt: z.number(),
  requestId: z.string().min(1).optional()
});

export const BoardroomReadableSessionSchema = SantisSessionContextSchema.refine((session) => {
  const hasValidRole = session.operator.roles.some((role) => role === "admin" || role === "boardroom");
  const hasValidCapability = session.operator.capabilities.some(
    (cap) => cap === "audit-log:read" || cap === "boardroom:read"
  );
  return hasValidRole || hasValidCapability;
}, {
  message: "Session does not have adequate roles or capabilities for boardroom access."
});

export const BoardroomWritableSessionSchema = SantisSessionContextSchema.refine((session) => {
  const hasValidRole = session.operator.roles.some((role) => role === "admin" || role === "boardroom");
  const hasValidCapability = session.operator.capabilities.some(
    (cap) => cap === "audit-log:write" || cap === "boardroom:write"
  );
  return hasValidRole || hasValidCapability;
}, {
  message: "Session does not have adequate roles or capabilities for boardroom write access."
});

export type OperatorRole = z.infer<typeof OperatorRoleSchema>;
export type OperatorCapability = z.infer<typeof OperatorCapabilitySchema>;
export type SessionOperator = z.infer<typeof SessionOperatorSchema>;
export type SessionTenantScope = z.infer<typeof SessionTenantScopeSchema>;
export type SantisSessionContext = z.infer<typeof SantisSessionContextSchema>;
export type BoardroomReadableSession = z.infer<typeof BoardroomReadableSessionSchema>;
export type BoardroomWritableSession = z.infer<typeof BoardroomWritableSessionSchema>;
