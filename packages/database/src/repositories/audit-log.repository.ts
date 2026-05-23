import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
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
    options?: { 
      limit?: number; 
      offset?: number;
      event?: string;
      actorType?: string;
      source?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ data: (typeof auditLogs.$inferSelect)[], total: number }> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    
    const conditions = [eq(auditLogs.tenantId, tenantId)];
    
    if (options?.event) conditions.push(eq(auditLogs.event, options.event));
    if (options?.actorType) conditions.push(eq(auditLogs.actorType, options.actorType));
    if (options?.source) conditions.push(eq(auditLogs.source, options.source));
    if (options?.startDate) conditions.push(gte(auditLogs.createdAt, options.startDate));
    if (options?.endDate) conditions.push(lte(auditLogs.createdAt, options.endDate));

    const whereClause = and(...conditions);

    const [countResult] = await this.db.select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    const data = await this.db.select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return { data, total };
  }
}
