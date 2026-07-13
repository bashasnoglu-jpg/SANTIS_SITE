-- Santis OS — FI-DI-P0.4 financial analytics foundation
-- Artifact only. DO NOT APPLY during P0.4 E2 static evidence phase.

CREATE TYPE fi_sync_run_mode AS ENUM ('NORMAL', 'FORCED_REPLAY');
CREATE TYPE fi_sync_run_status AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED', 'ABORTED');
CREATE TYPE fi_quarantine_status AS ENUM ('OPEN', 'CLOSED');

CREATE TABLE fi_sync_run (
  sync_run_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key uuid NOT NULL UNIQUE,
  parent_sync_run_id uuid,
  run_mode fi_sync_run_mode NOT NULL DEFAULT 'NORMAL',
  replay_reason text,
  contract_id varchar(50) NOT NULL,
  contract_version varchar(20) NOT NULL,
  source_system varchar(50) NOT NULL,
  source_base_id varchar(100) NOT NULL,
  source_table varchar(100) NOT NULL,
  watermark_start timestamptz NOT NULL,
  watermark_end timestamptz NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  extracted_count integer NOT NULL DEFAULT 0,
  inserted_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  no_op_count integer NOT NULL DEFAULT 0,
  quarantined_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  last_processed_modified_at timestamptz,
  last_processed_record_id varchar(100),
  status fi_sync_run_status NOT NULL DEFAULT 'RUNNING',
  error_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fi_sync_run_source_window_idx ON fi_sync_run(source_system, source_table, watermark_start, watermark_end);

CREATE TABLE fi_sync_watermark (
  source_system varchar(50) NOT NULL,
  source_base_id varchar(100) NOT NULL,
  source_table varchar(100) NOT NULL,
  last_successful_watermark timestamptz NOT NULL,
  last_sync_run_id uuid NOT NULL REFERENCES fi_sync_run(sync_run_id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fi_sync_watermark_source_uq UNIQUE(source_system, source_base_id, source_table)
);

CREATE TABLE fi_sync_quarantine_log (
  quarantine_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id uuid NOT NULL REFERENCES fi_sync_run(sync_run_id),
  source_system varchar(50) NOT NULL,
  source_table varchar(100) NOT NULL,
  source_record_id varchar(100) NOT NULL,
  target_table varchar(100),
  reason_codes text[] NOT NULL,
  reason_detail text,
  business_fact_hash char(64),
  raw_payload_hash char(64) NOT NULL,
  raw_payload jsonb NOT NULL,
  quarantined_at timestamptz NOT NULL,
  status fi_quarantine_status NOT NULL DEFAULT 'OPEN',
  resolution text,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fi_quarantine_source_idx ON fi_sync_quarantine_log(source_system, source_table, source_record_id);
CREATE UNIQUE INDEX fi_quarantine_open_dedup_uq
  ON fi_sync_quarantine_log(source_system, source_table, source_record_id, raw_payload_hash)
  WHERE status = 'OPEN';

-- Canonical provenance is repeated physically in each target table so each fact remains self-auditing.
CREATE OR REPLACE FUNCTION fi_create_fact_table(target_name text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format($ddl$
    CREATE TABLE %I (
      fact_id uuid PRIMARY KEY,
      source_system varchar(50) NOT NULL,
      source_table varchar(100) NOT NULL,
      source_record_id varchar(100) NOT NULL,
      source_last_modified_at timestamptz NOT NULL,
      occurred_at timestamptz,
      recorded_at timestamptz NOT NULL,
      synced_at timestamptz,
      processed_at timestamptz,
      business_fact_hash char(64) NOT NULL,
      source_snapshot_hash char(64) NOT NULL,
      tenant_id varchar(100),
      location_id varchar(100),
      environment varchar(20),
      quarantine_flag boolean NOT NULL DEFAULT false,
      quarantine_reason text,
      quarantined_at timestamptz,
      quarantine_resolution text,
      resolved_at timestamptz,
      resolved_by text,
      sync_run_id uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT %I UNIQUE(source_system, source_table, source_record_id)
    )$ddl$, target_name, target_name || '_source_uq');
  EXECUTE format('CREATE INDEX %I ON %I(source_last_modified_at, source_record_id)', target_name || '_cursor_idx', target_name);
  EXECUTE format('CREATE INDEX %I ON %I(tenant_id, location_id, environment)', target_name || '_isolation_idx', target_name);
END;
$$;

SELECT fi_create_fact_table('fact_payments');
SELECT fi_create_fact_table('fact_cash_movements');
SELECT fi_create_fact_table('fact_daily_cash_closings');
SELECT fi_create_fact_table('fact_bookings');
SELECT fi_create_fact_table('fact_commissions');
SELECT fi_create_fact_table('fact_package_usage');
SELECT fi_create_fact_table('fact_client_packages');
SELECT fi_create_fact_table('fact_cancellations');
SELECT fi_create_fact_table('fact_inventory_transactions');
SELECT fi_create_fact_table('reconciliation_snapshots');
SELECT fi_create_fact_table('dim_tenants');
SELECT fi_create_fact_table('dim_locations');
SELECT fi_create_fact_table('commission_rule_versions');
DROP FUNCTION fi_create_fact_table(text);

ALTER TABLE fact_payments
  ADD COLUMN fact_type varchar(50) NOT NULL,
  ADD COLUMN amount_eur numeric(12,2), ADD COLUMN amount_original numeric(12,2),
  ADD COLUMN currency varchar(3), ADD COLUMN exchange_rate numeric(10,6),
  ADD COLUMN direction varchar(20), ADD COLUMN payment_status varchar(50),
  ADD COLUMN parent_fact_reference varchar(100);
ALTER TABLE fact_cash_movements
  ADD COLUMN amount_eur numeric(12,2), ADD COLUMN currency varchar(3),
  ADD COLUMN movement_type varchar(50), ADD COLUMN direction varchar(20);
ALTER TABLE fact_daily_cash_closings
  ADD COLUMN opening_cash numeric(12,2), ADD COLUMN expected_cash numeric(12,2),
  ADD COLUMN cash_counted numeric(12,2), ADD COLUMN cash_difference numeric(12,2),
  ADD COLUMN closing_status varchar(50);
ALTER TABLE fact_bookings
  ADD COLUMN fact_type varchar(50), ADD COLUMN list_price numeric(12,2),
  ADD COLUMN applied_price numeric(12,2), ADD COLUMN currency varchar(3),
  ADD COLUMN booking_status varchar(50), ADD COLUMN service_id varchar(100),
  ADD COLUMN therapist_id varchar(100), ADD COLUMN room_id varchar(100),
  ADD COLUMN client_id varchar(100);
ALTER TABLE fact_commissions
  ADD COLUMN gross_source_amount numeric(12,2), ADD COLUMN commission_amount numeric(12,2),
  ADD COLUMN commission_rate numeric(5,2), ADD COLUMN currency varchar(3),
  ADD COLUMN booking_reference varchar(100), ADD COLUMN rule_version varchar(50);
ALTER TABLE fact_package_usage
  ADD COLUMN sessions_deducted integer, ADD COLUMN realized_session_value_eur numeric(12,2),
  ADD COLUMN discount_allocated_eur numeric(12,2), ADD COLUMN status varchar(50);
ALTER TABLE fact_client_packages
  ADD COLUMN purchase_amount_eur numeric(12,2), ADD COLUMN paid_amount_eur numeric(12,2),
  ADD COLUMN currency varchar(3), ADD COLUMN total_sessions integer,
  ADD COLUMN remaining_sessions integer, ADD COLUMN package_status varchar(50),
  ADD COLUMN client_id varchar(100);
ALTER TABLE fact_cancellations
  ADD COLUMN booking_reference varchar(100), ADD COLUMN cancellation_reason text,
  ADD COLUMN cancellation_type varchar(50), ADD COLUMN refund_amount_eur numeric(12,2),
  ADD COLUMN cancellation_fee_eur numeric(12,2), ADD COLUMN audit_status varchar(50);
ALTER TABLE fact_inventory_transactions
  ADD COLUMN inventory_reference varchar(100), ADD COLUMN quantity_change numeric(12,3),
  ADD COLUMN unit_cost_snapshot numeric(12,2), ADD COLUMN amount_eur numeric(12,2),
  ADD COLUMN currency varchar(3), ADD COLUMN transaction_type varchar(50),
  ADD COLUMN transaction_status varchar(50), ADD COLUMN evidence_level varchar(10),
  ADD COLUMN e0_warning text;
ALTER TABLE reconciliation_snapshots
  ADD COLUMN business_date timestamptz, ADD COLUMN daily_revenue numeric(12,2),
  ADD COLUMN cash_total numeric(12,2), ADD COLUMN card_total numeric(12,2),
  ADD COLUMN expected_cash numeric(12,2), ADD COLUMN cash_counted numeric(12,2),
  ADD COLUMN closing_status varchar(50);
ALTER TABLE dim_tenants
  ADD COLUMN tenant_code varchar(100), ADD COLUMN tenant_name varchar(255),
  ADD COLUMN status varchar(50), ADD COLUMN default_currency varchar(3);
ALTER TABLE dim_locations
  ADD COLUMN location_code varchar(100), ADD COLUMN location_name varchar(255),
  ADD COLUMN status varchar(50), ADD COLUMN timezone varchar(100),
  ADD COLUMN country varchar(100), ADD COLUMN city varchar(100),
  ADD COLUMN display_currency varchar(3);
ALTER TABLE commission_rule_versions
  ADD COLUMN rule_name varchar(255), ADD COLUMN calculation_type varchar(100),
  ADD COLUMN commission_rate numeric(5,2), ADD COLUMN rule_version varchar(50),
  ADD COLUMN effective_from timestamptz, ADD COLUMN effective_to timestamptz;
