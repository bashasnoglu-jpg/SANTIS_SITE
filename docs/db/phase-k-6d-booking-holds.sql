-- Migration: 000X_booking_holds_table.sql
-- Note: This is a draft migration file. It should NOT be applied directly to the database.
-- It will be replaced by the generated Drizzle migration in K-6D-B2.

-- 1. Create Enum
CREATE TYPE "booking_hold_status" AS ENUM ('active', 'expired', 'released', 'confirmed');

-- 2. Create Table
CREATE TABLE IF NOT EXISTS "booking_holds" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "service_id" UUID NOT NULL REFERENCES "services"("id"),
    "room_id" UUID NOT NULL REFERENCES "treatment_rooms"("id"),
    "therapist_id" UUID NOT NULL REFERENCES "therapists"("id"),
    "service_start_time" TIMESTAMPTZ NOT NULL,
    "service_end_time" TIMESTAMPTZ NOT NULL,
    "cleanup_end_time" TIMESTAMPTZ NOT NULL,
    "hold_token_hash" TEXT NOT NULL UNIQUE,
    "status" "booking_hold_status" NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Row Level Security
ALTER TABLE "booking_holds" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for booking_holds" 
ON "booking_holds" 
FOR ALL USING (tenant_id = (SELECT current_setting('request.jwt.claim.tenant_id', true)::uuid));

-- 4. Indexes
CREATE INDEX "idx_booking_holds_tenant_status_expires" 
ON "booking_holds" ("tenant_id", "status", "expires_at");

CREATE INDEX "idx_booking_holds_room_time" 
ON "booking_holds" ("tenant_id", "room_id", "service_start_time", "cleanup_end_time");

CREATE INDEX "idx_booking_holds_therapist_time" 
ON "booking_holds" ("tenant_id", "therapist_id", "service_start_time", "service_end_time");

-- 5. Future Hardening (Documented)
-- Native database exclusion constraints using btree_gist extension.
-- To be applied in a later phase when infrastructure dependencies are approved.
/*
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "booking_holds" 
ADD CONSTRAINT "no_overlapping_holds_per_room"
EXCLUDE USING gist (
    "tenant_id" WITH =,
    "room_id" WITH =,
    tsrange("service_start_time", "cleanup_end_time") WITH &&
)
WHERE ("status" = 'active' AND "expires_at" > now());

ALTER TABLE "booking_holds" 
ADD CONSTRAINT "no_overlapping_holds_per_therapist"
EXCLUDE USING gist (
    "tenant_id" WITH =,
    "therapist_id" WITH =,
    tsrange("service_start_time", "service_end_time") WITH &&
)
WHERE ("status" = 'active' AND "expires_at" > now());
*/
