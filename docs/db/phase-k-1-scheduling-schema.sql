-- Phase K-1: Scheduling Schema Draft (PostgreSQL)
-- DO NOT APPLY YET. For architectural review only.

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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE spa_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    default_slot_interval_minutes INT NOT NULL DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE therapists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    cleanup_minutes INT NOT NULL DEFAULT 15 CHECK (cleanup_minutes >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
    UNIQUE (location_id, day_of_week)
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
    CHECK (room_id IS NOT NULL OR therapist_id IS NOT NULL) -- Must block something
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
CREATE INDEX idx_bookings_tenant_time ON bookings(tenant_id, service_start_time, cleanup_end_time);

-- RLS Policy Draft (to be implemented on Supabase)
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Isolate tenant bookings" ON bookings FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');
