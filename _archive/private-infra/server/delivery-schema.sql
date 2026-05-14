-- server/delivery-schema.sql
-- Sovereign OS Delivery Matrix Immutability Constitution

CREATE TABLE IF NOT EXISTS sovereign_media_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id VARCHAR(50) UNIQUE NOT NULL,
    public_id VARCHAR(50) UNIQUE NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    kind VARCHAR(20) DEFAULT 'image',
    original_filename TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    byte_size BIGINT NOT NULL,
    width INT,
    height INT,
    checksum_sha256 VARCHAR(256),
    storage_key TEXT NOT NULL,
    publication_state VARCHAR(20) DEFAULT 'draft' CHECK (publication_state IN ('draft', 'published', 'archived')),
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public-deliverable')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    replaced_by_asset_id VARCHAR(50)
);

CREATE INDEX idx_media_public_id ON sovereign_media_registry(public_id);
CREATE INDEX idx_media_tenant ON sovereign_media_registry(tenant_id);

-- Optional: Slot Bindings Entegrasyonu İçin
CREATE TABLE IF NOT EXISTS sovereign_slot_bindings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) NOT NULL,
    slot_name VARCHAR(100) NOT NULL,
    asset_id VARCHAR(50) NOT NULL REFERENCES sovereign_media_registry(asset_id),
    preset_policy VARCHAR(50) NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    priority INT DEFAULT 0
);

CREATE INDEX idx_slot_lookup ON sovereign_slot_bindings(tenant_id, slot_name) WHERE is_published = TRUE;
