CREATE TYPE "cat"."unit_of_measure_category" AS ENUM('COUNT', 'TIME', 'LENGTH', 'AREA', 'VOLUME', 'MASS', 'DISTANCE', 'SERVICE');
--> statement-breakpoint
CREATE TYPE "cat"."unit_of_measure_status" AS ENUM('ACTIVE', 'INACTIVE');
--> statement-breakpoint
CREATE TABLE "cat"."units_of_measure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" "cat"."unit_of_measure_category" NOT NULL,
	"decimal_scale" smallint DEFAULT 0 NOT NULL,
	"status" "cat"."unit_of_measure_status" DEFAULT 'ACTIVE' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone,
	"deactivated_by_identity_id" uuid,
	"created_by_identity_id" uuid,
	"updated_by_identity_id" uuid,
	CONSTRAINT "units_of_measure_code_not_empty_chk" CHECK (length(trim("cat"."units_of_measure"."code")) > 0),
	CONSTRAINT "units_of_measure_code_format_chk" CHECK ("cat"."units_of_measure"."code" ~ '^[A-Z0-9][A-Z0-9_]{0,31}$'),
	CONSTRAINT "units_of_measure_name_not_empty_chk" CHECK (length(trim("cat"."units_of_measure"."name")) > 0),
	CONSTRAINT "units_of_measure_decimal_scale_chk" CHECK ("cat"."units_of_measure"."decimal_scale" >= 0 AND "cat"."units_of_measure"."decimal_scale" <= 6),
	CONSTRAINT "units_of_measure_version_positive_chk" CHECK ("cat"."units_of_measure"."version" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "units_of_measure_code_uidx" ON "cat"."units_of_measure" USING btree ("code");
--> statement-breakpoint
CREATE INDEX "units_of_measure_status_idx" ON "cat"."units_of_measure" USING btree ("status");
--> statement-breakpoint
ALTER TABLE "cat"."units_of_measure" ADD CONSTRAINT "units_of_measure_deactivated_by_identity_id_identities_id_fk" FOREIGN KEY ("deactivated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."units_of_measure" ADD CONSTRAINT "units_of_measure_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."units_of_measure" ADD CONSTRAINT "units_of_measure_updated_by_identity_id_identities_id_fk" FOREIGN KEY ("updated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
INSERT INTO "cat"."units_of_measure" ("code", "name", "category", "decimal_scale", "status", "version")
VALUES
	('UN', 'Unidade', 'COUNT', 0, 'ACTIVE', 1),
	('UA', 'Unidade de atendimento', 'COUNT', 0, 'ACTIVE', 1),
	('HOUR', 'Hora', 'TIME', 2, 'ACTIVE', 1),
	('DAY', 'Dia', 'TIME', 0, 'ACTIVE', 1),
	('SHIFT', 'Turno', 'TIME', 0, 'ACTIVE', 1),
	('MONTH', 'Mês', 'TIME', 0, 'ACTIVE', 1),
	('KM', 'Quilômetro', 'DISTANCE', 3, 'ACTIVE', 1),
	('M', 'Metro', 'LENGTH', 3, 'ACTIVE', 1),
	('M2', 'Metro quadrado', 'AREA', 3, 'ACTIVE', 1),
	('M3', 'Metro cúbico', 'VOLUME', 3, 'ACTIVE', 1),
	('TON', 'Tonelada', 'MASS', 3, 'ACTIVE', 1),
	('TRIP', 'Viagem', 'COUNT', 0, 'ACTIVE', 1),
	('SERVICE', 'Serviço', 'SERVICE', 0, 'ACTIVE', 1)
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "cat"."service_allowed_units" ADD CONSTRAINT "service_allowed_units_unit_code_units_of_measure_code_fk" FOREIGN KEY ("unit_code") REFERENCES "cat"."units_of_measure"("code") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_definition_versions" ADD CONSTRAINT "service_definition_versions_default_unit_code_units_of_measure_code_fk" FOREIGN KEY ("default_unit_code") REFERENCES "cat"."units_of_measure"("code") ON DELETE restrict ON UPDATE cascade;
