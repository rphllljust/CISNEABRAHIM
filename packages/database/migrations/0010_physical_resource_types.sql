CREATE TYPE "cat"."physical_resource_classification" AS ENUM('VEHICLE', 'MACHINE', 'EQUIPMENT', 'CONSUMABLE', 'MATERIAL');
--> statement-breakpoint
CREATE TYPE "cat"."physical_resource_type_status" AS ENUM('ACTIVE', 'INACTIVE');
--> statement-breakpoint
ALTER TYPE "cat"."requirement_level" ADD VALUE 'CONDITIONAL';
--> statement-breakpoint
CREATE TABLE "cat"."physical_resource_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"classification" "cat"."physical_resource_classification" NOT NULL,
	"status" "cat"."physical_resource_type_status" DEFAULT 'ACTIVE' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone,
	"deactivated_by_identity_id" uuid,
	"created_by_identity_id" uuid,
	"updated_by_identity_id" uuid,
	CONSTRAINT "physical_resource_types_code_not_empty_chk" CHECK (length(trim("cat"."physical_resource_types"."code")) > 0),
	CONSTRAINT "physical_resource_types_code_format_chk" CHECK ("cat"."physical_resource_types"."code" ~ '^[A-Z0-9][A-Z0-9_]{0,63}$'),
	CONSTRAINT "physical_resource_types_name_not_empty_chk" CHECK (length(trim("cat"."physical_resource_types"."name")) > 0),
	CONSTRAINT "physical_resource_types_version_positive_chk" CHECK ("cat"."physical_resource_types"."version" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "physical_resource_types_code_uidx" ON "cat"."physical_resource_types" USING btree ("code");
--> statement-breakpoint
CREATE INDEX "physical_resource_types_status_idx" ON "cat"."physical_resource_types" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "physical_resource_types_classification_idx" ON "cat"."physical_resource_types" USING btree ("classification");
--> statement-breakpoint
ALTER TABLE "cat"."physical_resource_types" ADD CONSTRAINT "physical_resource_types_deactivated_by_identity_id_identities_id_fk" FOREIGN KEY ("deactivated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."physical_resource_types" ADD CONSTRAINT "physical_resource_types_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."physical_resource_types" ADD CONSTRAINT "physical_resource_types_updated_by_identity_id_identities_id_fk" FOREIGN KEY ("updated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
INSERT INTO "cat"."physical_resource_types" ("code", "name", "classification", "status", "version")
VALUES
	('CAR', 'Automóvel', 'VEHICLE', 'ACTIVE', 1),
	('TRUCK', 'Caminhão', 'VEHICLE', 'ACTIVE', 1),
	('WATER_TRUCK', 'Caminhão pipa', 'VEHICLE', 'ACTIVE', 1),
	('BUS', 'Ônibus', 'VEHICLE', 'ACTIVE', 1),
	('MOTORCYCLE', 'Motocicleta', 'VEHICLE', 'ACTIVE', 1),
	('GRADER', 'Motoniveladora', 'MACHINE', 'ACTIVE', 1),
	('EXCAVATOR', 'Escavadeira', 'MACHINE', 'ACTIVE', 1),
	('LOADER', 'Pá carregadeira', 'MACHINE', 'ACTIVE', 1),
	('COMPACTOR', 'Compactador', 'MACHINE', 'ACTIVE', 1),
	('LIFTING_EQUIPMENT', 'Equipamento de içamento', 'EQUIPMENT', 'ACTIVE', 1),
	('WELDING_EQUIPMENT', 'Equipamento de solda', 'EQUIPMENT', 'ACTIVE', 1),
	('ELECTRICAL_EQUIPMENT', 'Equipamento elétrico', 'EQUIPMENT', 'ACTIVE', 1),
	('DRILLING_EQUIPMENT', 'Equipamento de perfuração', 'EQUIPMENT', 'ACTIVE', 1),
	('GENERATOR', 'Gerador', 'EQUIPMENT', 'ACTIVE', 1),
	('CONSTRUCTION_EQUIPMENT', 'Equipamento de construção', 'EQUIPMENT', 'ACTIVE', 1),
	('MATERIAL', 'Material', 'MATERIAL', 'ACTIVE', 1),
	('OTHER', 'Outro recurso físico', 'EQUIPMENT', 'ACTIVE', 1)
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
DELETE FROM "cat"."service_resource_requirements";
--> statement-breakpoint
DROP INDEX IF EXISTS "cat"."service_resource_requirements_version_kind_level_uidx";
--> statement-breakpoint
ALTER TABLE "cat"."service_resource_requirements" DROP COLUMN IF EXISTS "resource_kind";
--> statement-breakpoint
ALTER TABLE "cat"."service_resource_requirements" ADD COLUMN "physical_resource_type_code" text NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "service_resource_requirements_version_type_uidx" ON "cat"."service_resource_requirements" USING btree ("service_definition_version_id","physical_resource_type_code");
--> statement-breakpoint
ALTER TABLE "cat"."service_resource_requirements" ADD CONSTRAINT "service_resource_requirements_type_code_fk" FOREIGN KEY ("physical_resource_type_code") REFERENCES "cat"."physical_resource_types"("code") ON DELETE restrict ON UPDATE cascade;
