import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { identities } from './identity';
import type {
  CatalogCommercialConfigV1,
  CatalogExecutionConfigV1,
  CatalogExecutionRequirementConfigV1,
  CatalogMeasurementConfigV1,
  CatalogPricingModelConfigV1,
  CatalogRequirementConfigV1,
} from './catalog-json-contracts';

/**
 * Catálogo versionado de serviços (Prompt 32 — BC-CAT-001).
 * Schema `cat` — definições operacionais independentes de CNAE.
 */
export const catSchema = pgSchema('cat');

export const serviceCategoryStatusEnum = catSchema.enum('service_category_status', [
  'ACTIVE',
  'INACTIVE',
]);

export const serviceDefinitionLineageStatusEnum = catSchema.enum(
  'service_definition_lineage_status',
  ['ACTIVE', 'INACTIVE'],
);

export const serviceDefinitionVersionStatusEnum = catSchema.enum(
  'service_definition_version_status',
  ['DRAFT', 'ACTIVE', 'RETIRED'],
);

export const operationalArchetypeEnum = catSchema.enum('operational_archetype', [
  'RENTAL',
  'TRANSPORT',
  'CIVIL_WORK',
  'INSTALLATION',
  'MAINTENANCE',
  'INDUSTRIAL_SERVICE',
  'FACILITY_SERVICE',
  'COMMERCIAL_REPRESENTATION',
  'GOODS_TRADE',
  'LABOR_SERVICE',
  'WASTE_SERVICE',
  'MARITIME_SUPPORT',
]);

export const legalClassificationSchemeEnum = catSchema.enum('legal_classification_scheme', [
  'CNAE',
  'NCM',
  'OTHER',
]);

export const measurementModeEnum = catSchema.enum('measurement_mode', [
  'BY_PERIOD',
  'BY_QUANTITY',
  'BY_EVENT',
  'CHECKLIST',
]);

export const measurementBasisEnum = catSchema.enum('measurement_basis', [
  'UNIT',
  'TIME',
  'DISTANCE',
  'VOLUME',
  'WEIGHT',
  'TRIP',
  'GLOBAL_COMPLETION',
]);

export const pricingModelCodeEnum = catSchema.enum('pricing_model_code', [
  'FIXED',
  'PER_UNIT',
  'PER_PERIOD',
  'PER_TRIP',
  'TIERED',
  'CONTRACT_REFERENCE',
]);

export const resourceKindEnum = catSchema.enum('resource_kind', [
  'VEHICLE',
  'OPERATOR',
  'EQUIPMENT',
  'TEAM',
  'OTHER',
]);

export const evidenceKindEnum = catSchema.enum('evidence_kind', [
  'PHOTO',
  'CHECKLIST',
  'SIGNATURE',
  'HOUR_METER',
  'DOCUMENT',
  'OTHER',
  'START_TIME',
  'END_TIME',
  'LOCATION',
  'MILEAGE',
  'QUANTITY',
  'WEIGHT',
  'VOLUME',
  'RECEIPT',
  'OBSERVATION',
]);

export const requirementLevelEnum = catSchema.enum('requirement_level', [
  'REQUIRED',
  'OPTIONAL',
  'CONDITIONAL',
]);

export const physicalResourceClassificationEnum = catSchema.enum('physical_resource_classification', [
  'VEHICLE',
  'MACHINE',
  'EQUIPMENT',
  'CONSUMABLE',
  'MATERIAL',
]);

export const physicalResourceTypeStatusEnum = catSchema.enum('physical_resource_type_status', [
  'ACTIVE',
  'INACTIVE',
]);

export const serviceCategories = catSchema.table(
  'service_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    status: serviceCategoryStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true, mode: 'string' }),
    deactivatedByIdentityId: uuid('deactivated_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
    createdByIdentityId: uuid('created_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    updatedByIdentityId: uuid('updated_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  },
  (table) => [
    check('service_categories_code_not_empty_chk', sql`length(trim(${table.code})) > 0`),
    check(
      'service_categories_code_format_chk',
      sql`${table.code} ~ '^[A-Z0-9][A-Z0-9_-]{1,63}$'`,
    ),
    check('service_categories_name_not_empty_chk', sql`length(trim(${table.name})) > 0`),
    uniqueIndex('service_categories_code_uidx').on(table.code),
    index('service_categories_status_idx').on(table.status),
  ],
);

export const serviceDefinitions = catSchema.table(
  'service_definitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    status: serviceDefinitionLineageStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true, mode: 'string' }),
    deactivatedByIdentityId: uuid('deactivated_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
    deactivationReason: text('deactivation_reason'),
    version: integer('version').notNull().default(1),
    createdByIdentityId: uuid('created_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    updatedByIdentityId: uuid('updated_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  },
  (table) => [
    check('service_definitions_code_not_empty_chk', sql`length(trim(${table.code})) > 0`),
    check(
      'service_definitions_code_format_chk',
      sql`${table.code} ~ '^[A-Z0-9][A-Z0-9_-]{1,63}$'`,
    ),
    check('service_definitions_version_positive_chk', sql`${table.version} >= 1`),
    uniqueIndex('service_definitions_code_uidx').on(table.code),
    index('service_definitions_status_idx').on(table.status),
  ],
);

export const serviceDefinitionVersions = catSchema.table(
  'service_definition_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceDefinitionId: uuid('service_definition_id')
      .notNull()
      .references(() => serviceDefinitions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    version: integer('version').notNull(),
    status: serviceDefinitionVersionStatusEnum('status').notNull().default('DRAFT'),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => serviceCategories.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    archetype: operationalArchetypeEnum('archetype').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    defaultUnitCode: text('default_unit_code'),
    measurementMode: measurementModeEnum('measurement_mode').notNull(),
    measurementBasis: measurementBasisEnum('measurement_basis').notNull().default('UNIT'),
    measurementConfigSchemaVersion: smallint('measurement_config_schema_version')
      .notNull()
      .default(1),
    measurementConfig: jsonb('measurement_config').$type<CatalogMeasurementConfigV1 | null>(),
    executionConfigSchemaVersion: smallint('execution_config_schema_version').notNull().default(1),
    executionConfig: jsonb('execution_config')
      .$type<CatalogExecutionConfigV1>()
      .notNull()
      .default({ schemaVersion: 1, fields: [] }),
    commercialConfigSchemaVersion: smallint('commercial_config_schema_version')
      .notNull()
      .default(1),
    commercialConfig: jsonb('commercial_config')
      .$type<CatalogCommercialConfigV1>()
      .notNull()
      .default({
        schemaVersion: 1,
        requiresPurchaseOrder: false,
        requiresContractReference: false,
      }),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
    publishedByIdentityId: uuid('published_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
    retiredAt: timestamp('retired_at', { withTimezone: true, mode: 'string' }),
    retiredByIdentityId: uuid('retired_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    createdByIdentityId: uuid('created_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    updatedByIdentityId: uuid('updated_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  },
  (table) => [
    check('service_definition_versions_version_positive_chk', sql`${table.version} >= 1`),
    check('service_definition_versions_name_not_empty_chk', sql`length(trim(${table.name})) > 0`),
    check(
      'service_definition_versions_default_unit_code_chk',
      sql`${table.defaultUnitCode} IS NULL OR length(trim(${table.defaultUnitCode})) BETWEEN 1 AND 32`,
    ),
    check(
      'service_definition_versions_measurement_config_schema_chk',
      sql`${table.measurementConfigSchemaVersion} >= 1`,
    ),
    check(
      'service_definition_versions_execution_config_schema_chk',
      sql`${table.executionConfigSchemaVersion} >= 1`,
    ),
    check(
      'service_definition_versions_commercial_config_schema_chk',
      sql`${table.commercialConfigSchemaVersion} >= 1`,
    ),
    check(
      'service_definition_versions_published_consistency_chk',
      sql`(${table.status} = 'DRAFT' AND ${table.publishedAt} IS NULL AND ${table.publishedByIdentityId} IS NULL)
          OR (${table.status} IN ('ACTIVE', 'RETIRED') AND ${table.publishedAt} IS NOT NULL AND ${table.publishedByIdentityId} IS NOT NULL)`,
    ),
    check(
      'service_definition_versions_retired_consistency_chk',
      sql`(${table.status} <> 'RETIRED' AND ${table.retiredAt} IS NULL AND ${table.retiredByIdentityId} IS NULL)
          OR (${table.status} = 'RETIRED' AND ${table.retiredAt} IS NOT NULL AND ${table.retiredByIdentityId} IS NOT NULL)`,
    ),
    uniqueIndex('service_definition_versions_definition_version_uidx').on(
      table.serviceDefinitionId,
      table.version,
    ),
    index('service_definition_versions_definition_status_idx').on(
      table.serviceDefinitionId,
      table.status,
    ),
    index('service_definition_versions_category_id_idx').on(table.categoryId),
    index('service_definition_versions_archetype_idx').on(table.archetype),
  ],
);

export const serviceLegalClassifications = catSchema.table(
  'service_legal_classifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceDefinitionVersionId: uuid('service_definition_version_id')
      .notNull()
      .references(() => serviceDefinitionVersions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    scheme: legalClassificationSchemeEnum('scheme').notNull(),
    code: text('code').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('service_legal_classifications_code_not_empty_chk', sql`length(trim(${table.code})) > 0`),
    check(
      'service_legal_classifications_cnae_format_chk',
      sql`${table.scheme} <> 'CNAE' OR ${table.code} ~ '^[0-9]{7}$'`,
    ),
    uniqueIndex('service_legal_classifications_version_scheme_code_uidx').on(
      table.serviceDefinitionVersionId,
      table.scheme,
      table.code,
    ),
    index('service_legal_classifications_scheme_code_idx').on(table.scheme, table.code),
  ],
);

export const serviceAllowedUnits = catSchema.table(
  'service_allowed_units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceDefinitionVersionId: uuid('service_definition_version_id')
      .notNull()
      .references(() => serviceDefinitionVersions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    unitCode: text('unit_code').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('service_allowed_units_unit_code_chk', sql`length(trim(${table.unitCode})) BETWEEN 1 AND 32`),
    check('service_allowed_units_sort_order_non_negative_chk', sql`${table.sortOrder} >= 0`),
    uniqueIndex('service_allowed_units_version_unit_uidx').on(
      table.serviceDefinitionVersionId,
      table.unitCode,
    ),
    index('service_allowed_units_version_id_idx').on(table.serviceDefinitionVersionId),
  ],
);

export const servicePricingModels = catSchema.table(
  'service_pricing_models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceDefinitionVersionId: uuid('service_definition_version_id')
      .notNull()
      .references(() => serviceDefinitionVersions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    pricingModelCode: pricingModelCodeEnum('pricing_model_code').notNull(),
    configSchemaVersion: smallint('config_schema_version').notNull().default(1),
    config: jsonb('config').$type<CatalogPricingModelConfigV1 | null>(),
    salePriceAmount: numeric('sale_price_amount', { precision: 18, scale: 4 }),
    internalCostAmount: numeric('internal_cost_amount', { precision: 18, scale: 4 }),
    currencyCode: char('currency_code', { length: 3 }).notNull().default('BRL'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('service_pricing_models_sort_order_non_negative_chk', sql`${table.sortOrder} >= 0`),
    check('service_pricing_models_config_schema_chk', sql`${table.configSchemaVersion} >= 1`),
    check(
      'service_pricing_models_sale_price_non_negative_chk',
      sql`${table.salePriceAmount} IS NULL OR ${table.salePriceAmount} >= 0`,
    ),
    check(
      'service_pricing_models_internal_cost_non_negative_chk',
      sql`${table.internalCostAmount} IS NULL OR ${table.internalCostAmount} >= 0`,
    ),
    check(
      'service_pricing_models_currency_code_format_chk',
      sql`${table.currencyCode} ~ '^[A-Z]{3}$'`,
    ),
    uniqueIndex('service_pricing_models_version_model_uidx').on(
      table.serviceDefinitionVersionId,
      table.pricingModelCode,
    ),
    index('service_pricing_models_version_id_idx').on(table.serviceDefinitionVersionId),
  ],
);

export const physicalResourceTypes = catSchema.table(
  'physical_resource_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    classification: physicalResourceClassificationEnum('classification').notNull(),
    status: physicalResourceTypeStatusEnum('status').notNull().default('ACTIVE'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
    deactivatedByIdentityId: uuid('deactivated_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
    createdByIdentityId: uuid('created_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
    updatedByIdentityId: uuid('updated_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
  },
  (table) => [
    check('physical_resource_types_code_not_empty_chk', sql`length(trim(${table.code})) > 0`),
    check(
      'physical_resource_types_code_format_chk',
      sql`${table.code} ~ '^[A-Z0-9][A-Z0-9_]{0,63}$'`,
    ),
    check('physical_resource_types_name_not_empty_chk', sql`length(trim(${table.name})) > 0`),
    check('physical_resource_types_version_positive_chk', sql`${table.version} >= 1`),
    uniqueIndex('physical_resource_types_code_uidx').on(table.code),
    index('physical_resource_types_status_idx').on(table.status),
    index('physical_resource_types_classification_idx').on(table.classification),
  ],
);

export const operationalLaborTypeStatusEnum = catSchema.enum('operational_labor_type_status', [
  'ACTIVE',
  'INACTIVE',
]);

export const operationalLaborTypes = catSchema.table(
  'operational_labor_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    status: operationalLaborTypeStatusEnum('status').notNull().default('ACTIVE'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
    deactivatedByIdentityId: uuid('deactivated_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
    createdByIdentityId: uuid('created_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
    updatedByIdentityId: uuid('updated_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
  },
  (table) => [
    check('operational_labor_types_code_not_empty_chk', sql`length(trim(${table.code})) > 0`),
    check(
      'operational_labor_types_code_format_chk',
      sql`${table.code} ~ '^[A-Z0-9][A-Z0-9_]{0,63}$'`,
    ),
    check('operational_labor_types_name_not_empty_chk', sql`length(trim(${table.name})) > 0`),
    check('operational_labor_types_version_positive_chk', sql`${table.version} >= 1`),
    uniqueIndex('operational_labor_types_code_uidx').on(table.code),
    index('operational_labor_types_status_idx').on(table.status),
  ],
);

export const serviceResourceRequirements = catSchema.table(
  'service_resource_requirements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceDefinitionVersionId: uuid('service_definition_version_id')
      .notNull()
      .references(() => serviceDefinitionVersions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    physicalResourceTypeCode: text('physical_resource_type_code').notNull(),
    requirementLevel: requirementLevelEnum('requirement_level').notNull(),
    minQuantity: integer('min_quantity').notNull().default(1),
    configSchemaVersion: smallint('config_schema_version').notNull().default(1),
    config: jsonb('config').$type<CatalogRequirementConfigV1 | null>(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('service_resource_requirements_min_quantity_chk', sql`${table.minQuantity} >= 1`),
    check('service_resource_requirements_sort_order_non_negative_chk', sql`${table.sortOrder} >= 0`),
    uniqueIndex('service_resource_requirements_version_type_uidx').on(
      table.serviceDefinitionVersionId,
      table.physicalResourceTypeCode,
    ),
    index('service_resource_requirements_version_id_idx').on(table.serviceDefinitionVersionId),
  ],
);

export const serviceLaborRequirements = catSchema.table(
  'service_labor_requirements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceDefinitionVersionId: uuid('service_definition_version_id')
      .notNull()
      .references(() => serviceDefinitionVersions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    laborTypeCode: text('labor_type_code').notNull(),
    requirementLevel: requirementLevelEnum('requirement_level').notNull(),
    minQuantity: integer('min_quantity').notNull().default(1),
    configSchemaVersion: smallint('config_schema_version').notNull().default(1),
    config: jsonb('config').$type<CatalogRequirementConfigV1 | null>(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('service_labor_requirements_min_quantity_chk', sql`${table.minQuantity} >= 1`),
    check('service_labor_requirements_sort_order_non_negative_chk', sql`${table.sortOrder} >= 0`),
    uniqueIndex('service_labor_requirements_version_type_uidx').on(
      table.serviceDefinitionVersionId,
      table.laborTypeCode,
    ),
    index('service_labor_requirements_version_id_idx').on(table.serviceDefinitionVersionId),
  ],
);

export const serviceEvidenceRequirements = catSchema.table(
  'service_evidence_requirements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceDefinitionVersionId: uuid('service_definition_version_id')
      .notNull()
      .references(() => serviceDefinitionVersions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    evidenceKind: evidenceKindEnum('evidence_kind').notNull(),
    requirementLevel: requirementLevelEnum('requirement_level').notNull(),
    configSchemaVersion: smallint('config_schema_version').notNull().default(1),
    config: jsonb('config').$type<CatalogExecutionRequirementConfigV1 | null>(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('service_evidence_requirements_sort_order_non_negative_chk', sql`${table.sortOrder} >= 0`),
    uniqueIndex('service_evidence_requirements_version_kind_level_uidx').on(
      table.serviceDefinitionVersionId,
      table.evidenceKind,
      table.requirementLevel,
    ),
    index('service_evidence_requirements_version_id_idx').on(table.serviceDefinitionVersionId),
  ],
);

export const unitOfMeasureCategoryEnum = catSchema.enum('unit_of_measure_category', [
  'COUNT',
  'TIME',
  'LENGTH',
  'AREA',
  'VOLUME',
  'MASS',
  'DISTANCE',
  'SERVICE',
]);

export const unitOfMeasureStatusEnum = catSchema.enum('unit_of_measure_status', [
  'ACTIVE',
  'INACTIVE',
]);

export const unitsOfMeasure = catSchema.table(
  'units_of_measure',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    category: unitOfMeasureCategoryEnum('category').notNull(),
    decimalScale: smallint('decimal_scale').notNull().default(0),
    status: unitOfMeasureStatusEnum('status').notNull().default('ACTIVE'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
    deactivatedByIdentityId: uuid('deactivated_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
    createdByIdentityId: uuid('created_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
    updatedByIdentityId: uuid('updated_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
  },
  (table) => [
    check('units_of_measure_code_not_empty_chk', sql`length(trim(${table.code})) > 0`),
    check(
      'units_of_measure_code_format_chk',
      sql`${table.code} ~ '^[A-Z0-9][A-Z0-9_]{0,31}$'`,
    ),
    check('units_of_measure_name_not_empty_chk', sql`length(trim(${table.name})) > 0`),
    check(
      'units_of_measure_decimal_scale_chk',
      sql`${table.decimalScale} >= 0 AND ${table.decimalScale} <= 6`,
    ),
    check('units_of_measure_version_positive_chk', sql`${table.version} >= 1`),
    uniqueIndex('units_of_measure_code_uidx').on(table.code),
    index('units_of_measure_status_idx').on(table.status),
  ],
);
