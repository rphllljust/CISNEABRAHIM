CREATE TYPE "cat"."operational_labor_type_status" AS ENUM('ACTIVE', 'INACTIVE');
--> statement-breakpoint
CREATE TABLE "cat"."operational_labor_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"status" "cat"."operational_labor_type_status" DEFAULT 'ACTIVE' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone,
	"deactivated_by_identity_id" uuid,
	"created_by_identity_id" uuid,
	"updated_by_identity_id" uuid,
	CONSTRAINT "operational_labor_types_code_not_empty_chk" CHECK (length(trim("cat"."operational_labor_types"."code")) > 0),
	CONSTRAINT "operational_labor_types_code_format_chk" CHECK ("cat"."operational_labor_types"."code" ~ '^[A-Z0-9][A-Z0-9_]{0,63}$'),
	CONSTRAINT "operational_labor_types_name_not_empty_chk" CHECK (length(trim("cat"."operational_labor_types"."name")) > 0),
	CONSTRAINT "operational_labor_types_version_positive_chk" CHECK ("cat"."operational_labor_types"."version" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "operational_labor_types_code_uidx" ON "cat"."operational_labor_types" USING btree ("code");
--> statement-breakpoint
CREATE INDEX "operational_labor_types_status_idx" ON "cat"."operational_labor_types" USING btree ("status");
--> statement-breakpoint
ALTER TABLE "cat"."operational_labor_types" ADD CONSTRAINT "operational_labor_types_deactivated_by_identity_id_identities_id_fk" FOREIGN KEY ("deactivated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."operational_labor_types" ADD CONSTRAINT "operational_labor_types_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."operational_labor_types" ADD CONSTRAINT "operational_labor_types_updated_by_identity_id_identities_id_fk" FOREIGN KEY ("updated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
INSERT INTO "cat"."operational_labor_types" ("code", "name", "status", "version")
VALUES
	('DRIVER', 'Motorista', 'ACTIVE', 1),
	('OPERATOR', 'Operador', 'ACTIVE', 1),
	('HELPER', 'Ajudante', 'ACTIVE', 1),
	('ELECTRICIAN', 'Eletricista', 'ACTIVE', 1),
	('WELDER', 'Soldador', 'ACTIVE', 1),
	('TECHNICIAN', 'Técnico', 'ACTIVE', 1),
	('INSTALLER', 'Instalador', 'ACTIVE', 1),
	('CONSTRUCTION_WORKER', 'Trabalhador de construção', 'ACTIVE', 1),
	('SUPERVISOR', 'Supervisor', 'ACTIVE', 1),
	('OTHER', 'Outra capacidade operacional', 'ACTIVE', 1)
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
CREATE TABLE "cat"."service_labor_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_definition_version_id" uuid NOT NULL,
	"labor_type_code" text NOT NULL,
	"requirement_level" "cat"."requirement_level" NOT NULL,
	"min_quantity" integer DEFAULT 1 NOT NULL,
	"config_schema_version" smallint DEFAULT 1 NOT NULL,
	"config" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_labor_requirements_min_quantity_chk" CHECK ("cat"."service_labor_requirements"."min_quantity" >= 1),
	CONSTRAINT "service_labor_requirements_sort_order_non_negative_chk" CHECK ("cat"."service_labor_requirements"."sort_order" >= 0),
	CONSTRAINT "service_labor_requirements_config_schema_chk" CHECK ("cat"."service_labor_requirements"."config_schema_version" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_labor_requirements_version_type_uidx" ON "cat"."service_labor_requirements" USING btree ("service_definition_version_id","labor_type_code");
--> statement-breakpoint
CREATE INDEX "service_labor_requirements_version_id_idx" ON "cat"."service_labor_requirements" USING btree ("service_definition_version_id");
--> statement-breakpoint
ALTER TABLE "cat"."service_labor_requirements" ADD CONSTRAINT "service_labor_requirements_version_id_fk" FOREIGN KEY ("service_definition_version_id") REFERENCES "cat"."service_definition_versions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_labor_requirements" ADD CONSTRAINT "service_labor_requirements_labor_type_code_fk" FOREIGN KEY ("labor_type_code") REFERENCES "cat"."operational_labor_types"("code") ON DELETE restrict ON UPDATE cascade;
