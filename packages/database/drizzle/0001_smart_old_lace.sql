ALTER TABLE "audit_logs" RENAME COLUMN "actor_id" TO "actor_operator_id";--> statement-breakpoint
ALTER TABLE "audit_logs" RENAME COLUMN "event" TO "action";--> statement-breakpoint
ALTER TABLE "audit_logs" RENAME COLUMN "ip_address" TO "ip_hash";--> statement-breakpoint
ALTER TABLE "audit_logs" RENAME COLUMN "user_agent" TO "user_agent_hash";--> statement-breakpoint
DROP INDEX IF EXISTS "audit_log_tenant_created_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "audit_log_tenant_event_created_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "audit_log_tenant_actor_created_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "audit_log_correlation_idx";--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "actor_type" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "payload" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "source" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "action" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "action" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "user_agent_hash" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "resource_id" varchar(255);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "resource_type" varchar(255);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_tenant_created" ON "audit_logs" ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_tenant_action_created" ON "audit_logs" ("tenant_id","action","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_tenant_resource" ON "audit_logs" ("tenant_id","resource_type","resource_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor_created" ON "audit_logs" ("actor_operator_id","created_at");--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "operator_id";

-- Apply Row Level Security and Tenant Isolation for Audit Logs
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolate tenant audit logs" ON "audit_logs" FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'santis' ->> 'tenantId')::uuid);