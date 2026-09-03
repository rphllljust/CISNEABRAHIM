import { sql } from 'drizzle-orm';
import { check, integer, numeric, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { identities } from './identity';
import { pgSchema } from 'drizzle-orm/pg-core';

export const prcSchema = pgSchema('prc');

export const purchaseRequestStatusEnum = prcSchema.enum('purchase_request_status', [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]);

export const supplierPurchaseOrderStatusEnum = prcSchema.enum('supplier_purchase_order_status', [
  'ISSUED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
]);

export const receiptStatusEnum = prcSchema.enum('receipt_status', ['POSTED']);

export const approvalDecisionEnum = prcSchema.enum('approval_decision', ['APPROVED', 'REJECTED']);

export const purchaseRequests = prcSchema.table(
  'purchase_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    unitId: text('unit_id').notNull(),
    requesterIdentityId: uuid('requester_identity_id')
      .notNull()
      .references(() => identities.id),
    justification: text('justification').notNull(),
    currencyCode: text('currency_code').notNull().default('BRL'),
    status: purchaseRequestStatusEnum('status').notNull().default('DRAFT'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelReason: text('cancel_reason'),
  },
  (table) => [
    check('purchase_requests_version_chk', sql`${table.version} >= 1`),
  ],
);

export const purchaseRequestLines = prcSchema.table('purchase_request_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id')
    .notNull()
    .references(() => purchaseRequests.id),
  lineNumber: integer('line_number').notNull(),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
  unitAmount: numeric('unit_amount', { precision: 18, scale: 4 }).notNull(),
  lineAmount: numeric('line_amount', { precision: 18, scale: 4 }).notNull(),
});

export const purchaseRequestApprovals = prcSchema.table('purchase_request_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id')
    .notNull()
    .references(() => purchaseRequests.id),
  actorIdentityId: uuid('actor_identity_id')
    .notNull()
    .references(() => identities.id),
  decision: approvalDecisionEnum('decision').notNull(),
  reason: text('reason'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
});

export const supplierPurchaseOrders = prcSchema.table(
  'supplier_purchase_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('request_id')
      .notNull()
      .references(() => purchaseRequests.id),
    supplierId: uuid('supplier_id').notNull(),
    unitId: text('unit_id').notNull(),
    currencyCode: text('currency_code').notNull(),
    paymentTerms: text('payment_terms').notNull(),
    status: supplierPurchaseOrderStatusEnum('status').notNull().default('ISSUED'),
    version: integer('version').notNull().default(1),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelReason: text('cancel_reason'),
  },
  (table) => [uniqueIndex('supplier_purchase_orders_request_uidx').on(table.requestId)],
);

export const supplierPurchaseOrderLines = prcSchema.table('supplier_purchase_order_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierPurchaseOrderId: uuid('supplier_purchase_order_id')
    .notNull()
    .references(() => supplierPurchaseOrders.id),
  requestLineId: uuid('request_line_id')
    .notNull()
    .references(() => purchaseRequestLines.id),
  lineNumber: integer('line_number').notNull(),
  description: text('description').notNull(),
  orderedQuantity: numeric('ordered_quantity', { precision: 18, scale: 4 }).notNull(),
  receivedQuantity: numeric('received_quantity', { precision: 18, scale: 4 }).notNull().default('0'),
  unitAmount: numeric('unit_amount', { precision: 18, scale: 4 }).notNull(),
  lineAmount: numeric('line_amount', { precision: 18, scale: 4 }).notNull(),
});

export const goodsReceipts = prcSchema.table(
  'goods_receipts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    supplierPurchaseOrderId: uuid('supplier_purchase_order_id')
      .notNull()
      .references(() => supplierPurchaseOrders.id),
    status: receiptStatusEnum('status').notNull().default('POSTED'),
    currencyCode: text('currency_code').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    actorIdentityId: uuid('actor_identity_id')
      .notNull()
      .references(() => identities.id),
    idempotencyKey: text('idempotency_key').notNull(),
    payableId: uuid('payable_id'),
  },
  (table) => [uniqueIndex('goods_receipts_idempotency_uidx').on(table.idempotencyKey)],
);

export const supplierInvoiceStatusEnum = prcSchema.enum('supplier_invoice_status', [
  'DRAFT',
  'VALIDATED',
  'REJECTED',
]);

export const supplierInvoices = prcSchema.table(
  'supplier_invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    unitId: text('unit_id').notNull(),
    supplierId: uuid('supplier_id').notNull(),
    invoiceNumber: text('invoice_number').notNull(),
    issuedOn: text('issued_on').notNull(),
    dueDate: text('due_date').notNull(),
    currencyCode: text('currency_code').notNull().default('BRL'),
    totalAmount: numeric('total_amount', { precision: 18, scale: 4 }).notNull(),
    paymentTerms: text('payment_terms').notNull(),
    supplierPurchaseOrderId: uuid('supplier_purchase_order_id').references(() => supplierPurchaseOrders.id),
    goodsReceiptId: uuid('goods_receipt_id').references(() => goodsReceipts.id),
    payableId: uuid('payable_id'),
    status: supplierInvoiceStatusEnum('status').notNull().default('DRAFT'),
    version: integer('version').notNull().default(1),
    idempotencyKey: text('idempotency_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    validatedAt: timestamp('validated_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('supplier_invoices_idempotency_uidx').on(table.idempotencyKey),
    uniqueIndex('supplier_invoices_supplier_number_uidx').on(table.supplierId, table.invoiceNumber),
  ],
);

export const threeWayMatchClassificationEnum = prcSchema.enum('three_way_match_classification', [
  'MATCHED',
  'PARTIAL',
  'DIVERGENT',
  'REVIEW_REQUIRED',
]);

export const threeWayMatches = prcSchema.table(
  'three_way_matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    unitId: text('unit_id').notNull(),
    supplierPurchaseOrderId: uuid('supplier_purchase_order_id')
      .notNull()
      .references(() => supplierPurchaseOrders.id),
    goodsReceiptId: uuid('goods_receipt_id').references(() => goodsReceipts.id),
    supplierInvoiceId: uuid('supplier_invoice_id').references(() => supplierInvoices.id),
    classification: threeWayMatchClassificationEnum('classification').notNull(),
    reasons: text('reasons').array().notNull().default([]),
    orderedQuantity: numeric('ordered_quantity', { precision: 18, scale: 4 }).notNull(),
    receivedQuantity: numeric('received_quantity', { precision: 18, scale: 4 }).notNull(),
    orderedAmount: numeric('ordered_amount', { precision: 18, scale: 4 }).notNull(),
    receivedAmount: numeric('received_amount', { precision: 18, scale: 4 }).notNull(),
    invoicedAmount: numeric('invoiced_amount', { precision: 18, scale: 4 }).notNull(),
    receiptCount: integer('receipt_count').notNull(),
    invoiceCount: integer('invoice_count').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    actorIdentityId: uuid('actor_identity_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('three_way_matches_idempotency_uidx').on(table.idempotencyKey)],
);

export const goodsReceiptLines = prcSchema.table('goods_receipt_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  receiptId: uuid('receipt_id')
    .notNull()
    .references(() => goodsReceipts.id),
  spoLineId: uuid('spo_line_id')
    .notNull()
    .references(() => supplierPurchaseOrderLines.id),
  quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
  unitAmount: numeric('unit_amount', { precision: 18, scale: 4 }).notNull(),
  lineAmount: numeric('line_amount', { precision: 18, scale: 4 }).notNull(),
});
