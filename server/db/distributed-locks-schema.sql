-- =====================================================================
-- SOVEREIGN OS: UPLOAD SEALS & DISTRIBUTED LOCKS
-- =====================================================================

CREATE TABLE IF NOT EXISTS sovereign_upload_seals (
    upload_id VARCHAR(128) PRIMARY KEY,
    asset_id VARCHAR(128) NOT NULL,
    tenant_id VARCHAR(128) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    checksum_sha256 VARCHAR(255),
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sovereign_seals_expires_at 
ON sovereign_upload_seals (expires_at);
