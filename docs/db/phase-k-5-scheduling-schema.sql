-- Phase K-5: Scheduling Schema Draft (PostgreSQL) Hardened
-- DO NOT APPLY YET. For architectural review only.

-- NOTE on Tenant Isolation:
-- tenant_id lacks a foreign key constraint here because the tenants table 
-- is assumed to be part of the Core Auth (Phase J-X) and outside this bounded context.
-- In production, this should ideally reference a tenants(id) or be enforced by RLS.

-- Enums
CREATE TYPE room_type AS ENUM (
    'massage', 'hammam', 'facial', 'couple', 'vip_suite', 'wet_room', 'medical'
);

CREATE TYPE booking_source AS ENUM (
    'manual', 'online', 'hotel_front_desk', 'concierge', 'phone', 'walk_in'
);

CREATE TYPE booking_status AS ENUM (
    'draft', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'
);

-- Core Entities
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    timezone VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);

CREATE TABLE spa_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    default_slot_interval_minutes INT NOT NULL DEFAULT 15 CHECK (default_slot_interval_minutes > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, location_id, name)
);

CREATE TABLE treatment_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    spa_area_id UUID NOT NULL REFERENCES spa_areas(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    room_type room_type NOT NULL,
    capacity INT NOT NULL CHECK (capacity >= 1),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, spa_area_id, name)
);

CREATE TABLE therapists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, location_id, name)
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    cleanup_minutes INT NOT NULL DEFAULT 15 CHECK (cleanup_minutes >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);

-- Compatibilities
CREATE TABLE service_room_compatibilities (
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES treatment_rooms(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    PRIMARY KEY (service_id, room_id)
);

CREATE TABLE service_therapist_compatibilities (
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    PRIMARY KEY (service_id, therapist_id)
);

-- Schedules and Blockers
CREATE TABLE operating_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    UNIQUE (location_id, day_of_week),
    CHECK (close_time > open_time)
);

CREATE TABLE therapist_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    recurrence_rule TEXT,
    CHECK (ends_at > starts_at)
);

CREATE TABLE blockers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    room_id UUID REFERENCES treatment_rooms(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    CHECK (ends_at > starts_at),
    CHECK (room_id IS NOT NULL OR therapist_id IS NOT NULL)
);

-- Booking
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    service_id UUID NOT NULL REFERENCES services(id),
    room_id UUID NOT NULL REFERENCES treatment_rooms(id),
    therapist_id UUID NOT NULL REFERENCES therapists(id),
    service_start_time TIMESTAMPTZ NOT NULL,
    service_end_time TIMESTAMPTZ NOT NULL,
    cleanup_end_time TIMESTAMPTZ NOT NULL,
    booking_source booking_source NOT NULL,
    booking_status booking_status NOT NULL,
    customer_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (service_end_time > service_start_time),
    CHECK (cleanup_end_time >= service_end_time)
);

-- Indexes for performance and isolation
CREATE INDEX idx_treatment_rooms_tenant ON treatment_rooms(tenant_id);
CREATE INDEX idx_therapists_tenant ON therapists(tenant_id);
CREATE INDEX idx_services_tenant ON services(tenant_id);

-- New K-5 Indexes
CREATE INDEX idx_bookings_tenant_room_time ON bookings(tenant_id, room_id, service_start_time, cleanup_end_time);
CREATE INDEX idx_bookings_tenant_therapist_time ON bookings(tenant_id, therapist_id, service_start_time, service_end_time);
CREATE INDEX idx_blockers_tenant_room_time ON blockers(tenant_id, room_id, starts_at, ends_at);
CREATE INDEX idx_blockers_tenant_therapist_time ON blockers(tenant_id, therapist_id, starts_at, ends_at);

-- ==========================================
-- EXCLUSION CONSTRAINT PROPOSAL (PostgreSQL)
-- ==========================================
-- Requires: CREATE EXTENSION IF NOT EXISTS btree_gist;
-- 
-- 1. Prevent overlapping room bookings (including cleanup time) for active statuses:
-- ALTER TABLE bookings 
-- ADD CONSTRAINT no_overlapping_room_bookings 
-- EXCLUDE USING gist (
--     room_id WITH =, 
--     tsrange(service_start_time, cleanup_end_time) WITH &&
-- ) WHERE (booking_status IN ('confirmed', 'checked_in', 'in_progress'));
--
-- 2. Prevent overlapping therapist bookings (service time only) for active statuses:
-- ALTER TABLE bookings 
-- ADD CONSTRAINT no_overlapping_therapist_bookings 
-- EXCLUDE USING gist (
--     therapist_id WITH =, 
--     tsrange(service_start_time, service_end_time) WITH &&
-- ) WHERE (booking_status IN ('confirmed', 'checked_in', 'in_progress'));
--
-- NOTE: If btree_gist is not feasible in the Supabase environment, 
-- this constraint MUST be handled via transactional locking (Phase K-6).

-- ==========================================
-- RLS Policy Draft (Supabase)
-- ==========================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE spa_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_room_compatibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_therapist_compatibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "Isolate tenant locations" ON locations FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'santis' ->> 'tenantId')::uuid);
CREATE POLICY "Isolate tenant spa_areas" ON spa_areas FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'santis' ->> 'tenantId')::uuid);
CREATE POLICY "Isolate tenant treatment_rooms" ON treatment_rooms FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'santis' ->> 'tenantId')::uuid);
CREATE POLICY "Isolate tenant therapists" ON therapists FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'santis' ->> 'tenantId')::uuid);
CREATE POLICY "Isolate tenant services" ON services FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'santis' ->> 'tenantId')::uuid);
CREATE POLICY "Isolate tenant service_room_compatibilities" ON service_room_compatibilities FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'santis' ->> 'tenantId')::uuid);
CREATE POLICY "Isolate tenant service_therapist_compatibilities" ON service_therapist_compatibilities FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'santis' ->> 'tenantId')::uuid);
CREATE POLICY "Isolate tenant operating_hours" ON operating_hours FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'santis' ->> 'tenantId')::uuid);
CREATE POLICY "Isolate tenant therapist_shifts" ON therapist_shifts FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'santis' ->> 'tenantId')::uuid);
CREATE POLICY "Isolate tenant blockers" ON blockers FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'santis' ->> 'tenantId')::uuid);
CREATE POLICY "Isolate tenant bookings" ON bookings FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'santis' ->> 'tenantId')::uuid);

-- ==========================================
-- ROLLBACK NOTES
-- ==========================================
-- DROP TABLE IF EXISTS bookings CASCADE;
-- DROP TABLE IF EXISTS blockers CASCADE;
-- DROP TABLE IF EXISTS therapist_shifts CASCADE;
-- DROP TABLE IF EXISTS operating_hours CASCADE;
-- DROP TABLE IF EXISTS service_therapist_compatibilities CASCADE;
-- DROP TABLE IF EXISTS service_room_compatibilities CASCADE;
-- DROP TABLE IF EXISTS services CASCADE;
-- DROP TABLE IF EXISTS therapists CASCADE;
-- DROP TABLE IF EXISTS treatment_rooms CASCADE;
-- DROP TABLE IF EXISTS spa_areas CASCADE;
-- DROP TABLE IF EXISTS locations CASCADE;
-- DROP TYPE IF EXISTS booking_status;
-- DROP TYPE IF EXISTS booking_source;
-- DROP TYPE IF EXISTS room_type;
