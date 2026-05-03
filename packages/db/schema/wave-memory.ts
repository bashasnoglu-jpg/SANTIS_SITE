import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const waveMemory = pgTable("wave_memory", {
  key: text("key").primaryKey(),

  total: integer("total").notNull().default(0),
  success: integer("success").notNull().default(0),

  updatedAt: timestamp("updated_at").notNull(),
});
