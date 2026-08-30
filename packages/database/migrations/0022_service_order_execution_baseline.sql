ALTER TYPE "so"."service_order_status" ADD VALUE IF NOT EXISTS 'PAUSED';
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD COLUMN "started_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD COLUMN "started_by_identity_id" uuid;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD COLUMN "paused_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD COLUMN "paused_by_identity_id" uuid;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD COLUMN "completed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD COLUMN "completed_by_identity_id" uuid;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_started_by_identity_id_identities_id_fk" FOREIGN KEY ("started_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_paused_by_identity_id_identities_id_fk" FOREIGN KEY ("paused_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_completed_by_identity_id_identities_id_fk" FOREIGN KEY ("completed_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_started_at_when_in_execution_chk" CHECK (
	"status" NOT IN ('IN_EXECUTION'::"so"."service_order_status", 'PAUSED'::"so"."service_order_status", 'COMPLETED'::"so"."service_order_status")
	OR "started_at" IS NOT NULL
);
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_completed_at_when_completed_chk" CHECK (
	"status" <> 'COMPLETED'::"so"."service_order_status"
	OR "completed_at" IS NOT NULL
);
--> statement-breakpoint
CREATE TYPE "so"."execution_entry_type" AS ENUM(
	'QUANTITY',
	'MILEAGE',
	'HOUR_METER',
	'OBSERVATION',
	'OCCURRENCE'
);
--> statement-breakpoint
CREATE TABLE "so"."execution_command_idempotency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_order_id" uuid NOT NULL,
	"command_name" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"response_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "execution_command_idempotency_command_name_not_empty_chk" CHECK (length(trim("command_name")) > 0),
	CONSTRAINT "execution_command_idempotency_idempotency_key_not_empty_chk" CHECK (length(trim("idempotency_key")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "execution_command_idempotency_uidx" ON "so"."execution_command_idempotency" USING btree ("service_order_id", "command_name", "idempotency_key");
--> statement-breakpoint
CREATE INDEX "execution_command_idempotency_service_order_id_idx" ON "so"."execution_command_idempotency" USING btree ("service_order_id");
--> statement-breakpoint
ALTER TABLE "so"."execution_command_idempotency" ADD CONSTRAINT "execution_command_idempotency_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "so"."service_orders"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "so"."execution_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_order_id" uuid NOT NULL,
	"entry_type" "so"."execution_entry_type" NOT NULL,
	"evidence_kind" text,
	"quantity_value" numeric,
	"quantity_unit_code" text,
	"text_value" text,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actor_identity_id" uuid NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text,
	"row_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "execution_entries_row_version_positive_chk" CHECK ("row_version" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "execution_entries_idempotency_key_uidx" ON "so"."execution_entries" USING btree ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "execution_entries_service_order_id_idx" ON "so"."execution_entries" USING btree ("service_order_id", "recorded_at");
--> statement-breakpoint
ALTER TABLE "so"."execution_entries" ADD CONSTRAINT "execution_entries_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "so"."service_orders"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."execution_entries" ADD CONSTRAINT "execution_entries_actor_identity_id_identities_id_fk" FOREIGN KEY ("actor_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "so"."execution_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_order_id" uuid NOT NULL,
	"evidence_kind" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actor_identity_id" uuid NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text,
	CONSTRAINT "execution_evidence_evidence_kind_not_empty_chk" CHECK (length(trim("evidence_kind")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "execution_evidence_idempotency_key_uidx" ON "so"."execution_evidence" USING btree ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "execution_evidence_service_order_id_idx" ON "so"."execution_evidence" USING btree ("service_order_id", "evidence_kind", "recorded_at");
--> statement-breakpoint
ALTER TABLE "so"."execution_evidence" ADD CONSTRAINT "execution_evidence_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "so"."service_orders"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."execution_evidence" ADD CONSTRAINT "execution_evidence_actor_identity_id_identities_id_fk" FOREIGN KEY ("actor_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "so"."execution_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_order_id" uuid NOT NULL,
	"occurrence_code" text NOT NULL,
	"description" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actor_identity_id" uuid NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text,
	CONSTRAINT "execution_occurrences_occurrence_code_not_empty_chk" CHECK (length(trim("occurrence_code")) > 0),
	CONSTRAINT "execution_occurrences_description_not_empty_chk" CHECK (length(trim("description")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "execution_occurrences_idempotency_key_uidx" ON "so"."execution_occurrences" USING btree ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "execution_occurrences_service_order_id_idx" ON "so"."execution_occurrences" USING btree ("service_order_id", "recorded_at");
--> statement-breakpoint
ALTER TABLE "so"."execution_occurrences" ADD CONSTRAINT "execution_occurrences_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "so"."service_orders"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."execution_occurrences" ADD CONSTRAINT "execution_occurrences_actor_identity_id_identities_id_fk" FOREIGN KEY ("actor_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "so"."execution_entry_history_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_entry_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actor_identity_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "execution_entry_history_events_event_type_not_empty_chk" CHECK (length(trim("event_type")) > 0)
);
--> statement-breakpoint
CREATE INDEX "execution_entry_history_events_execution_entry_id_idx" ON "so"."execution_entry_history_events" USING btree ("execution_entry_id", "occurred_at");
--> statement-breakpoint
ALTER TABLE "so"."execution_entry_history_events" ADD CONSTRAINT "execution_entry_history_events_execution_entry_id_execution_entries_id_fk" FOREIGN KEY ("execution_entry_id") REFERENCES "so"."execution_entries"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."execution_entry_history_events" ADD CONSTRAINT "execution_entry_history_events_actor_identity_id_identities_id_fk" FOREIGN KEY ("actor_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
