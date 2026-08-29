CREATE SCHEMA "cat";
--> statement-breakpoint
CREATE TYPE "cat"."service_category_status" AS ENUM('ACTIVE', 'INACTIVE');
--> statement-breakpoint
CREATE TYPE "cat"."service_definition_lineage_status" AS ENUM('ACTIVE', 'INACTIVE');
--> statement-breakpoint
CREATE TYPE "cat"."service_definition_version_status" AS ENUM('DRAFT', 'ACTIVE', 'RETIRED');
--> statement-breakpoint
CREATE TYPE "cat"."operational_archetype" AS ENUM('RENTAL', 'TRANSPORT', 'CIVIL_WORK', 'INSTALLATION', 'MAINTENANCE', 'INDUSTRIAL_SERVICE', 'FACILITY_SERVICE', 'COMMERCIAL_REPRESENTATION', 'GOODS_TRADE', 'LABOR_SERVICE', 'WASTE_SERVICE', 'MARITIME_SUPPORT');
--> statement-breakpoint
CREATE TYPE "cat"."legal_classification_scheme" AS ENUM('CNAE', 'NCM', 'OTHER');
--> statement-breakpoint
CREATE TYPE "cat"."measurement_mode" AS ENUM('BY_PERIOD', 'BY_QUANTITY', 'BY_EVENT', 'CHECKLIST');
--> statement-breakpoint
CREATE TYPE "cat"."pricing_model_code" AS ENUM('FIXED', 'PER_UNIT', 'PER_PERIOD', 'PER_TRIP', 'TIERED', 'CONTRACT_REFERENCE');
--> statement-breakpoint
CREATE TYPE "cat"."resource_kind" AS ENUM('VEHICLE', 'OPERATOR', 'EQUIPMENT', 'TEAM', 'OTHER');
--> statement-breakpoint
CREATE TYPE "cat"."evidence_kind" AS ENUM('PHOTO', 'CHECKLIST', 'SIGNATURE', 'HOUR_METER', 'DOCUMENT', 'OTHER');
--> statement-breakpoint
CREATE TYPE "cat"."requirement_level" AS ENUM('REQUIRED', 'OPTIONAL');
--> statement-breakpoint
CREATE TABLE "cat"."service_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "cat"."service_category_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone,
	"deactivated_by_identity_id" uuid,
	"created_by_identity_id" uuid NOT NULL,
	"updated_by_identity_id" uuid NOT NULL,
	CONSTRAINT "service_categories_code_not_empty_chk" CHECK (length(trim("cat"."service_categories"."code")) > 0),
	CONSTRAINT "service_categories_code_format_chk" CHECK ("cat"."service_categories"."code" ~ '^[A-Z0-9][A-Z0-9_-]{1,63}$'),
	CONSTRAINT "service_categories_name_not_empty_chk" CHECK (length(trim("cat"."service_categories"."name")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_categories_code_uidx" ON "cat"."service_categories" USING btree ("code");
--> statement-breakpoint
CREATE INDEX "service_categories_status_idx" ON "cat"."service_categories" USING btree ("status");
--> statement-breakpoint
CREATE TABLE "cat"."service_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"status" "cat"."service_definition_lineage_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone,
	"deactivated_by_identity_id" uuid,
	"deactivation_reason" text,
	"created_by_identity_id" uuid NOT NULL,
	"updated_by_identity_id" uuid NOT NULL,
	CONSTRAINT "service_definitions_code_not_empty_chk" CHECK (length(trim("cat"."service_definitions"."code")) > 0),
	CONSTRAINT "service_definitions_code_format_chk" CHECK ("cat"."service_definitions"."code" ~ '^[A-Z0-9][A-Z0-9_-]{1,63}$')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_definitions_code_uidx" ON "cat"."service_definitions" USING btree ("code");
--> statement-breakpoint
CREATE INDEX "service_definitions_status_idx" ON "cat"."service_definitions" USING btree ("status");
--> statement-breakpoint
CREATE TABLE "cat"."service_definition_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_definition_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" "cat"."service_definition_version_status" DEFAULT 'DRAFT' NOT NULL,
	"category_id" uuid NOT NULL,
	"archetype" "cat"."operational_archetype" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_unit_code" text,
	"measurement_mode" "cat"."measurement_mode" NOT NULL,
	"measurement_config_schema_version" smallint DEFAULT 1 NOT NULL,
	"measurement_config" jsonb,
	"execution_config_schema_version" smallint DEFAULT 1 NOT NULL,
	"execution_config" jsonb DEFAULT '{"schemaVersion":1,"fields":[]}'::jsonb NOT NULL,
	"commercial_config_schema_version" smallint DEFAULT 1 NOT NULL,
	"commercial_config" jsonb DEFAULT '{"schemaVersion":1,"requiresPurchaseOrder":false,"requiresContractReference":false}'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"published_by_identity_id" uuid,
	"retired_at" timestamp with time zone,
	"retired_by_identity_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_identity_id" uuid NOT NULL,
	"updated_by_identity_id" uuid NOT NULL,
	CONSTRAINT "service_definition_versions_version_positive_chk" CHECK ("cat"."service_definition_versions"."version" >= 1),
	CONSTRAINT "service_definition_versions_name_not_empty_chk" CHECK (length(trim("cat"."service_definition_versions"."name")) > 0),
	CONSTRAINT "service_definition_versions_default_unit_code_chk" CHECK ("cat"."service_definition_versions"."default_unit_code" IS NULL OR length(trim("cat"."service_definition_versions"."default_unit_code")) BETWEEN 1 AND 32),
	CONSTRAINT "service_definition_versions_measurement_config_schema_chk" CHECK ("cat"."service_definition_versions"."measurement_config_schema_version" >= 1),
	CONSTRAINT "service_definition_versions_execution_config_schema_chk" CHECK ("cat"."service_definition_versions"."execution_config_schema_version" >= 1),
	CONSTRAINT "service_definition_versions_commercial_config_schema_chk" CHECK ("cat"."service_definition_versions"."commercial_config_schema_version" >= 1),
	CONSTRAINT "service_definition_versions_published_consistency_chk" CHECK (("cat"."service_definition_versions"."status" = 'DRAFT' AND "cat"."service_definition_versions"."published_at" IS NULL AND "cat"."service_definition_versions"."published_by_identity_id" IS NULL) OR ("cat"."service_definition_versions"."status" IN ('ACTIVE', 'RETIRED') AND "cat"."service_definition_versions"."published_at" IS NOT NULL AND "cat"."service_definition_versions"."published_by_identity_id" IS NOT NULL)),
	CONSTRAINT "service_definition_versions_retired_consistency_chk" CHECK (("cat"."service_definition_versions"."status" <> 'RETIRED' AND "cat"."service_definition_versions"."retired_at" IS NULL AND "cat"."service_definition_versions"."retired_by_identity_id" IS NULL) OR ("cat"."service_definition_versions"."status" = 'RETIRED' AND "cat"."service_definition_versions"."retired_at" IS NOT NULL AND "cat"."service_definition_versions"."retired_by_identity_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_definition_versions_definition_version_uidx" ON "cat"."service_definition_versions" USING btree ("service_definition_id","version");
--> statement-breakpoint
CREATE INDEX "service_definition_versions_definition_status_idx" ON "cat"."service_definition_versions" USING btree ("service_definition_id","status");
--> statement-breakpoint
CREATE INDEX "service_definition_versions_category_id_idx" ON "cat"."service_definition_versions" USING btree ("category_id");
--> statement-breakpoint
CREATE INDEX "service_definition_versions_archetype_idx" ON "cat"."service_definition_versions" USING btree ("archetype");
--> statement-breakpoint
CREATE TABLE "cat"."service_legal_classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_definition_version_id" uuid NOT NULL,
	"scheme" "cat"."legal_classification_scheme" NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_legal_classifications_code_not_empty_chk" CHECK (length(trim("cat"."service_legal_classifications"."code")) > 0),
	CONSTRAINT "service_legal_classifications_cnae_format_chk" CHECK ("cat"."service_legal_classifications"."scheme" <> 'CNAE' OR "cat"."service_legal_classifications"."code" ~ '^[0-9]{7}$')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_legal_classifications_version_scheme_code_uidx" ON "cat"."service_legal_classifications" USING btree ("service_definition_version_id","scheme","code");
--> statement-breakpoint
CREATE INDEX "service_legal_classifications_scheme_code_idx" ON "cat"."service_legal_classifications" USING btree ("scheme","code");
--> statement-breakpoint
CREATE TABLE "cat"."service_allowed_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_definition_version_id" uuid NOT NULL,
	"unit_code" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_allowed_units_unit_code_chk" CHECK (length(trim("cat"."service_allowed_units"."unit_code")) BETWEEN 1 AND 32),
	CONSTRAINT "service_allowed_units_sort_order_non_negative_chk" CHECK ("cat"."service_allowed_units"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_allowed_units_version_unit_uidx" ON "cat"."service_allowed_units" USING btree ("service_definition_version_id","unit_code");
--> statement-breakpoint
CREATE UNIQUE INDEX "service_allowed_units_one_default_per_version_uidx" ON "cat"."service_allowed_units" USING btree ("service_definition_version_id") WHERE "is_default" = true;
--> statement-breakpoint
CREATE INDEX "service_allowed_units_version_id_idx" ON "cat"."service_allowed_units" USING btree ("service_definition_version_id");
--> statement-breakpoint
CREATE TABLE "cat"."service_pricing_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_definition_version_id" uuid NOT NULL,
	"pricing_model_code" "cat"."pricing_model_code" NOT NULL,
	"config_schema_version" smallint DEFAULT 1 NOT NULL,
	"config" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_pricing_models_sort_order_non_negative_chk" CHECK ("cat"."service_pricing_models"."sort_order" >= 0),
	CONSTRAINT "service_pricing_models_config_schema_chk" CHECK ("cat"."service_pricing_models"."config_schema_version" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_pricing_models_version_model_uidx" ON "cat"."service_pricing_models" USING btree ("service_definition_version_id","pricing_model_code");
--> statement-breakpoint
CREATE INDEX "service_pricing_models_version_id_idx" ON "cat"."service_pricing_models" USING btree ("service_definition_version_id");
--> statement-breakpoint
CREATE TABLE "cat"."service_resource_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_definition_version_id" uuid NOT NULL,
	"resource_kind" "cat"."resource_kind" NOT NULL,
	"requirement_level" "cat"."requirement_level" NOT NULL,
	"min_quantity" integer DEFAULT 1 NOT NULL,
	"config_schema_version" smallint DEFAULT 1 NOT NULL,
	"config" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_resource_requirements_min_quantity_chk" CHECK ("cat"."service_resource_requirements"."min_quantity" >= 1),
	CONSTRAINT "service_resource_requirements_sort_order_non_negative_chk" CHECK ("cat"."service_resource_requirements"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_resource_requirements_version_kind_level_uidx" ON "cat"."service_resource_requirements" USING btree ("service_definition_version_id","resource_kind","requirement_level");
--> statement-breakpoint
CREATE INDEX "service_resource_requirements_version_id_idx" ON "cat"."service_resource_requirements" USING btree ("service_definition_version_id");
--> statement-breakpoint
CREATE TABLE "cat"."service_evidence_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_definition_version_id" uuid NOT NULL,
	"evidence_kind" "cat"."evidence_kind" NOT NULL,
	"requirement_level" "cat"."requirement_level" NOT NULL,
	"config_schema_version" smallint DEFAULT 1 NOT NULL,
	"config" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_evidence_requirements_sort_order_non_negative_chk" CHECK ("cat"."service_evidence_requirements"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_evidence_requirements_version_kind_level_uidx" ON "cat"."service_evidence_requirements" USING btree ("service_definition_version_id","evidence_kind","requirement_level");
--> statement-breakpoint
CREATE INDEX "service_evidence_requirements_version_id_idx" ON "cat"."service_evidence_requirements" USING btree ("service_definition_version_id");
--> statement-breakpoint
ALTER TABLE "cat"."service_categories" ADD CONSTRAINT "service_categories_deactivated_by_identity_id_identities_id_fk" FOREIGN KEY ("deactivated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_categories" ADD CONSTRAINT "service_categories_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_categories" ADD CONSTRAINT "service_categories_updated_by_identity_id_identities_id_fk" FOREIGN KEY ("updated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_definitions" ADD CONSTRAINT "service_definitions_deactivated_by_identity_id_identities_id_fk" FOREIGN KEY ("deactivated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_definitions" ADD CONSTRAINT "service_definitions_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_definitions" ADD CONSTRAINT "service_definitions_updated_by_identity_id_identities_id_fk" FOREIGN KEY ("updated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_definition_versions" ADD CONSTRAINT "service_definition_versions_service_definition_id_service_definitions_id_fk" FOREIGN KEY ("service_definition_id") REFERENCES "cat"."service_definitions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_definition_versions" ADD CONSTRAINT "service_definition_versions_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "cat"."service_categories"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_definition_versions" ADD CONSTRAINT "service_definition_versions_published_by_identity_id_identities_id_fk" FOREIGN KEY ("published_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_definition_versions" ADD CONSTRAINT "service_definition_versions_retired_by_identity_id_identities_id_fk" FOREIGN KEY ("retired_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_definition_versions" ADD CONSTRAINT "service_definition_versions_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_definition_versions" ADD CONSTRAINT "service_definition_versions_updated_by_identity_id_identities_id_fk" FOREIGN KEY ("updated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_legal_classifications" ADD CONSTRAINT "service_legal_classifications_service_definition_version_id_service_definition_versions_id_fk" FOREIGN KEY ("service_definition_version_id") REFERENCES "cat"."service_definition_versions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_allowed_units" ADD CONSTRAINT "service_allowed_units_service_definition_version_id_service_definition_versions_id_fk" FOREIGN KEY ("service_definition_version_id") REFERENCES "cat"."service_definition_versions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_pricing_models" ADD CONSTRAINT "service_pricing_models_service_definition_version_id_service_definition_versions_id_fk" FOREIGN KEY ("service_definition_version_id") REFERENCES "cat"."service_definition_versions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_resource_requirements" ADD CONSTRAINT "service_resource_requirements_service_definition_version_id_service_definition_versions_id_fk" FOREIGN KEY ("service_definition_version_id") REFERENCES "cat"."service_definition_versions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "cat"."service_evidence_requirements" ADD CONSTRAINT "service_evidence_requirements_service_definition_version_id_service_definition_versions_id_fk" FOREIGN KEY ("service_definition_version_id") REFERENCES "cat"."service_definition_versions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION cat.prevent_published_service_definition_version_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('ACTIVE', 'RETIRED') THEN
      RAISE EXCEPTION 'cannot delete published service definition version %', OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status = 'RETIRED' THEN
    RAISE EXCEPTION 'retired service definition versions are immutable (id=%)', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.status = 'ACTIVE' THEN
    IF NEW.status = 'RETIRED'
      AND NEW.name IS NOT DISTINCT FROM OLD.name
      AND NEW.description IS NOT DISTINCT FROM OLD.description
      AND NEW.category_id IS NOT DISTINCT FROM OLD.category_id
      AND NEW.archetype IS NOT DISTINCT FROM OLD.archetype
      AND NEW.default_unit_code IS NOT DISTINCT FROM OLD.default_unit_code
      AND NEW.measurement_mode IS NOT DISTINCT FROM OLD.measurement_mode
      AND NEW.measurement_config_schema_version IS NOT DISTINCT FROM OLD.measurement_config_schema_version
      AND NEW.measurement_config IS NOT DISTINCT FROM OLD.measurement_config
      AND NEW.execution_config_schema_version IS NOT DISTINCT FROM OLD.execution_config_schema_version
      AND NEW.execution_config IS NOT DISTINCT FROM OLD.execution_config
      AND NEW.commercial_config_schema_version IS NOT DISTINCT FROM OLD.commercial_config_schema_version
      AND NEW.commercial_config IS NOT DISTINCT FROM OLD.commercial_config
      AND NEW.version IS NOT DISTINCT FROM OLD.version
      AND NEW.service_definition_id IS NOT DISTINCT FROM OLD.service_definition_id
      AND NEW.published_at IS NOT DISTINCT FROM OLD.published_at
      AND NEW.published_by_identity_id IS NOT DISTINCT FROM OLD.published_by_identity_id
    THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'active service definition versions are immutable; publish a new version instead (id=%)', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER service_definition_versions_immutability_trg
BEFORE UPDATE OR DELETE ON cat.service_definition_versions
FOR EACH ROW
EXECUTE FUNCTION cat.prevent_published_service_definition_version_mutation();
