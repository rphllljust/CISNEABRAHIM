CREATE SCHEMA "ast";
--> statement-breakpoint
CREATE TYPE "ast"."asset_lifecycle_status" AS ENUM('ACTIVE', 'INACTIVE');
--> statement-breakpoint
CREATE TYPE "ast"."asset_allocation_status" AS ENUM('AVAILABLE', 'ALLOCATED');
--> statement-breakpoint
CREATE TABLE "ast"."physical_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_code" text NOT NULL,
	"physical_resource_type_id" uuid NOT NULL,
	"name" text NOT NULL,
	"lifecycle_status" "ast"."asset_lifecycle_status" DEFAULT 'ACTIVE' NOT NULL,
	"allocation_status" "ast"."asset_allocation_status" DEFAULT 'AVAILABLE' NOT NULL,
	"unit_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone,
	"deactivated_by_identity_id" uuid,
	"created_by_identity_id" uuid NOT NULL,
	"updated_by_identity_id" uuid NOT NULL,
	CONSTRAINT "physical_assets_asset_code_not_empty_chk" CHECK (length(trim("ast"."physical_assets"."asset_code")) > 0),
	CONSTRAINT "physical_assets_name_not_empty_chk" CHECK (length(trim("ast"."physical_assets"."name")) > 0),
	CONSTRAINT "physical_assets_unit_id_not_empty_chk" CHECK (length(trim("ast"."physical_assets"."unit_id")) > 0),
	CONSTRAINT "physical_assets_version_positive_chk" CHECK ("ast"."physical_assets"."version" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "physical_assets_asset_code_uidx" ON "ast"."physical_assets" USING btree ("asset_code");
--> statement-breakpoint
CREATE INDEX "physical_assets_unit_id_idx" ON "ast"."physical_assets" USING btree ("unit_id");
--> statement-breakpoint
CREATE INDEX "physical_assets_lifecycle_status_idx" ON "ast"."physical_assets" USING btree ("lifecycle_status");
--> statement-breakpoint
CREATE INDEX "physical_assets_resource_type_id_idx" ON "ast"."physical_assets" USING btree ("physical_resource_type_id");
--> statement-breakpoint
ALTER TABLE "ast"."physical_assets" ADD CONSTRAINT "physical_assets_resource_type_id_physical_resource_types_id_fk" FOREIGN KEY ("physical_resource_type_id") REFERENCES "cat"."physical_resource_types"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "ast"."physical_assets" ADD CONSTRAINT "physical_assets_deactivated_by_identity_id_identities_id_fk" FOREIGN KEY ("deactivated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "ast"."physical_assets" ADD CONSTRAINT "physical_assets_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "ast"."physical_assets" ADD CONSTRAINT "physical_assets_updated_by_identity_id_identities_id_fk" FOREIGN KEY ("updated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "ast"."vehicle_profiles" (
	"asset_id" uuid PRIMARY KEY NOT NULL,
	"normalized_plate" text NOT NULL,
	"plate_display" text NOT NULL,
	"chassis" text,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_profiles_normalized_plate_not_empty_chk" CHECK (length(trim("ast"."vehicle_profiles"."normalized_plate")) > 0),
	CONSTRAINT "vehicle_profiles_plate_display_not_empty_chk" CHECK (length(trim("ast"."vehicle_profiles"."plate_display")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_profiles_normalized_plate_uidx" ON "ast"."vehicle_profiles" USING btree ("normalized_plate");
--> statement-breakpoint
ALTER TABLE "ast"."vehicle_profiles" ADD CONSTRAINT "vehicle_profiles_asset_id_physical_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "ast"."physical_assets"("id") ON DELETE restrict ON UPDATE cascade;
