/**
 * Contratos explícitos para colunas JSONB do catálogo (Prompt 32).
 * Validação de domínio complementa estes schemas na camada de aplicação.
 */

/** measurement_config — schema_version 1 */
export type CatalogMeasurementConfigV1 = {
  schemaVersion: 1;
  periodGranularity?: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  allowPartialPeriods?: boolean;
  checklistTemplateCode?: string;
};

/** execution_config — schema_version 1 */
export type CatalogExecutionConfigV1 = {
  schemaVersion: 1;
  fields: Array<{
    code: string;
    label: string;
    dataType: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'DATETIME';
    required: boolean;
  }>;
};

/** commercial_config — schema_version 1 */
export type CatalogCommercialConfigV1 = {
  schemaVersion: 1;
  requiresPurchaseOrder: boolean;
  requiresContractReference: boolean;
  minimumBillableQuantity?: number;
};

/** pricing model config — schema_version 1 (opcional por linha) */
export type CatalogPricingModelConfigV1 = {
  schemaVersion: 1;
  /** Vocabulário comercial canônico (Prompt 39) — distinto do código persistido no enum SQL. */
  commercialCode?: string;
  unitCode?: string;
  minimumQuantity?: number;
  tierRules?: Array<{ upToQuantity: number; unitCode: string }>;
};

/** execution requirement row config — schema_version 1 */
export type CatalogExecutionRequirementConfigV1 = {
  schemaVersion: 1;
  conditional?: {
    conditionType:
      | 'WHEN_MEASUREMENT_BASIS_IS'
      | 'WHEN_ARCHETYPE_IS'
      | 'WHEN_RESOURCE_TYPE_IS'
      | 'WHEN_LABOR_TYPE_IS';
    measurementBasis?: string;
    archetype?: string;
    resourceTypeCode?: string;
    laborTypeCode?: string;
  };
  notes?: string;
};

/** resource row config — schema_version 1 (opcional) */
export type CatalogRequirementConfigV1 = {
  schemaVersion: 1;
  notes?: string;
};

export const CATALOG_JSON_SCHEMA_VERSION = 1 as const;
