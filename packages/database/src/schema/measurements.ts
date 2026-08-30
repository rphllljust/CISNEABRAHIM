import { integer, jsonb, numeric, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { identities } from './identity';
import { executionEntries } from './service-order-execution';
import { serviceOrders } from './service-orders';

export const msrSchema = pgSchema('msr');

export const measurementStatusEnum = msrSchema.enum('measurement_status', [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
]);

export const measurements = msrSchema.table('measurements', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceOrderId: uuid('service_order_id')
    .notNull()
    .references(() => serviceOrders.id),
  unitId: text('unit_id').notNull(),
  status: measurementStatusEnum('status').notNull().default('DRAFT'),
  commercialReferenceSnapshot: jsonb('commercial_reference_snapshot').notNull().default({}),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  submittedByIdentityId: uuid('submitted_by_identity_id').references(() => identities.id),
  reviewStartedAt: timestamp('review_started_at', { withTimezone: true }),
  reviewStartedByIdentityId: uuid('review_started_by_identity_id').references(() => identities.id),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  decidedByIdentityId: uuid('decided_by_identity_id').references(() => identities.id),
  rejectionReason: text('rejection_reason'),
  rowVersion: integer('row_version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const measurementItems = msrSchema.table('measurement_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  measurementId: uuid('measurement_id')
    .notNull()
    .references(() => measurements.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  sourceExecutionEntryId: uuid('source_execution_entry_id')
    .notNull()
    .references(() => executionEntries.id),
  unitCode: text('unit_code').notNull(),
  actualQuantity: numeric('actual_quantity', { precision: 18, scale: 6 }).notNull(),
  measuredQuantity: numeric('measured_quantity', { precision: 18, scale: 6 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 18, scale: 4 }),
  lineAmount: numeric('line_amount', { precision: 18, scale: 4 }),
  pricingLineSnapshot: jsonb('pricing_line_snapshot').notNull().default({}),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const measurementAdjustments = msrSchema.table('measurement_adjustments', {
  id: uuid('id').primaryKey().defaultRandom(),
  measurementId: uuid('measurement_id')
    .notNull()
    .references(() => measurements.id, { onDelete: 'cascade' }),
  measurementItemId: uuid('measurement_item_id')
    .notNull()
    .references(() => measurementItems.id, { onDelete: 'cascade' }),
  adjustmentQuantity: numeric('adjustment_quantity', { precision: 18, scale: 6 }).notNull(),
  unitCode: text('unit_code').notNull(),
  reason: text('reason').notNull(),
  authorizedByIdentityId: uuid('authorized_by_identity_id')
    .notNull()
    .references(() => identities.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const measurementHistoryEvents = msrSchema.table('measurement_history_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  measurementId: uuid('measurement_id')
    .notNull()
    .references(() => measurements.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull().default({}),
  actorIdentityId: uuid('actor_identity_id').references(() => identities.id),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
});

export const measurementCommandIdempotency = msrSchema.table('measurement_command_idempotency', {
  id: uuid('id').primaryKey().defaultRandom(),
  measurementId: uuid('measurement_id')
    .notNull()
    .references(() => measurements.id, { onDelete: 'cascade' }),
  commandName: text('command_name').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  responsePayload: jsonb('response_payload').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
