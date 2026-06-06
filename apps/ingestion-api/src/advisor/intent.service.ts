import { IntentPayload } from "./types.js";
import { eq, and, desc } from 'drizzle-orm';
import { guestIntents } from '@santis/database';

export class IntentService {
  constructor(private db: any) {}

  async extractIntents(payload: IntentPayload): Promise<string[]> {
    const intents: string[] = [];

    // Fallback logic for anonymous or no-DB scenario
    if (payload.currentAction.toLowerCase().includes("hammam")) {
      intents.push("Hammam Search (Contextual)");
    } else {
      intents.push("General Wellness Inquiry (Contextual)");
    }

    if (!payload.guestId || !payload.tenantId) {
      return intents;
    }

    // Real DB read path
    try {
      const results = await this.db.select()
        .from(guestIntents)
        .where(and(eq(guestIntents.guestId, payload.guestId), eq(guestIntents.tenantId, payload.tenantId)))
        .orderBy(desc(guestIntents.confidence))
        .limit(3);

      if (results.length > 0) {
        // Return DB intents overriding contextual default if any exists with higher confidence
        return results.map((r: any) => `${r.intent} (${r.confidence}%)`);
      }
    } catch (e) {
      console.error("extractIntents DB Error:", e);
    }

    return intents;
  }
}
