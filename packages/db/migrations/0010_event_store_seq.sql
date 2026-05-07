-- Sprint D: Add monotonic seq column and indexes to event_store
-- This is an additive migration — existing rows will get auto-assigned seq values.
-- APPEND-ONLY: no UPDATE/DELETE allowed on event_store.

ALTER TABLE event_store
  ADD COLUMN IF NOT EXISTS seq SERIAL NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS event_store_seq_idx
  ON event_store (seq);

CREATE INDEX IF NOT EXISTS event_store_occurred_at_idx
  ON event_store (occurred_at);
