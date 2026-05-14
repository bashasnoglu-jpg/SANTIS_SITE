-- Sprint D / Phase 4: Multi-tenant isolation — event_store.tenant_id
-- Additive migration: safe to re-run. Existing rows → DEFAULT 'santis'.

ALTER TABLE event_store
  ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'santis';

CREATE INDEX IF NOT EXISTS event_store_tenant_idx
  ON event_store (tenant_id);

-- Compound index for the canonical replay query:
-- WHERE tenant_id = $1 AND seq <= $2 ORDER BY seq ASC
CREATE INDEX IF NOT EXISTS event_store_tenant_seq_idx
  ON event_store (tenant_id, seq);
