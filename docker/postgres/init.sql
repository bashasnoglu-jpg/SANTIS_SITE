-- SANTIS Master OS — Production DB Bootstrap
-- Bu script Docker PostgreSQL init.d tarafından otomatik çalıştırılır

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Production settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET wal_buffers = '16MB';

-- Tenant isolation function (RLS için)
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
  SELECT current_setting('app.tenant_id', true)::uuid;
$$ LANGUAGE sql STABLE;

-- App kullanıcısına izin
GRANT ALL ON SCHEMA public TO santis;
