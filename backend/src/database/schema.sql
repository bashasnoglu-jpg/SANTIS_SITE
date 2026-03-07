-- SANTIS V9 PostgreSQL Master Schema (B2B Multi-Tenant SaaS)
-- Deployed: 2026-02-22 (HQ OS Implementation Phase)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. SAAS CORE: TENANTS (The Parent Companies/Groups)
-- Example: "Delphin Hotels Group", "Titanic Resorts"
-- =========================================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(50),
    subscription_tier VARCHAR(30) DEFAULT 'PRO', -- ESSENTIAL, PRO, ENTERPRISE
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- 2. SAAS CORE: USERS (RBAC Authentication System)
-- =========================================================================
-- Roles: SUPER_ADMIN (HQ), TENANT_ADMIN (Group Director), HOTEL_MANAGER (Branch), STAFF (Reception)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for SUPER_ADMIN
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120),
    role VARCHAR(30) NOT NULL DEFAULT 'STAFF',
    assigned_hotel_id UUID, -- Specific branch isolation if needed. Checked against hotels.id
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- 3. HOTELS (The Physical Branches)
-- =========================================================================
CREATE TABLE IF NOT EXISTS hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- Absolute strict isolation
    slug VARCHAR(60) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    country VARCHAR(3) DEFAULT 'TR',
    city VARCHAR(60),
    hotel_type VARCHAR(30),
    spa_rooms INT DEFAULT 1,
    whatsapp_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- 4. GLOBAL SERVICES (The HQ Core Database of Treatments)
-- =========================================================================
-- These are master definitions controlled by HQ. Tenants create pricing based on these.
CREATE TABLE IF NOT EXISTS global_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    category VARCHAR(50),
    base_duration_min INT NOT NULL
);

-- =========================================================================
-- 5. ISOLATED HOTEL SERVICES (Tenant Customizations)
-- =========================================================================
CREATE TABLE IF NOT EXISTS hotel_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- Ensure data destruction on tenant removal
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    service_id UUID REFERENCES global_services(id),
    custom_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(hotel_id, service_id)
);

-- =========================================================================
-- 6. RESERVATIONS (The Core Transaction Engine)
-- =========================================================================
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- Multi-tenant strict row-level filter target
    hotel_id UUID REFERENCES hotels(id) ON DELETE RESTRICT,
    service_id UUID REFERENCES global_services(id),
    guest_name VARCHAR(150),
    room_number VARCHAR(20),
    time_slot TIMESTAMP WITH TIME ZONE NOT NULL,
    price_charged DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    ai_offer_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================================================
-- 7. SANTIS DATA ENGINE (The Master Analytics / AI Logs)
-- =========================================================================
CREATE TABLE IF NOT EXISTS guest_events (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id UUID REFERENCES hotels(id),
    session_id VARCHAR(100) NOT NULL,
    country_code VARCHAR(3),
    device_type VARCHAR(20),
    source VARCHAR(50),
    action_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- =========================================================================
-- 8. SECURITY & COMPLIANCE (Audit Logs)
-- =========================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id), -- The person who did it
    action VARCHAR(100) NOT NULL, -- e.g., 'UPDATE_RESERVATION_STATUS', 'SETUP_NEW_ROOM'
    table_name VARCHAR(50) NOT NULL,
    record_id UUID, -- ID of the record changed
    old_values JSONB, -- Previous state
    new_values JSONB, -- New state
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- 9. AI OFFER ENGINE (Campaign Rules)
-- =========================================================================
CREATE TABLE IF NOT EXISTS ai_campaign_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_type_target VARCHAR(50), -- e.g., 'family', 'luxury', 'adults-only', 'ANY'
    time_window_start TIME, -- e.g., '20:00:00'
    time_window_end TIME, -- e.g., '02:00:00'
    suggested_service_category VARCHAR(50) NOT NULL, -- The category to recommend (e.g., 'wellness')
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE
);

-- =========================================================================
-- 10. DATABASE INTELLIGENCE (Indexes)
-- =========================================================================
-- Composite Index for fast reporting on guest events per tenant per time
CREATE INDEX IF NOT EXISTS idx_guest_events_tenant_time ON guest_events (tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_hotel_date ON reservations (hotel_id, created_at DESC);

-- =========================================================================
-- 11. HQ MASTER VIEWS (Pre-calculated Dashboard Feeds)
-- =========================================================================
-- A fast read-replica style view for the Live Feed
CREATE OR REPLACE VIEW v_hq_reservation_feed AS
SELECT 
    r.id AS reservation_id,
    t.company_name AS tenant_name,
    h.name AS hotel_name,
    h.city AS region,
    r.room_number,
    gs.name AS service_name,
    gs.category AS service_category,
    r.price_charged,
    r.status,
    r.time_slot,
    r.created_at
FROM reservations r
JOIN tenants t ON r.tenant_id = t.id
JOIN hotels h ON r.hotel_id = h.id
JOIN global_services gs ON r.service_id = gs.id;

-- =========================================================================
-- 12. RLS (Row Level Security) Enablers for PostgreSQL
-- =========================================================================
-- (Requires enabling RLS per table in production for strict app-level security)
-- ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_policy ON reservations
--     USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- =========================================================================
-- INITIAL SEED DATA FOR DEMO & HQ DASHBOARD (Santis V9 Multi-Tenant Demo)
-- =========================================================================

-- Seed Tenants
INSERT INTO tenants (id, company_name, tax_id, subscription_tier) VALUES 
('10000000-0000-0000-0000-000000000001', 'Delphin Hotels Group', 'TR-101', 'ENTERPRISE'),
('20000000-0000-0000-0000-000000000002', 'Titanic Resorts Group', 'TR-202', 'ENTERPRISE'),
('30000000-0000-0000-0000-000000000003', 'Rixos Premium Group', 'TR-303', 'PRO'),
('40000000-0000-0000-0000-000000000004', 'Budva Luxury Spa', 'ME-404', 'ESSENTIAL')
ON CONFLICT DO NOTHING;

-- Seed Hotels
INSERT INTO hotels (id, tenant_id, name, slug, country, city, hotel_type) VALUES 
('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Delphin Imperial', 'delphin-imperial', 'TR', 'Antalya', 'adults-only'),
('12000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Delphin Be Grand', 'delphin-begrand', 'TR', 'Antalya', 'family'),
('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Titanic Mardan Palace', 'titanic-mardan', 'TR', 'Antalya', 'luxury'),
('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'Rixos Premium Belek', 'rixos-premium', 'TR', 'Antalya', 'luxury'),
('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 'Budva Central Spa', 'budva-central', 'ME', 'Budva', 'wellness')
ON CONFLICT DO NOTHING;

-- Seed Global Services
INSERT INTO global_services (id, name, category, base_duration_min) VALUES 
('a0000000-0000-0000-0000-000000000001', 'Couple Romance Ritual', 'ritual', 90),
('a0000000-0000-0000-0000-000000000002', 'Mom & Kids Relax', 'family', 60),
('a0000000-0000-0000-0000-000000000003', 'Turkish Hammam', 'traditional', 45),
('a0000000-0000-0000-0000-000000000004', 'Deep Tissue Massage', 'massage', 60),
('a0000000-0000-0000-0000-000000000005', 'Jet Lag Recovery', 'wellness', 90),
('a0000000-0000-0000-0000-000000000006', 'Glow Facial', 'skincare', 45)
ON CONFLICT DO NOTHING;

-- Seed Dummy reservations explicitly for today so the HQ board looks active
INSERT INTO reservations (tenant_id, hotel_id, service_id, guest_name, room_number, time_slot, price_charged, status, created_at) VALUES 
('10000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'Guest 1', 'Room 414', NOW() + interval '1 hour', 122.00, 'PENDING', NOW() - interval '1 minute'),
('10000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Guest 2', 'Room 513', NOW() + interval '2 hours', 102.00, 'PENDING', NOW() - interval '2 minutes'),
('20000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Guest 3', 'Room 120', NOW() + interval '3 hours', 177.00, 'CONFIRMED', NOW() - interval '5 minutes'),
('10000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006', 'Guest 4', 'Room 798', NOW() + interval '1 hour', 77.00, 'CONFIRMED', NOW() - interval '8 minutes'),
('40000000-0000-0000-0000-000000000004', '41000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'Guest 5', 'Room 627', NOW() + interval '4 hours', 148.00, 'PENDING', NOW() - interval '12 minutes'),
('20000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'Guest 6', 'Room 635', NOW() + interval '5 hours', 206.00, 'CONFIRMED', NOW() - interval '15 minutes'),
('30000000-0000-0000-0000-000000000003', '31000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Guest 7', 'Room 285', NOW() + interval '2 hours', 173.00, 'PENDING', NOW() - interval '20 minutes');
