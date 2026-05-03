import { db } from "@santis/db";
import { waveMemory } from "@santis/db/schema/wave-memory";
import { eq } from "drizzle-orm";

export async function recordWaveOutcome(key: string, success: boolean) {
  const rows = await db.select().from(waveMemory).where(eq(waveMemory.key, key));

  if (!rows.length) {
    await db.insert(waveMemory).values({
      key,
      total: 1,
      success: success ? 1 : 0,
      updatedAt: new Date(),
    });
    return;
  }

  const row = rows[0];

  await db
    .update(waveMemory)
    .set({
      total: row.total + 1,
      success: row.success + (success ? 1 : 0),
      updatedAt: new Date(),
    })
    .where(eq(waveMemory.key, key));
}

// 🔥 CRITICAL: cold start protection
export async function getWaveSuccessRate(key: string): Promise<number> {
  const rows = await db.select().from(waveMemory).where(eq(waveMemory.key, key));

  if (!rows.length || rows[0].total < 5) {
    return 0.5;
  }

  return rows[0].success / rows[0].total;
}
