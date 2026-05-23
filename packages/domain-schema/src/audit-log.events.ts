export const AuditLogEvents = [
  "auth.login",
  "auth.logout",

  "user.created",
  "user.updated",
  "user.deleted",

  "tenant.created",
  "tenant.updated",
  "tenant.settings.updated",

  "reservation.created",
  "reservation.updated",
  "reservation.cancelled",

  "boardroom.settings.updated",
  "boardroom.override.applied",

  "audit_log.created",
  "audit_log.viewed",

  "system.night_audit.completed"
] as const;

export type AuditLogEvent = typeof AuditLogEvents[number];
