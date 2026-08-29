import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { identities } from './identity';
import { physicalResourceTypes } from './service-catalog';

export const astSchema = pgSchema('ast');

export const assetLifecycleStatusEnum = astSchema.enum('asset_lifecycle_status', [
  'ACTIVE',
  'INACTIVE',
]);

export const assetAllocationStatusEnum = astSchema.enum('asset_allocation_status', [
  'AVAILABLE',
  'ALLOCATED',
]);

export const physicalAssets = astSchema.table(
  'physical_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    assetCode: text('asset_code').notNull(),
    physicalResourceTypeId: uuid('physical_resource_type_id')
      .notNull()
      .references(() => physicalResourceTypes.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    lifecycleStatus: assetLifecycleStatusEnum('lifecycle_status').notNull().default('ACTIVE'),
    allocationStatus: assetAllocationStatusEnum('allocation_status').notNull().default('AVAILABLE'),
    unitId: text('unit_id').notNull(),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
    deactivatedByIdentityId: uuid('deactivated_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
    }),
    createdByIdentityId: uuid('created_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),
    updatedByIdentityId: uuid('updated_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),
  },
  (table) => [
    uniqueIndex('physical_assets_asset_code_uidx').on(table.assetCode),
    index('physical_assets_unit_id_idx').on(table.unitId),
    index('physical_assets_lifecycle_status_idx').on(table.lifecycleStatus),
    index('physical_assets_resource_type_id_idx').on(table.physicalResourceTypeId),
    check('physical_assets_asset_code_not_empty_chk', sql`length(trim(${table.assetCode})) > 0`),
    check('physical_assets_name_not_empty_chk', sql`length(trim(${table.name})) > 0`),
    check('physical_assets_unit_id_not_empty_chk', sql`length(trim(${table.unitId})) > 0`),
    check('physical_assets_version_positive_chk', sql`${table.version} >= 1`),
  ],
);

export const vehicleProfiles = astSchema.table(
  'vehicle_profiles',
  {
    assetId: uuid('asset_id')
      .primaryKey()
      .references(() => physicalAssets.id, { onDelete: 'restrict' }),
    normalizedPlate: text('normalized_plate').notNull(),
    plateDisplay: text('plate_display').notNull(),
    chassis: text('chassis'),
    model: text('model'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('vehicle_profiles_normalized_plate_uidx').on(table.normalizedPlate),
    check(
      'vehicle_profiles_normalized_plate_not_empty_chk',
      sql`length(trim(${table.normalizedPlate})) > 0`,
    ),
    check(
      'vehicle_profiles_plate_display_not_empty_chk',
      sql`length(trim(${table.plateDisplay})) > 0`,
    ),
  ],
);
