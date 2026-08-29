CREATE TYPE "cat"."measurement_basis" AS ENUM('UNIT', 'TIME', 'DISTANCE', 'VOLUME', 'WEIGHT', 'TRIP', 'GLOBAL_COMPLETION');
--> statement-breakpoint
ALTER TABLE "cat"."service_definition_versions" ADD COLUMN "measurement_basis" "cat"."measurement_basis" DEFAULT 'UNIT' NOT NULL;
--> statement-breakpoint
UPDATE "cat"."service_definition_versions"
SET "measurement_basis" = CASE "measurement_mode"
  WHEN 'BY_PERIOD' THEN 'TIME'::"cat"."measurement_basis"
  WHEN 'BY_QUANTITY' THEN 'UNIT'::"cat"."measurement_basis"
  WHEN 'BY_EVENT' THEN 'TRIP'::"cat"."measurement_basis"
  WHEN 'CHECKLIST' THEN 'GLOBAL_COMPLETION'::"cat"."measurement_basis"
  ELSE 'UNIT'::"cat"."measurement_basis"
END;
--> statement-breakpoint
ALTER TABLE "cat"."service_pricing_models" ADD COLUMN "sale_price_amount" numeric(18, 4);
--> statement-breakpoint
ALTER TABLE "cat"."service_pricing_models" ADD COLUMN "internal_cost_amount" numeric(18, 4);
--> statement-breakpoint
ALTER TABLE "cat"."service_pricing_models" ADD COLUMN "currency_code" char(3) DEFAULT 'BRL' NOT NULL;
--> statement-breakpoint
ALTER TABLE "cat"."service_pricing_models" ADD CONSTRAINT "service_pricing_models_sale_price_non_negative_chk" CHECK ("sale_price_amount" IS NULL OR "sale_price_amount" >= 0);
--> statement-breakpoint
ALTER TABLE "cat"."service_pricing_models" ADD CONSTRAINT "service_pricing_models_internal_cost_non_negative_chk" CHECK ("internal_cost_amount" IS NULL OR "internal_cost_amount" >= 0);
--> statement-breakpoint
ALTER TABLE "cat"."service_pricing_models" ADD CONSTRAINT "service_pricing_models_currency_code_format_chk" CHECK ("currency_code" ~ '^[A-Z]{3}$');
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
      AND NEW.measurement_basis IS NOT DISTINCT FROM OLD.measurement_basis
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

    RAISE EXCEPTION 'published service definition versions are immutable (id=%)', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;
