CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "res";
--> statement-breakpoint
CREATE TYPE "so"."planned_resource_kind" AS ENUM('PHYSICAL_RESOURCE', 'LABOR');
--> statement-breakpoint
CREATE TYPE "so"."planned_resource_status" AS ENUM('PLANNED', 'REMOVED');
--> statement-breakpoint
CREATE TYPE "res"."resource_allocation_status" AS ENUM('ACTIVE', 'REALLOCATED', 'REMOVED');
--> statement-breakpoint
CREATE TABLE "so"."planned_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_order_id" uuid NOT NULL,
	"requirement_kind" "so"."planned_resource_kind" NOT NULL,
	"resource_type_code" text,
	"labor_type_code" text,
	"planned_quantity" numeric(12, 4) NOT NULL,
	"operational_start" timestamp with time zone,
	"operational_end" timestamp with time zone,
	"notes" text,
	"status" "so"."planned_resource_status" NOT NULL DEFAULT 'PLANNED',
	"row_version" integer NOT NULL DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_identity_id" uuid NOT NULL,
	"updated_by_identity_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "so"."planned_resources" ADD CONSTRAINT "planned_resources_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "so"."service_orders"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."planned_resources" ADD CONSTRAINT "planned_resources_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."planned_resources" ADD CONSTRAINT "planned_resources_updated_by_identity_id_identities_id_fk" FOREIGN KEY ("updated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."planned_resources" ADD CONSTRAINT "planned_resources_planned_quantity_positive_chk" CHECK ("planned_quantity" > 0);
--> statement-breakpoint
ALTER TABLE "so"."planned_resources" ADD CONSTRAINT "planned_resources_row_version_positive_chk" CHECK ("row_version" >= 1);
--> statement-breakpoint
ALTER TABLE "so"."planned_resources" ADD CONSTRAINT "planned_resources_kind_code_chk" CHECK (
	("requirement_kind" = 'PHYSICAL_RESOURCE'::"so"."planned_resource_kind" AND "resource_type_code" IS NOT NULL AND length(trim("resource_type_code")) > 0 AND "labor_type_code" IS NULL)
	OR ("requirement_kind" = 'LABOR'::"so"."planned_resource_kind" AND "labor_type_code" IS NOT NULL AND length(trim("labor_type_code")) > 0 AND "resource_type_code" IS NULL)
);
--> statement-breakpoint
ALTER TABLE "so"."planned_resources" ADD CONSTRAINT "planned_resources_operational_window_chk" CHECK (
	("operational_start" IS NULL AND "operational_end" IS NULL)
	OR ("operational_start" IS NOT NULL AND "operational_end" IS NOT NULL AND "operational_start" < "operational_end")
);
--> statement-breakpoint
CREATE INDEX "planned_resources_service_order_id_idx" ON "so"."planned_resources" USING btree ("service_order_id");
--> statement-breakpoint
CREATE TABLE "res"."resource_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_order_id" uuid NOT NULL,
	"planned_resource_id" uuid,
	"physical_asset_id" uuid NOT NULL,
	"resource_type_code" text NOT NULL,
	"operational_start" timestamp with time zone NOT NULL,
	"operational_end" timestamp with time zone NOT NULL,
	"operational_period" tstzrange GENERATED ALWAYS AS (tstzrange("operational_start", "operational_end", '[)')) STORED,
	"status" "res"."resource_allocation_status" NOT NULL DEFAULT 'ACTIVE',
	"row_version" integer NOT NULL DEFAULT 1,
	"allocated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"allocated_by_identity_id" uuid NOT NULL,
	"removed_at" timestamp with time zone,
	"removed_by_identity_id" uuid,
	"reallocated_to_allocation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "res"."resource_allocations" ADD CONSTRAINT "resource_allocations_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "so"."service_orders"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "res"."resource_allocations" ADD CONSTRAINT "resource_allocations_planned_resource_id_planned_resources_id_fk" FOREIGN KEY ("planned_resource_id") REFERENCES "so"."planned_resources"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "res"."resource_allocations" ADD CONSTRAINT "resource_allocations_physical_asset_id_physical_assets_id_fk" FOREIGN KEY ("physical_asset_id") REFERENCES "ast"."physical_assets"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "res"."resource_allocations" ADD CONSTRAINT "resource_allocations_allocated_by_identity_id_identities_id_fk" FOREIGN KEY ("allocated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "res"."resource_allocations" ADD CONSTRAINT "resource_allocations_removed_by_identity_id_identities_id_fk" FOREIGN KEY ("removed_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "res"."resource_allocations" ADD CONSTRAINT "resource_allocations_reallocated_to_allocation_id_fk" FOREIGN KEY ("reallocated_to_allocation_id") REFERENCES "res"."resource_allocations"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "res"."resource_allocations" ADD CONSTRAINT "resource_allocations_operational_window_chk" CHECK ("operational_start" < "operational_end");
--> statement-breakpoint
ALTER TABLE "res"."resource_allocations" ADD CONSTRAINT "resource_allocations_resource_type_code_not_empty_chk" CHECK (length(trim("resource_type_code")) > 0);
--> statement-breakpoint
ALTER TABLE "res"."resource_allocations" ADD CONSTRAINT "resource_allocations_row_version_positive_chk" CHECK ("row_version" >= 1);
--> statement-breakpoint
ALTER TABLE "res"."resource_allocations" ADD CONSTRAINT "resource_allocations_no_overlap_active_excl" EXCLUDE USING gist (
	"physical_asset_id" WITH =,
	"operational_period" WITH &&
) WHERE ("status" = 'ACTIVE'::"res"."resource_allocation_status");
--> statement-breakpoint
CREATE INDEX "resource_allocations_service_order_id_idx" ON "res"."resource_allocations" USING btree ("service_order_id");
--> statement-breakpoint
CREATE INDEX "resource_allocations_physical_asset_id_idx" ON "res"."resource_allocations" USING btree ("physical_asset_id");
--> statement-breakpoint
CREATE TABLE "res"."resource_allocation_history_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_allocation_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actor_identity_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "res"."resource_allocation_history_events" ADD CONSTRAINT "resource_allocation_history_events_allocation_id_fk" FOREIGN KEY ("resource_allocation_id") REFERENCES "res"."resource_allocations"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "res"."resource_allocation_history_events" ADD CONSTRAINT "resource_allocation_history_events_actor_identity_id_fk" FOREIGN KEY ("actor_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "res"."resource_allocation_history_events" ADD CONSTRAINT "resource_allocation_history_events_event_type_not_empty_chk" CHECK (length(trim("event_type")) > 0);
--> statement-breakpoint
CREATE INDEX "resource_allocation_history_events_allocation_id_idx" ON "res"."resource_allocation_history_events" USING btree ("resource_allocation_id", "occurred_at");
