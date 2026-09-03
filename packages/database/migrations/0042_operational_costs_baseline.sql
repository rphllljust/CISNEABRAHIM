CREATE TYPE "so"."operational_cost_category" AS ENUM(
	'FUEL',
	'THIRD_PARTY',
	'RESOURCE',
	'TRAVEL',
	'MATERIAL',
	'LABOR',
	'OTHER'
);
--> statement-breakpoint
CREATE TYPE "so"."operational_cost_kind" AS ENUM(
	'ESTIMATED',
	'ACTUAL'
);
--> statement-breakpoint
CREATE TYPE "so"."operational_cost_origin" AS ENUM(
	'SERVICE_ORDER',
	'EXECUTION'
);
--> statement-breakpoint
CREATE TABLE "so"."operational_cost_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_order_id" uuid NOT NULL,
	"origin" "so"."operational_cost_origin" NOT NULL,
	"source_execution_entry_id" uuid,
	"category" "so"."operational_cost_category" NOT NULL,
	"cost_kind" "so"."operational_cost_kind" NOT NULL,
	"description" text,
	"amount" numeric(18, 4) NOT NULL,
	"currency_code" char(3) DEFAULT 'BRL' NOT NULL,
	"quantity_value" numeric(18, 6),
	"quantity_unit_code" text,
	"origin_context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actor_identity_id" uuid NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text,
	"row_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "operational_cost_entries_amount_non_negative_chk" CHECK ("amount" >= 0),
	CONSTRAINT "operational_cost_entries_row_version_positive_chk" CHECK ("row_version" >= 1),
	CONSTRAINT "operational_cost_entries_execution_origin_chk" CHECK (
		("origin" = 'EXECUTION'::"so"."operational_cost_origin" AND "source_execution_entry_id" IS NOT NULL)
		OR ("origin" = 'SERVICE_ORDER'::"so"."operational_cost_origin" AND "source_execution_entry_id" IS NULL)
	)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "operational_cost_entries_idempotency_key_uidx" ON "so"."operational_cost_entries" USING btree ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "operational_cost_entries_execution_category_kind_uidx" ON "so"."operational_cost_entries" USING btree ("source_execution_entry_id", "category", "cost_kind") WHERE "source_execution_entry_id" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "operational_cost_entries_service_order_id_idx" ON "so"."operational_cost_entries" USING btree ("service_order_id", "recorded_at");
--> statement-breakpoint
ALTER TABLE "so"."operational_cost_entries" ADD CONSTRAINT "operational_cost_entries_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "so"."service_orders"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."operational_cost_entries" ADD CONSTRAINT "operational_cost_entries_source_execution_entry_id_execution_entries_id_fk" FOREIGN KEY ("source_execution_entry_id") REFERENCES "so"."execution_entries"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."operational_cost_entries" ADD CONSTRAINT "operational_cost_entries_actor_identity_id_identities_id_fk" FOREIGN KEY ("actor_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
