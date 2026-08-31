import type { PoolClient } from 'pg';
import type {
  AllowedUnitInput,
  LaborRequirementInput,
  NormalizedExecutionRequirementInput,
  NormalizedPricingModelInput,
  ResourceRequirementInput,
} from '../domain/service-catalog.validation';
import { toPersistedPricingModel } from '../../commercial/domain/commercial-compatibility';

export async function replaceServiceCatalogAllowedUnits(
  client: PoolClient,
  versionId: string,
  units: AllowedUnitInput[],
): Promise<void> {
  await client.query(`DELETE FROM cat.service_allowed_units WHERE service_definition_version_id = $1`, [versionId]);
  for (const unit of units) {
    await client.query(
      `INSERT INTO cat.service_allowed_units (
         service_definition_version_id, unit_code, is_default, sort_order
       ) VALUES ($1, $2, $3, $4)`,
      [versionId, unit.unitCode, unit.isDefault ?? false, unit.sortOrder ?? 0],
    );
  }
}

export async function replaceServiceCatalogResourceRequirements(
  client: PoolClient,
  versionId: string,
  requirements: ResourceRequirementInput[],
): Promise<void> {
  await client.query(`DELETE FROM cat.service_resource_requirements WHERE service_definition_version_id = $1`, [
    versionId,
  ]);
  for (const requirement of requirements) {
    await client.query(
      `INSERT INTO cat.service_resource_requirements (
         service_definition_version_id,
         physical_resource_type_code,
         requirement_level,
         min_quantity,
         sort_order
       ) VALUES ($1, $2, $3::cat.requirement_level, $4, $5)`,
      [
        versionId,
        requirement.resourceTypeCode,
        requirement.requirementLevel,
        requirement.minQuantity ?? 1,
        requirement.sortOrder ?? 0,
      ],
    );
  }
}

export async function replaceServiceCatalogLaborRequirements(
  client: PoolClient,
  versionId: string,
  requirements: LaborRequirementInput[],
): Promise<void> {
  await client.query(`DELETE FROM cat.service_labor_requirements WHERE service_definition_version_id = $1`, [
    versionId,
  ]);
  for (const requirement of requirements) {
    await client.query(
      `INSERT INTO cat.service_labor_requirements (
         service_definition_version_id,
         labor_type_code,
         requirement_level,
         min_quantity,
         sort_order
       ) VALUES ($1, $2, $3::cat.requirement_level, $4, $5)`,
      [
        versionId,
        requirement.laborTypeCode,
        requirement.requirementLevel,
        requirement.minQuantity ?? 1,
        requirement.sortOrder ?? 0,
      ],
    );
  }
}

export async function replaceServiceCatalogPricingModels(
  client: PoolClient,
  versionId: string,
  models: NormalizedPricingModelInput[],
): Promise<void> {
  await client.query(`DELETE FROM cat.service_pricing_models WHERE service_definition_version_id = $1`, [versionId]);
  for (const model of models) {
    const persisted = toPersistedPricingModel(model);
    await client.query(
      `INSERT INTO cat.service_pricing_models (
         service_definition_version_id,
         pricing_model_code,
         config,
         sale_price_amount,
         internal_cost_amount,
         currency_code,
         sort_order
       ) VALUES ($1, $2::cat.pricing_model_code, $3::jsonb, $4, $5, $6, $7)`,
      [
        versionId,
        persisted.persistedCode,
        JSON.stringify(persisted.config),
        persisted.salePrice,
        persisted.internalCost,
        persisted.currencyCode,
        persisted.sortOrder,
      ],
    );
  }
}

export async function replaceServiceCatalogExecutionRequirements(
  client: PoolClient,
  versionId: string,
  requirements: NormalizedExecutionRequirementInput[],
): Promise<void> {
  await client.query(`DELETE FROM cat.service_evidence_requirements WHERE service_definition_version_id = $1`, [
    versionId,
  ]);
  for (const requirement of requirements) {
    await client.query(
      `INSERT INTO cat.service_evidence_requirements (
         service_definition_version_id,
         evidence_kind,
         requirement_level,
         config,
         sort_order
       ) VALUES ($1, $2::cat.evidence_kind, $3::cat.requirement_level, $4::jsonb, $5)`,
      [
        versionId,
        requirement.requirementType,
        requirement.requirementLevel,
        requirement.config ? JSON.stringify(requirement.config) : null,
        requirement.sortOrder,
      ],
    );
  }
}
