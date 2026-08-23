-- BOOKING-CREATE-ATTEMPT-1.0
-- DRAFT MIGRATION ARTIFACT ONLY — DO NOT APPLY.
-- Production migration execution is NOT AUTHORIZED by this file.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE booking_attempt_outcome AS ENUM (
    'SUCCESS',
    'FAILURE',
    'REPLAYED',
    'IDEMPOTENCY_CONFLICT',
    'CONCURRENCY_REJECTED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE booking_projection_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'SUCCESS',
    'FAILED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS booking_create_attempts (
  attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(255) NOT NULL,
  idempotency_key VARCHAR(512) NOT NULL,
  request_fingerprint VARCHAR(128) NOT NULL,
  postgres_claim_id UUID NOT NULL,
  claim_owner BOOLEAN NOT NULL DEFAULT FALSE,
  writer_commit_sha VARCHAR(64) NOT NULL,
  runtime_trace_id VARCHAR(255) NOT NULL,
  outcome booking_attempt_outcome,
  reason_code VARCHAR(128),
  canonical_booking_id UUID REFERENCES bookings(id),
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_at TIMESTAMPTZ,
  CONSTRAINT booking_attempt_finalize_shape_ck CHECK (
    (finalized_at IS NULL AND outcome IS NULL)
    OR
    (finalized_at IS NOT NULL AND outcome IS NOT NULL)
  ),
  CONSTRAINT booking_attempt_booking_outcome_ck CHECK (
    outcome NOT IN ('SUCCESS', 'REPLAYED') OR canonical_booking_id IS NOT NULL
  )
);

-- Exactly one authoritative claim owner may exist for an idempotency key.
-- Replay/conflict/concurrency observations are separate attempt rows referencing
-- the same postgres_claim_id and are therefore still append-only evidence.
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_attempt_claim_owner
  ON booking_create_attempts (idempotency_key)
  WHERE claim_owner = TRUE;

CREATE INDEX IF NOT EXISTS ix_booking_attempt_request
  ON booking_create_attempts (request_id, claimed_at DESC);

CREATE INDEX IF NOT EXISTS ix_booking_attempt_claim
  ON booking_create_attempts (postgres_claim_id, claimed_at ASC);

CREATE INDEX IF NOT EXISTS ix_booking_attempt_trace
  ON booking_create_attempts (runtime_trace_id);

CREATE TABLE IF NOT EXISTS booking_create_outbox (
  outbox_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES booking_create_attempts(attempt_id) ON DELETE RESTRICT,
  projection_payload JSONB NOT NULL,
  status booking_projection_status NOT NULL DEFAULT 'PENDING',
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  last_error_code VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_attempt_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  CONSTRAINT booking_outbox_processed_shape_ck CHECK (
    (status = 'SUCCESS' AND processed_at IS NOT NULL)
    OR
    (status <> 'SUCCESS')
  )
);

-- One final Airtable evidence projection per attempt. Retries update outbox delivery
-- state only; they do not create duplicate evidence intents.
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_outbox_attempt
  ON booking_create_outbox (attempt_id);

CREATE INDEX IF NOT EXISTS ix_booking_outbox_delivery
  ON booking_create_outbox (status, next_attempt_at, created_at);

-- Finalized attempt rows are immutable. The only permitted UPDATE is the one-way
-- transition from unfinalized -> finalized. DELETE is forbidden for all rows.
CREATE OR REPLACE FUNCTION enforce_booking_attempt_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BOOKING_ATTEMPT_DELETE_FORBIDDEN';
  END IF;

  IF OLD.finalized_at IS NOT NULL THEN
    RAISE EXCEPTION 'BOOKING_ATTEMPT_FINALIZED_IMMUTABLE';
  END IF;

  IF NEW.attempt_id <> OLD.attempt_id
     OR NEW.request_id <> OLD.request_id
     OR NEW.idempotency_key <> OLD.idempotency_key
     OR NEW.request_fingerprint <> OLD.request_fingerprint
     OR NEW.postgres_claim_id <> OLD.postgres_claim_id
     OR NEW.claim_owner <> OLD.claim_owner
     OR NEW.writer_commit_sha <> OLD.writer_commit_sha
     OR NEW.runtime_trace_id <> OLD.runtime_trace_id
     OR NEW.claimed_at <> OLD.claimed_at THEN
    RAISE EXCEPTION 'BOOKING_ATTEMPT_IDENTITY_MUTATION_FORBIDDEN';
  END IF;

  IF NEW.finalized_at IS NULL OR NEW.outcome IS NULL THEN
    RAISE EXCEPTION 'BOOKING_ATTEMPT_FINALIZATION_REQUIRED';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_attempt_immutability ON booking_create_attempts;
CREATE TRIGGER trg_booking_attempt_immutability
BEFORE UPDATE OR DELETE ON booking_create_attempts
FOR EACH ROW EXECUTE FUNCTION enforce_booking_attempt_immutability();
