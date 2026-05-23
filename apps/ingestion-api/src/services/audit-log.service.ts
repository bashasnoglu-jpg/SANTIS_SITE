import { AuditLogRepository } from "@santis/database";
import { CreateAuditLogEntrySchema, AuditLogEntrySchema, AuditLogEntry, AuditLogResponseEnvelope } from "@santis/domain-schema/audit-log.contract.js";

export class AuditLogService {
  constructor(private readonly repository: AuditLogRepository) {}

  /**
   * Log an event into the audit trail.
   * Validates the entry strictly against domain rules (e.g. payload restrictions).
   */
  async appendLog(entry: unknown): Promise<AuditLogEntry> {
    // 1. Strict validation enforces our forbidden-key rules
    const validatedEntry = CreateAuditLogEntrySchema.parse(entry);

    // 2. Append to database
    // The DB will supply 'id' and 'createdAt'.
    const inserted = await this.repository.createLog(validatedEntry);
    
    // We strictly parse the returned DB record to the read contract
    return AuditLogEntrySchema.parse(inserted);
  }

  /**
   * Retrieve audit logs, strictly bounded by tenantId.
   */
  async getTenantLogs(
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
  ): Promise<AuditLogResponseEnvelope> {
    if (!tenantId) {
      throw new Error("Tenant context is missing");
    }

    const { data: records, total } = await this.repository.getLogsByTenant(tenantId, options);
    
    return {
      data: records.map(record => AuditLogEntrySchema.parse(record)),
      meta: {
        total,
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0
      }
    };
  }
}
