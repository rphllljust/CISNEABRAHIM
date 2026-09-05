import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { comSchema } from './commercial-proposals';
import { serviceDefinitions, serviceDefinitionVersions } from './service-catalog';
import { clients } from './clients';
import { documents } from './documents';
import { identities } from './identity';

export const purchaseOrderStatusEnum = comSchema.enum('purchase_order_status', [
  'DRAFT',
  'REGISTERED',
  'CANCELLED',
]);

export const purchaseOrderPricingStructureEnum = comSchema.enum(
  'purchase_order_pricing_structure',
  ['LINE_ITEMS', 'HEADER_TOTAL'],
);

export const purchaseOrderRuleTypeEnum = comSchema.enum('purchase_order_rule_type', [
  'PO_NUMBER_REQUIRED_ON_INVOICE',
  'XML_REQUIRED',
  'PDF_REQUIRED',
  'BILLING_CUTOFF',
  'RECIPIENT',
]);

export const purchaseOrders = comSchema.table(
  'purchase_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    internalCode: text('internal_code').notNull(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'restrict' }),
    unitId: text('unit_id').notNull(),
    poNumber: text('po_number').notNull(),
    rcNumber: text('rc_number'),
    issueDate: date('issue_date'),
    buyerContact: jsonb('buyer_contact').notNull().default({}),
    serviceManager: text('service_manager'),
    deliveryLocation: jsonb('delivery_location').notNull().default({}),
    billingLocation: jsonb('billing_location').notNull().default({}),
    currencyCode: text('currency_code').notNull().default('BRL'),
    pricingStructure: purchaseOrderPricingStructureEnum('pricing_structure').notNull(),
    totalAmount: numeric('total_amount', { precision: 18, scale: 4 }),
    consumedAmount: numeric('consumed_amount', { precision: 18, scale: 4 }).notNull().default('0'),
    authorizedOverrunAmount: numeric('authorized_overrun_amount', { precision: 18, scale: 4 })
      .notNull()
      .default('0'),
    overrunJustification: text('overrun_justification'),
    overrunAuthorizedAt: timestamp('overrun_authorized_at', { withTimezone: true }),
    overrunAuthorizedByIdentityId: uuid('overrun_authorized_by_identity_id').references(
      () => identities.id,
      { onDelete: 'restrict' },
    ),
    itemsLineTotalAmount: numeric('items_line_total_amount', { precision: 18, scale: 4 }),
    paymentTerms: text('payment_terms'),
    paymentMethod: text('payment_method'),
    clientSnapshot: jsonb('client_snapshot'),
    commercialSnapshot: jsonb('commercial_snapshot'),
    originalDocumentId: uuid('original_document_id').references(() => documents.id, {
      onDelete: 'restrict',
    }),
    status: purchaseOrderStatusEnum('status').notNull().default('DRAFT'),
    registeredAt: timestamp('registered_at', { withTimezone: true }),
    registeredByIdentityId: uuid('registered_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
    }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledByIdentityId: uuid('cancelled_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
    }),
    cancellationReason: text('cancellation_reason'),
    rowVersion: integer('row_version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdByIdentityId: uuid('created_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),
    updatedByIdentityId: uuid('updated_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),
  },
  (table) => [
    uniqueIndex('purchase_orders_internal_code_uidx').on(table.internalCode),
    index('purchase_orders_client_id_idx').on(table.clientId),
    index('purchase_orders_unit_id_idx').on(table.unitId),
    index('purchase_orders_status_idx').on(table.status),
    check(
      'purchase_orders_internal_code_not_empty_chk',
      sql`length(trim(${table.internalCode})) > 0`,
    ),
    check('purchase_orders_po_number_not_empty_chk', sql`length(trim(${table.poNumber})) > 0`),
    check('purchase_orders_unit_id_not_empty_chk', sql`length(trim(${table.unitId})) > 0`),
    check('purchase_orders_row_version_positive_chk', sql`${table.rowVersion} >= 1`),
    check(
      'purchase_orders_currency_code_chk',
      sql`length(trim(${table.currencyCode})) = 3`,
    ),
  ],
);

export const purchaseOrderItems = comSchema.table(
  'purchase_order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    purchaseOrderId: uuid('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: 'restrict' }),
    lineNumber: integer('line_number').notNull(),
    description: text('description').notNull(),
    serviceDefinitionId: uuid('service_definition_id').references(() => serviceDefinitions.id, {
      onDelete: 'restrict',
    }),
    serviceDefinitionVersionId: uuid('service_definition_version_id').references(
      () => serviceDefinitionVersions.id,
      { onDelete: 'restrict' },
    ),
    serviceSnapshot: jsonb('service_snapshot'),
    commercialSnapshot: jsonb('commercial_snapshot'),
    quantity: numeric('quantity', { precision: 18, scale: 4 }),
    unitCode: text('unit_code'),
    unitPriceAmount: numeric('unit_price_amount', { precision: 18, scale: 4 }),
    lineTotalAmount: numeric('line_total_amount', { precision: 18, scale: 4 }),
    rcLineReference: text('rc_line_reference'),
  },
  (table) => [
    uniqueIndex('purchase_order_items_order_line_uidx').on(
      table.purchaseOrderId,
      table.lineNumber,
    ),
    check('purchase_order_items_line_number_positive_chk', sql`${table.lineNumber} >= 1`),
    check(
      'purchase_order_items_description_not_empty_chk',
      sql`length(trim(${table.description})) > 0`,
    ),
  ],
);

export const purchaseOrderBillingRules = comSchema.table(
  'purchase_order_billing_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    purchaseOrderId: uuid('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: 'restrict' }),
    ruleType: purchaseOrderRuleTypeEnum('rule_type').notNull(),
    ruleConfig: jsonb('rule_config').notNull().default({}),
    precedenceTier: text('precedence_tier').notNull().default('PURCHASE_ORDER'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdByIdentityId: uuid('created_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),
  },
  (table) => [
    uniqueIndex('purchase_order_billing_rules_order_type_uidx').on(
      table.purchaseOrderId,
      table.ruleType,
    ),
    check(
      'purchase_order_billing_rules_precedence_tier_chk',
      sql`length(trim(${table.precedenceTier})) > 0`,
    ),
  ],
);

export const purchaseOrderDocumentLinks = comSchema.table(
  'purchase_order_document_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    purchaseOrderId: uuid('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: 'restrict' }),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'restrict' }),
    linkPurpose: text('link_purpose').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdByIdentityId: uuid('created_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),
  },
  (table) => [
    uniqueIndex('purchase_order_document_links_order_document_purpose_uidx').on(
      table.purchaseOrderId,
      table.documentId,
      table.linkPurpose,
    ),
    check(
      'purchase_order_document_links_purpose_not_empty_chk',
      sql`length(trim(${table.linkPurpose})) > 0`,
    ),
  ],
);
