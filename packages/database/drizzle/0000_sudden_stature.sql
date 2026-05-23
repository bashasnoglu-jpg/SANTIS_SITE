CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"actor_type" varchar(32) NOT NULL,
	"actor_id" uuid,
	"operator_id" uuid,
	"event" varchar(255) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"payload_schema_version" integer DEFAULT 1 NOT NULL,
	"request_id" varchar(255),
	"correlation_id" varchar(255),
	"ip_address" varchar(64),
	"user_agent" varchar(255),
	"source" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_tenant_created_idx" ON "audit_logs" ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_tenant_event_created_idx" ON "audit_logs" ("tenant_id","event","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_tenant_actor_created_idx" ON "audit_logs" ("tenant_id","actor_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_correlation_idx" ON "audit_logs" ("correlation_id");