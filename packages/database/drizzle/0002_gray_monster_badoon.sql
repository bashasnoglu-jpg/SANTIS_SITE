CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "booking_hold_status" AS ENUM('active', 'expired', 'released', 'confirmed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "booking_source" AS ENUM('manual', 'online', 'hotel_front_desk', 'concierge', 'phone', 'walk_in');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "booking_status" AS ENUM('draft', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "room_type" AS ENUM('massage', 'hammam', 'facial', 'couple', 'vip_suite', 'wet_room', 'medical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guest_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"intent" varchar(100) NOT NULL,
	"confidence" integer DEFAULT 0,
	"source" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guest_memory_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"memory_text" text NOT NULL,
	"embedding" vector(768),
	"context_metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guest_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"device_fingerprint" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"persona_category" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guest_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"channel" varchar(50) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guest_traits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"value" text NOT NULL,
	"confidence_score" integer DEFAULT 100,
	"source" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blockers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"room_id" uuid,
	"therapist_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"reason" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"service_start_time" timestamp with time zone NOT NULL,
	"service_end_time" timestamp with time zone NOT NULL,
	"cleanup_end_time" timestamp with time zone NOT NULL,
	"hold_token_hash" text NOT NULL,
	"status" "booking_hold_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "booking_holds_hold_token_hash_unique" UNIQUE("hold_token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"service_start_time" timestamp with time zone NOT NULL,
	"service_end_time" timestamp with time zone NOT NULL,
	"cleanup_end_time" timestamp with time zone NOT NULL,
	"booking_source" "booking_source" NOT NULL,
	"booking_status" "booking_status" NOT NULL,
	"customer_info" jsonb DEFAULT '{}' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"timezone" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "operating_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"open_time" time NOT NULL,
	"close_time" time NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_room_compatibilities" (
	"service_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	CONSTRAINT "service_room_compatibilities_service_id_room_id_pk" PRIMARY KEY("service_id","room_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_therapist_compatibilities" (
	"service_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	CONSTRAINT "service_therapist_compatibilities_service_id_therapist_id_pk" PRIMARY KEY("service_id","therapist_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"duration_minutes" integer NOT NULL,
	"cleanup_minutes" integer DEFAULT 15 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spa_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"default_slot_interval_minutes" integer DEFAULT 15 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "therapist_shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"recurrence_rule" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "therapists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "treatment_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"spa_area_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"room_type" "room_type" NOT NULL,
	"capacity" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_intents_guest" ON "guest_intents" ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_intents_confidence" ON "guest_intents" ("confidence");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_intents_tenant" ON "guest_intents" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_memory_guest" ON "guest_memory_embeddings" ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_memory_tenant" ON "guest_memory_embeddings" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_profiles_fingerprint" ON "guest_profiles" ("device_fingerprint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_profiles_tenant" ON "guest_profiles" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_sessions_guest" ON "guest_sessions" ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_sessions_tenant" ON "guest_sessions" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_traits_guest_category" ON "guest_traits" ("guest_id","category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_traits_tenant" ON "guest_traits" ("tenant_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guest_intents" ADD CONSTRAINT "guest_intents_guest_id_guest_profiles_id_fk" FOREIGN KEY ("guest_id") REFERENCES "guest_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guest_memory_embeddings" ADD CONSTRAINT "guest_memory_embeddings_guest_id_guest_profiles_id_fk" FOREIGN KEY ("guest_id") REFERENCES "guest_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_guest_id_guest_profiles_id_fk" FOREIGN KEY ("guest_id") REFERENCES "guest_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guest_traits" ADD CONSTRAINT "guest_traits_guest_id_guest_profiles_id_fk" FOREIGN KEY ("guest_id") REFERENCES "guest_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blockers" ADD CONSTRAINT "blockers_room_id_treatment_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "treatment_rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blockers" ADD CONSTRAINT "blockers_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_holds" ADD CONSTRAINT "booking_holds_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_holds" ADD CONSTRAINT "booking_holds_room_id_treatment_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "treatment_rooms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_holds" ADD CONSTRAINT "booking_holds_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_treatment_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "treatment_rooms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "operating_hours" ADD CONSTRAINT "operating_hours_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_room_compatibilities" ADD CONSTRAINT "service_room_compatibilities_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_room_compatibilities" ADD CONSTRAINT "service_room_compatibilities_room_id_treatment_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "treatment_rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_therapist_compatibilities" ADD CONSTRAINT "service_therapist_compatibilities_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_therapist_compatibilities" ADD CONSTRAINT "service_therapist_compatibilities_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spa_areas" ADD CONSTRAINT "spa_areas_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "therapist_shifts" ADD CONSTRAINT "therapist_shifts_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "therapist_shifts" ADD CONSTRAINT "therapist_shifts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "therapists" ADD CONSTRAINT "therapists_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "treatment_rooms" ADD CONSTRAINT "treatment_rooms_spa_area_id_spa_areas_id_fk" FOREIGN KEY ("spa_area_id") REFERENCES "spa_areas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_memory_embedding_hnsw" ON "guest_memory_embeddings" USING hnsw ("embedding" vector_cosine_ops);
