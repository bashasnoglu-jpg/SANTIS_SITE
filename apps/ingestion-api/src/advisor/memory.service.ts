import { eq, and, desc } from 'drizzle-orm';
import { guestTraits, guestMemoryEmbeddings, guestSessions } from '@santis/database';

export class MemoryService {
  constructor(private db: any) {}

  async fetchActiveTraits(guestId?: string, tenantId?: string): Promise<string[]> {
    if (!guestId || !tenantId) return ["Anonymous Spa Explorer"];
    
    try {
      const results = await this.db.select()
        .from(guestTraits)
        .where(and(eq(guestTraits.guestId, guestId), eq(guestTraits.tenantId, tenantId)))
        .orderBy(desc(guestTraits.confidenceScore));

      if (results.length === 0) return ["Anonymous Spa Explorer"];
      return results.map((r: any) => r.value);
    } catch (e) {
      console.error("fetchActiveTraits DB Error:", e);
      return ["Error reading traits"];
    }
  }

  async fetchRecentMemories(guestId?: string, tenantId?: string): Promise<string[]> {
    if (!guestId || !tenantId) return ["No past visits on record."];
    
    try {
      const results = await this.db.select()
        .from(guestMemoryEmbeddings)
        .where(and(eq(guestMemoryEmbeddings.guestId, guestId), eq(guestMemoryEmbeddings.tenantId, tenantId)))
        .orderBy(desc(guestMemoryEmbeddings.createdAt))
        .limit(5);

      if (results.length === 0) return ["No past visits on record."];
      return results.map((r: any) => r.memoryText);
    } catch (e) {
      console.error("fetchRecentMemories DB Error:", e);
      return ["Error reading memories"];
    }
  }

  async fetchRecentSessions(guestId?: string, tenantId?: string): Promise<string[]> {
    if (!guestId || !tenantId) return ["First visit (Anonymous)"];
    
    try {
      const results = await this.db.select()
        .from(guestSessions)
        .where(and(eq(guestSessions.guestId, guestId), eq(guestSessions.tenantId, tenantId)))
        .orderBy(desc(guestSessions.startedAt))
        .limit(3);

      if (results.length === 0) return ["No previous tracked sessions."];
      return results.map((r: any) => `Session via ${r.channel} at ${r.startedAt.toISOString()}`);
    } catch (e) {
      console.error("fetchRecentSessions DB Error:", e);
      return ["Error reading sessions"];
    }
  }
}
