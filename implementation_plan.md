# Phase J-W0 — Audit Log Query Filters & Event Registry Seal

Bu plan, `ingestion-api` için Audit Log okuma yeteneklerini genişleterek, Admin UI öncesinde gerçek bir SaaS standardında filtreleme, sayfalama ve canonical event altyapısını kurmayı hedefler.

## Open Questions
- **Event Registry Strictness**: `event` alanı için Zod şemasında (Create) `z.enum([...])` ile tam katı (strict) kısıtlama mı getirelim, yoksa `z.string()` kalıp sadece bir registry referans objesi mi sunalım? SaaS'larda genellikle strict enum tercih edilir, planda **strict enum** olarak tasarlandı.
- **Date Format**: `startDate` ve `endDate` için ISO 8601 string bekleyeceğiz ve Zod'un `coerce.date()` fonksiyonuyla işleyeceğiz.

## Proposed Changes

### @santis/domain-schema

#### [NEW] `packages/domain-schema/src/audit-log.events.ts`
- Canonical event registry objesini barındıracak:
```typescript
export const AuditLogEvents = [
  "auth.login",
  "auth.logout",
  "user.created",
  "user.updated",
  "boardroom.settings.updated",
  "tenant.created"
] as const;

export type AuditLogEvent = typeof AuditLogEvents[number];
```

#### [MODIFY] `packages/domain-schema/src/audit-log.contract.ts`
- `event` alanını `AuditLogEvents` enum'ı ile sınırla.
- `AuditLogQuerySchema`'yı genişlet:
  ```typescript
  export const AuditLogQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    event: z.enum(AuditLogEvents).optional(),
    actorType: z.enum(["user", "system", "service", "ai", "webhook"]).optional(),
    source: z.enum(["api", "admin", "system", "worker", "webhook"]).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional()
  });
  ```
- Pagination envelope ekle:
  ```typescript
  export const AuditLogResponseEnvelopeSchema = z.object({
    data: z.array(AuditLogEntrySchema),
    meta: z.object({
      total: z.number().int(),
      limit: z.number().int(),
      offset: z.number().int()
    })
  });
  ```

---

### @santis/database

#### [MODIFY] `packages/database/src/repositories/audit-log.repository.ts`
- `getLogsByTenant` imzasını ve implementasyonunu güncelle:
  - Dinamik Drizzle `where` array'i oluştur:
    ```typescript
    const conditions = [eq(auditLogs.tenantId, tenantId)];
    if (options.event) conditions.push(eq(auditLogs.event, options.event));
    // ...actorType, source
    if (options.startDate) conditions.push(gte(auditLogs.createdAt, options.startDate));
    if (options.endDate) conditions.push(lte(auditLogs.createdAt, options.endDate));
    ```
  - Data query'si: `where(and(...conditions)).limit().offset()`
  - Count query'si: `select({ count: count() }).from(auditLogs).where(and(...conditions))`
  - Dönüş tipini `{ data, total }` olarak değiştir.

---

### @santis/ingestion-api

#### [MODIFY] `apps/ingestion-api/src/services/audit-log.service.ts`
- `getTenantLogs` dönüş tipini `{ data, meta: { total, limit, offset } }` envelope formatına çevir.

#### [MODIFY] `apps/ingestion-api/src/routes/boardroom.routes.ts`
- GET endpoint'in yeni `AuditLogResponseEnvelopeSchema` formatını response olarak döndürmesini sağla.

#### [MODIFY] `apps/ingestion-api/src/routes/boardroom.routes.test.ts`
- Eski `assert.deepStrictEqual(response.json(), [])` kontrollerini `{ data: [], meta: { total: 0, limit: 50, offset: 0 } }` ile değiştir.
- Geçerli valid test payloadlarındaki `event` field'larını yeni `AuditLogEvents` registry'sine uygun (ör. `auth.login`) yap.

## Verification Plan
1. **Drizzle Queries**: Unit/Integration testler sırasında `mockDb` ve repository metodunun dinamik where filtrelerini doğru inşaa ettiği doğrulanacak.
2. **Integration Tests**: `pnpm --filter @santis/ingestion-api test` komutu çalıştırılarak, pagination meta verisinin ve envelope şemasının çalıştığı teyit edilecek.
3. **Typecheck**: Domain-schema'nın katı tip (strict enum) kontrollerinin kırılmadığından emin olunacak.
