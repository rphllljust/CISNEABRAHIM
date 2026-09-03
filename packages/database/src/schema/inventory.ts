import { boolean, date, integer, jsonb, numeric, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { identities } from './identity';

export const invSchema = pgSchema('inv');

export const inventoryItemStatusEnum = invSchema.enum('inventory_item_status', ['ACTIVE', 'INACTIVE']);
export const warehouseStatusEnum = invSchema.enum('warehouse_status', ['ACTIVE', 'INACTIVE']);
export const stockMovementTypeEnum = invSchema.enum('stock_movement_type', [
  'IN',
  'OUT',
  'TRANSFER',
  'ADJUSTMENT',
]);
export const stockMovementStatusEnum = invSchema.enum('stock_movement_status', ['POSTED', 'REVERSED']);
export const transferLegEnum = invSchema.enum('transfer_leg', ['ORIGIN', 'DESTINATION']);
export const adjustmentEffectEnum = invSchema.enum('adjustment_effect', ['INCREASE', 'DECREASE']);
export const reservationStatusEnum = invSchema.enum('reservation_status', [
  'ACTIVE',
  'RELEASED',
  'CONSUMED',
  'CANCELLED',
]);
export const costingMethodStatusEnum = invSchema.enum('costing_method_status', ['UNDECIDED']);
export const costingRuleStatusEnum = invSchema.enum('costing_rule_status', ['ACTIVE', 'INACTIVE']);
export const costingRuleVersionStatusEnum = invSchema.enum('costing_rule_version_status', [
  'DRAFT',
  'PUBLISHED',
]);
export const stockOriginKindEnum = invSchema.enum('stock_origin_kind', [
  'RECEIPT',
  'ISSUE',
  'TRANSFER',
  'ADJUSTMENT',
  'REVERSAL',
]);

export const warehouses = invSchema.table('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  status: warehouseStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const inventoryItems = invSchema.table('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  status: inventoryItemStatusEnum('status').notNull().default('ACTIVE'),
  allowsNegativeStock: boolean('allows_negative_stock').notNull().default(false),
  costingMethodStatus: costingMethodStatusEnum('costing_method_status').notNull().default('UNDECIDED'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const stockReservations = invSchema.table('stock_reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  warehouseId: uuid('warehouse_id')
    .notNull()
    .references(() => warehouses.id),
  inventoryItemId: uuid('inventory_item_id')
    .notNull()
    .references(() => inventoryItems.id),
  quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
  status: reservationStatusEnum('status').notNull().default('ACTIVE'),
  idempotencyKey: text('idempotency_key').notNull(),
  sourceKind: text('source_kind'),
  sourceId: uuid('source_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const stockMovements = invSchema.table('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  warehouseId: uuid('warehouse_id')
    .notNull()
    .references(() => warehouses.id),
  inventoryItemId: uuid('inventory_item_id')
    .notNull()
    .references(() => inventoryItems.id),
  movementType: stockMovementTypeEnum('movement_type').notNull(),
  status: stockMovementStatusEnum('status').notNull().default('POSTED'),
  quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
  signedQuantity: numeric('signed_quantity', { precision: 18, scale: 4 }).notNull(),
  counterpartWarehouseId: uuid('counterpart_warehouse_id').references(() => warehouses.id),
  transferGroupId: uuid('transfer_group_id'),
  transferLeg: transferLegEnum('transfer_leg'),
  adjustmentEffect: adjustmentEffectEnum('adjustment_effect'),
  reservationId: uuid('reservation_id').references(() => stockReservations.id),
  reversalOfMovementId: uuid('reversal_of_movement_id'),
  commandIdempotencyKey: text('command_idempotency_key').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  sourceKind: text('source_kind'),
  sourceId: uuid('source_id'),
  occurredOn: date('occurred_on').notNull(),
  description: text('description').notNull(),
  unitCost: numeric('unit_cost', { precision: 18, scale: 4 }),
  totalCost: numeric('total_cost', { precision: 18, scale: 4 }),
  costingRuleVersionId: uuid('costing_rule_version_id'),
  originKind: stockOriginKindEnum('origin_kind'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const costingRules = invSchema.table('costing_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  status: costingRuleStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const costingRuleVersions = invSchema.table('costing_rule_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  costingRuleId: uuid('costing_rule_id')
    .notNull()
    .references(() => costingRules.id),
  versionNumber: integer('version_number').notNull(),
  status: costingRuleVersionStatusEnum('status').notNull().default('DRAFT'),
  method: costingMethodStatusEnum('method').notNull().default('UNDECIDED'),
  requiredContext: jsonb('required_context').notNull().default([]),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  sourceReference: text('source_reference').notNull(),
  rowVersion: integer('row_version').notNull().default(1),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  publishedByIdentityId: uuid('published_by_identity_id').references(() => identities.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const stockPositionLocks = invSchema.table('stock_position_locks', {
  warehouseId: uuid('warehouse_id')
    .notNull()
    .references(() => warehouses.id),
  inventoryItemId: uuid('inventory_item_id')
    .notNull()
    .references(() => inventoryItems.id),
});
