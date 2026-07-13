import {
  boolean,
  char,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const syncRunModeEnum = pgEnum('fi_sync_run_mode', ['NORMAL', 'FORCED_REPLAY']);
export const syncRunStatusEnum = pgEnum('fi_sync_run_status', ['RUNNING', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED', 'ABORTED']);
export const quarantineStatusEnum = pgEnum('fi_quarantine_status', ['OPEN', 'CLOSED']);

const provenanceColumns = () => ({
  factId: uuid('fact_id').primaryKey(),
  sourceSystem: varchar('source_system', { length: 50 }).notNull(),
  sourceTable: varchar('source_table', { length: 100 }).notNull(),
  sourceRecordId: varchar('source_record_id', { length: 100 }).notNull(),
  sourceLastModifiedAt: timestamp('source_last_modified_at', { withTimezone: true }).notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  businessFactHash: char('business_fact_hash', { length: 64 }).notNull(),
  sourceSnapshotHash: char('source_snapshot_hash', { length: 64 }).notNull(),
  tenantId: varchar('tenant_id', { length: 100 }),
  locationId: varchar('location_id', { length: 100 }),
  environment: varchar('environment', { length: 20 }),
  quarantineFlag: boolean('quarantine_flag').notNull().default(false),
  quarantineReason: text('quarantine_reason'),
  quarantinedAt: timestamp('quarantined_at', { withTimezone: true }),
  quarantineResolution: text('quarantine_resolution'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: text('resolved_by'),
  syncRunId: uuid('sync_run_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

const factIndexes = (table: ReturnType<typeof provenanceColumns>) => ({
  sourceIdentity: uniqueIndex().on(table.sourceSystem, table.sourceTable, table.sourceRecordId),
  sourceCursor: index().on(table.sourceLastModifiedAt, table.sourceRecordId),
  isolation: index().on(table.tenantId, table.locationId, table.environment),
});

export const syncRun = pgTable('fi_sync_run', {
  syncRunId: uuid('sync_run_id').defaultRandom().primaryKey(),
  idempotencyKey: uuid('idempotency_key').notNull(),
  parentSyncRunId: uuid('parent_sync_run_id'),
  runMode: syncRunModeEnum('run_mode').notNull().default('NORMAL'),
  replayReason: text('replay_reason'),
  contractId: varchar('contract_id', { length: 50 }).notNull(),
  contractVersion: varchar('contract_version', { length: 20 }).notNull(),
  sourceSystem: varchar('source_system', { length: 50 }).notNull(),
  sourceBaseId: varchar('source_base_id', { length: 100 }).notNull(),
  sourceTable: varchar('source_table', { length: 100 }).notNull(),
  watermarkStart: timestamp('watermark_start', { withTimezone: true }).notNull(),
  watermarkEnd: timestamp('watermark_end', { withTimezone: true }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  extractedCount: integer('extracted_count').notNull().default(0),
  insertedCount: integer('inserted_count').notNull().default(0),
  updatedCount: integer('updated_count').notNull().default(0),
  noOpCount: integer('no_op_count').notNull().default(0),
  quarantinedCount: integer('quarantined_count').notNull().default(0),
  failedCount: integer('failed_count').notNull().default(0),
  lastProcessedModifiedAt: timestamp('last_processed_modified_at', { withTimezone: true }),
  lastProcessedRecordId: varchar('last_processed_record_id', { length: 100 }),
  status: syncRunStatusEnum('status').notNull().default('RUNNING'),
  errorSummary: text('error_summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idempotencyUnique: uniqueIndex('fi_sync_run_idempotency_uq').on(table.idempotencyKey),
  sourceWindowIdx: index('fi_sync_run_source_window_idx').on(table.sourceSystem, table.sourceTable, table.watermarkStart, table.watermarkEnd),
}));

export const syncWatermark = pgTable('fi_sync_watermark', {
  sourceSystem: varchar('source_system', { length: 50 }).notNull(),
  sourceBaseId: varchar('source_base_id', { length: 100 }).notNull(),
  sourceTable: varchar('source_table', { length: 100 }).notNull(),
  lastSuccessfulWatermark: timestamp('last_successful_watermark', { withTimezone: true }).notNull(),
  lastSyncRunId: uuid('last_sync_run_id').notNull().references(() => syncRun.syncRunId),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sourceUnique: uniqueIndex('fi_sync_watermark_source_uq').on(table.sourceSystem, table.sourceBaseId, table.sourceTable),
}));

export const syncQuarantineLog = pgTable('fi_sync_quarantine_log', {
  quarantineId: uuid('quarantine_id').defaultRandom().primaryKey(),
  syncRunId: uuid('sync_run_id').notNull().references(() => syncRun.syncRunId),
  sourceSystem: varchar('source_system', { length: 50 }).notNull(),
  sourceTable: varchar('source_table', { length: 100 }).notNull(),
  sourceRecordId: varchar('source_record_id', { length: 100 }).notNull(),
  targetTable: varchar('target_table', { length: 100 }),
  reasonCodes: text('reason_codes').array().notNull(),
  reasonDetail: text('reason_detail'),
  businessFactHash: char('business_fact_hash', { length: 64 }),
  rawPayloadHash: char('raw_payload_hash', { length: 64 }).notNull(),
  rawPayload: jsonb('raw_payload').notNull(),
  quarantinedAt: timestamp('quarantined_at', { withTimezone: true }).notNull(),
  status: quarantineStatusEnum('status').notNull().default('OPEN'),
  resolution: text('resolution'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: text('resolved_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sourceIdx: index('fi_quarantine_source_idx').on(table.sourceSystem, table.sourceTable, table.sourceRecordId),
  openDedupIdx: uniqueIndex('fi_quarantine_open_dedup_uq')
    .on(table.sourceSystem, table.sourceTable, table.sourceRecordId, table.rawPayloadHash)
    .where(sql`${table.status} = 'OPEN'`),
}));

export const paymentFacts = pgTable('payment_facts', {
  ...provenanceColumns(),
  factType: varchar('fact_type', { length: 50 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }),
  amountOriginal: numeric('amount_original', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }),
  exchangeRateApplied: numeric('exchange_rate_applied', { precision: 10, scale: 6 }),
  refundAmount: numeric('refund_amount', { precision: 12, scale: 2 }),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }),
  direction: varchar('direction', { length: 20 }),
  externalReference: text('external_reference'),
  parentFactReference: varchar('parent_fact_reference', { length: 100 }),
}, factIndexes);

export const cashMovementFacts = pgTable('cash_movement_facts', {
  ...provenanceColumns(),
  amount: numeric('amount', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }),
  factType: varchar('fact_type', { length: 64 }),
  direction: varchar('direction', { length: 20 }),
}, factIndexes);

export const dailyCashClosings = pgTable('daily_cash_closings', {
  ...provenanceColumns(),
  businessDate: timestamp('business_date', { withTimezone: true }),
  openingCash: numeric('opening_cash', { precision: 12, scale: 2 }),
  expectedCash: numeric('expected_cash', { precision: 12, scale: 2 }),
  cashCounted: numeric('cash_counted', { precision: 12, scale: 2 }),
  cashDifference: numeric('cash_difference', { precision: 12, scale: 2 }),
  cashIncome: numeric('cash_income', { precision: 12, scale: 2 }),
  cardIncome: numeric('card_income', { precision: 12, scale: 2 }),
  bankIncome: numeric('bank_income', { precision: 12, scale: 2 }),
  closingStatus: varchar('closing_status', { length: 32 }),
  approvalStatus: varchar('approval_status', { length: 32 }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
}, factIndexes);

export const bookingFacts = pgTable('booking_facts', {
  ...provenanceColumns(),
  factType: varchar('fact_type', { length: 64 }),
  listAmount: numeric('list_amount', { precision: 12, scale: 2 }),
  appliedAmount: numeric('applied_amount', { precision: 12, scale: 2 }),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }),
  serviceId: varchar('service_id', { length: 100 }),
  therapistId: varchar('therapist_id', { length: 100 }),
  roomId: varchar('room_id', { length: 100 }),
  clientId: varchar('client_id', { length: 100 }),
}, factIndexes);

export const commissionFacts = pgTable('commission_facts', {
  ...provenanceColumns(),
  sourceAmount: numeric('source_amount', { precision: 12, scale: 2 }),
  amount: numeric('amount', { precision: 12, scale: 2 }),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }),
  currency: varchar('currency', { length: 3 }),
  sourceBookingId: varchar('source_booking_id', { length: 100 }),
  ruleVersionId: varchar('rule_version_id', { length: 100 }),
}, factIndexes);

export const packageUsageFacts = pgTable('package_usage_facts', {
  ...provenanceColumns(),
  factType: varchar('fact_type', { length: 64 }),
  sessionsDeducted: numeric('sessions_deducted', { precision: 10, scale: 2 }),
  amount: numeric('amount', { precision: 12, scale: 2 }),
  realizedValue: numeric('realized_value', { precision: 12, scale: 2 }),
  commissionBase: numeric('commission_base', { precision: 12, scale: 2 }),
  discountAllocated: numeric('discount_allocated', { precision: 12, scale: 2 }),
}, factIndexes);

export const clientPackageFacts = pgTable('client_package_facts', {
  ...provenanceColumns(),
  listAmount: numeric('list_amount', { precision: 12, scale: 2 }),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }),
  totalSessions: integer('total_sessions'),
  remainingSessions: integer('remaining_sessions'),
  packageStatus: varchar('package_status', { length: 50 }),
  clientId: varchar('client_id', { length: 100 }),
}, factIndexes);

export const cancellationFacts = pgTable('cancellation_facts', {
  ...provenanceColumns(),
  sourceBookingId: varchar('source_booking_id', { length: 100 }),
  cancellationReason: text('cancellation_reason'),
  cancellationType: varchar('cancellation_type', { length: 50 }),
  refundAmount: numeric('refund_amount', { precision: 12, scale: 2 }),
  cancellationFee: numeric('cancellation_fee', { precision: 12, scale: 2 }),
  auditStatus: varchar('audit_status', { length: 50 }),
}, factIndexes);

export const inventoryCostFacts = pgTable('inventory_cost_facts', {
  ...provenanceColumns(),
  inventoryReference: varchar('inventory_reference', { length: 100 }),
  quantityChange: numeric('quantity_change', { precision: 12, scale: 3 }),
  unitCostSnapshot: numeric('unit_cost_snapshot', { precision: 12, scale: 2 }),
  amount: numeric('amount', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }),
  transactionType: varchar('transaction_type', { length: 50 }),
  transactionStatus: varchar('transaction_status', { length: 50 }),
  evidenceLevel: varchar('evidence_level', { length: 10 }),
  e0Warning: text('e0_warning'),
}, factIndexes);

export const reconciliationSnapshots = pgTable('reconciliation_snapshots', {
  ...provenanceColumns(),
  businessDate: timestamp('business_date', { withTimezone: true }),
  reportedRevenue: numeric('reported_revenue', { precision: 12, scale: 2 }),
  cashTotal: numeric('cash_total', { precision: 12, scale: 2 }),
  cardTotal: numeric('card_total', { precision: 12, scale: 2 }),
  cashDifference: numeric('cash_difference', { precision: 12, scale: 2 }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
}, factIndexes);

export const dimTenants = pgTable('dim_tenants', {
  ...provenanceColumns(),
  tenantCode: varchar('tenant_code', { length: 100 }),
  tenantName: varchar('tenant_name', { length: 255 }),
  status: varchar('status', { length: 50 }),
  defaultCurrency: varchar('default_currency', { length: 3 }),
}, factIndexes);

export const dimLocations = pgTable('dim_locations', {
  ...provenanceColumns(),
  locationCode: varchar('location_code', { length: 100 }),
  locationName: varchar('location_name', { length: 255 }),
  status: varchar('status', { length: 50 }),
  timezone: varchar('timezone', { length: 100 }),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  displayCurrency: varchar('display_currency', { length: 3 }),
  accountingCurrency: varchar('accounting_currency', { length: 3 }),
}, factIndexes);

export const commissionRuleVersions = pgTable('commission_rule_versions', {
  ...provenanceColumns(),
  ruleName: varchar('rule_name', { length: 255 }),
  calculationType: varchar('calculation_type', { length: 100 }),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }),
  ruleVersion: varchar('rule_version', { length: 50 }),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }),
  effectiveTo: timestamp('effective_to', { withTimezone: true }),
}, factIndexes);
