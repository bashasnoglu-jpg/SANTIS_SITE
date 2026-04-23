import { pgTable, uuid, varchar, jsonb, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import type { InferSelectModel } from 'drizzle-orm';

// Düzeltme 1: pgEnum kullanımı ile katı veritabanı kısıtlaması
export const signalTypeEnum = pgEnum('signal_type', [
  'stress_index', 
  'hesitation_index', 
  'abandon_risk', 
  'therapist_stress'
]);

// Düzeltme 3: JSONB alanını şekillendiren kontrollü Zod şeması
export const telemetryContextSchema = z.object({
  page: z.string().optional(),
  component: z.string().optional(),
  sessionId: z.string().optional(),
  pathname: z.string().optional(),
  frictionSource: z.string().optional()
});

type TelemetryContext = z.infer<typeof telemetryContextSchema>;

export const telemetrySignals = pgTable('telemetry_signals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  signalType: signalTypeEnum('signal_type').notNull(),
  value: integer('value').notNull(),
  
  // JSONB'yi Drizzle $type casting ile Zod tipine mühürlüyoruz
  context: jsonb('context').$type<TelemetryContext>(),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Boundary (Sınır) parse işlemleri
export const insertSignalSchema = createInsertSchema(telemetrySignals, {
  context: telemetryContextSchema
});
export const selectSignalSchema = createSelectSchema(telemetrySignals, {
  context: telemetryContextSchema
});

// Düzeltme 2: TelemetrySignal type çıkarımı (Doğrudan DB gerçekliğinden)
export type TelemetrySignal = InferSelectModel<typeof telemetrySignals>;
