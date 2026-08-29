CREATE SCHEMA "so";
--> statement-breakpoint
CREATE TYPE "so"."service_order_status" AS ENUM(
	'DRAFT',
	'PREPARED',
	'RELEASED',
	'IN_EXECUTION',
	'COMPLETED',
	'CANCELLED'
);
--> statement-breakpoint
CREATE TYPE "so"."service_order_origin" AS ENUM(
	'SERVICE_REQUEST',
	'PROPOSAL',
	'PURCHASE_ORDER',
	'AUTHORIZED_DIRECT'
);
--> statement-breakpoint
CREATE TABLE "so"."service_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"internal_code" text NOT NULL,
	"order_number" text NOT NULL,
	"unit_id" text NOT NULL,
	"status" "so"."service_order_status" DEFAULT 'DRAFT' NOT NULL,
	"origin" "so"."service_order_origin" NOT NULL,
	"client_id" uuid,
	"client_snapshot" jsonb,
	"service_definition_id" uuid,
	"service_definition_version_id" uuid,
	"service_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description" text,
	"location" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"priority" text,
	"operational_notes" text,
	"service_request_id" uuid,
	"proposal_id" uuid,
	"proposal_snapshot" jsonb,
	"purchase_order_id" uuid,
	"purchase_order_snapshot" jsonb,
	"rc_number" text,
	"contract_reference" text,
	"contract_snapshot" jsonb,
	"row_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_identity_id" uuid NOT NULL,
	"updated_by_identity_id" uuid NOT NULL,
	CONSTRAINT "service_orders_internal_code_not_empty_chk" CHECK (length(trim("so"."service_orders"."internal_code")) > 0),
	CONSTRAINT "service_orders_order_number_not_empty_chk" CHECK (length(trim("so"."service_orders"."order_number")) > 0),
	CONSTRAINT "service_orders_unit_id_not_empty_chk" CHECK (length(trim("so"."service_orders"."unit_id")) > 0),
	CONSTRAINT "service_orders_row_version_positive_chk" CHECK ("so"."service_orders"."row_version" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_orders_internal_code_uidx" ON "so"."service_orders" USING btree ("internal_code");
--> statement-breakpoint
CREATE UNIQUE INDEX "service_orders_order_number_uidx" ON "so"."service_orders" USING btree ("order_number");
--> statement-breakpoint
CREATE UNIQUE INDEX "service_orders_service_request_id_uidx" ON "so"."service_orders" USING btree ("service_request_id") WHERE "service_request_id" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "service_orders_status_idx" ON "so"."service_orders" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "service_orders_unit_id_idx" ON "so"."service_orders" USING btree ("unit_id");
--> statement-breakpoint
CREATE INDEX "service_orders_client_id_idx" ON "so"."service_orders" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX "service_orders_service_request_id_idx" ON "so"."service_orders" USING btree ("service_request_id");
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "pty"."clients"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_service_definition_id_service_definitions_id_fk" FOREIGN KEY ("service_definition_id") REFERENCES "cat"."service_definitions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_service_definition_version_id_service_definition_versions_id_fk" FOREIGN KEY ("service_definition_version_id") REFERENCES "cat"."service_definition_versions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "sr"."service_requests"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "com"."proposals"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "com"."purchase_orders"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_updated_by_identity_id_identities_id_fk" FOREIGN KEY ("updated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "so"."service_order_history_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_order_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actor_identity_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_order_history_events_event_type_not_empty_chk" CHECK (length(trim("so"."service_order_history_events"."event_type")) > 0)
);
--> statement-breakpoint
CREATE INDEX "service_order_history_events_service_order_id_idx" ON "so"."service_order_history_events" USING btree ("service_order_id", "occurred_at");
--> statement-breakpoint
ALTER TABLE "so"."service_order_history_events" ADD CONSTRAINT "service_order_history_events_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "so"."service_orders"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_order_history_events" ADD CONSTRAINT "service_order_history_events_actor_identity_id_identities_id_fk" FOREIGN KEY ("actor_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_requests" ADD CONSTRAINT "service_requests_converted_service_order_id_service_orders_id_fk" FOREIGN KEY ("converted_service_order_id") REFERENCES "so"."service_orders"("id") ON DELETE restrict ON UPDATE cascade;
