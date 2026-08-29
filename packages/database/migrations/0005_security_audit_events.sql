CREATE SCHEMA IF NOT EXISTS "audit";
--> statement-breakpoint
CREATE TYPE "audit"."security_audit_classification" AS ENUM('SECURITY_CRITICAL', 'SECURITY_STANDARD');
--> statement-breakpoint
CREATE TYPE "audit"."security_audit_outcome" AS ENUM('SUCCESS', 'FAILURE', 'DENIED');
--> statement-breakpoint
CREATE TABLE "audit"."security_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_identity_id" uuid,
	"actor_session_id" uuid,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"outcome" "audit"."security_audit_outcome" NOT NULL,
	"scope_type" text,
	"correlation_id" text,
	"reason_code" text,
	"classification" "audit"."security_audit_classification" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "security_audit_events_action_not_empty_chk" CHECK (length(trim("audit"."security_audit_events"."action")) > 0),
	CONSTRAINT "security_audit_events_resource_type_not_empty_chk" CHECK (length(trim("audit"."security_audit_events"."resource_type")) > 0),
	CONSTRAINT "security_audit_events_correlation_id_length_chk" CHECK ("correlation_id" IS NULL OR length("correlation_id") <= 64)
);
--> statement-breakpoint
ALTER TABLE "audit"."security_audit_events" ADD CONSTRAINT "security_audit_events_actor_identity_id_identities_id_fk" FOREIGN KEY ("actor_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE INDEX "security_audit_events_occurred_at_idx" ON "audit"."security_audit_events" USING btree ("occurred_at");
--> statement-breakpoint
CREATE INDEX "security_audit_events_actor_identity_id_idx" ON "audit"."security_audit_events" USING btree ("actor_identity_id");
--> statement-breakpoint
CREATE INDEX "security_audit_events_correlation_id_idx" ON "audit"."security_audit_events" USING btree ("correlation_id");
--> statement-breakpoint
CREATE INDEX "security_audit_events_action_idx" ON "audit"."security_audit_events" USING btree ("action");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "audit".prevent_security_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'security_audit_events is append-only';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "security_audit_events_no_update"
BEFORE UPDATE OR DELETE ON "audit"."security_audit_events"
FOR EACH ROW
EXECUTE FUNCTION "audit".prevent_security_audit_mutation();
