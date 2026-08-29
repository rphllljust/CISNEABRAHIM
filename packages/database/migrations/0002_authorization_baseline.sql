CREATE SCHEMA "authorization";
--> statement-breakpoint
CREATE TYPE "authorization"."authz_scope_type" AS ENUM('GLOBAL', 'OWN', 'PLATFORM');--> statement-breakpoint
CREATE TYPE "authorization"."authz_decision_type" AS ENUM('ALLOW', 'DENY');--> statement-breakpoint
CREATE TABLE "authorization"."grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" uuid NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"scope_type" "authorization"."authz_scope_type" NOT NULL,
	"constraints" jsonb,
	"granted_by_identity_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoked_by_identity_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grants_action_not_empty_chk" CHECK (length(trim("authorization"."grants"."action")) > 0),
	CONSTRAINT "grants_resource_type_not_empty_chk" CHECK (length(trim("authorization"."grants"."resource_type")) > 0),
	CONSTRAINT "grants_version_positive_chk" CHECK ("authorization"."grants"."version" >= 1),
	CONSTRAINT "grants_valid_until_after_valid_from_chk" CHECK ("authorization"."grants"."valid_until" IS NULL OR "authorization"."grants"."valid_until" > "authorization"."grants"."valid_from"),
	CONSTRAINT "grants_revoked_at_after_created_chk" CHECK ("authorization"."grants"."revoked_at" IS NULL OR "authorization"."grants"."revoked_at" >= "authorization"."grants"."created_at")
);
--> statement-breakpoint
CREATE TABLE "authorization"."decision_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" uuid,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"decision" "authorization"."authz_decision_type" NOT NULL,
	"reason_code" text NOT NULL,
	"correlation_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "decision_audits_action_not_empty_chk" CHECK (length(trim("authorization"."decision_audits"."action")) > 0),
	CONSTRAINT "decision_audits_resource_type_not_empty_chk" CHECK (length(trim("authorization"."decision_audits"."resource_type")) > 0),
	CONSTRAINT "decision_audits_reason_code_not_empty_chk" CHECK (length(trim("authorization"."decision_audits"."reason_code")) > 0)
);
--> statement-breakpoint
ALTER TABLE "authorization"."grants" ADD CONSTRAINT "grants_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "authorization"."grants" ADD CONSTRAINT "grants_granted_by_identity_id_identities_id_fk" FOREIGN KEY ("granted_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "authorization"."grants" ADD CONSTRAINT "grants_revoked_by_identity_id_identities_id_fk" FOREIGN KEY ("revoked_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "authorization"."decision_audits" ADD CONSTRAINT "decision_audits_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "identity"."identities"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "grants_identity_action_idx" ON "authorization"."grants" USING btree ("identity_id","action","resource_type");--> statement-breakpoint
CREATE INDEX "grants_identity_active_idx" ON "authorization"."grants" USING btree ("identity_id");--> statement-breakpoint
CREATE INDEX "decision_audits_identity_id_idx" ON "authorization"."decision_audits" USING btree ("identity_id");--> statement-breakpoint
CREATE INDEX "decision_audits_created_at_idx" ON "authorization"."decision_audits" USING btree ("created_at");
