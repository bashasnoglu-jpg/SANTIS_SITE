import { eq, and, desc } from "drizzle-orm";
import { auditLogs } from "../schema/audit-logs.js";

// A generic interface for the Drizzle connection
// so the repository is decoupled from the driver details.
export interface DrizzleDB {
  insert: (table: any) => any;
  select: (fields?: any) => any;
}

export class AuditLogRepository {
  constructor(private readonly db: DrizzleDB) {}

  /**
   * Append a new audit log entry to the database.
   * This is an append-only operation.
   */
  async createLog(entry: typeof auditLogs.$inferInsert): Promise<typeof auditLogs.$inferSelect> {
    const [inserted] = await this.db.insert(auditLogs).values(entry).returning();
    return inserted;
  }

  /**
   * Retrieve audit logs strictly scoped to a specific tenant.
   * Update/Delete are intentionally missing to enforce append-only rules.
   */
  async getLogsByTenant(
    tenantId: string, 
    options?: { limit?: number; offset?: number }
  ): Promise<(typeof auditLogs.$inferSelect)[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    
    return this.db.select()
      .from(auditLogs)
      .where(eq(auditLogs.tenantId, tenantId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
