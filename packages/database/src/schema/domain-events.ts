import { sql } from 'drizzle-orm';
import { check, index, integer, jsonb, pgEnum, pgSchema, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const evtSchema = pgSchema('evt');

export const domainEventTypeEnum = pgEnum('domain_event_type', [
  'SERVICE_REQUEST_SUBMITTED',
  'SERVICE_ORDER_RELEASED',
  'SERVICE_ORDER_ASSIGNED',
  'SERVICE_ORDER_COMPLETED',
  'MEASUREMENT_SUBMITTED',
  'MEASUREMENT_APPROVED',
  'BILLING_READY',
  'PAYMENT_OVERDUE',
]);

export const notificationIntentStatusEnum = pgEnum('notification_intent_status', [
  'PENDING',
  'DISPATCHED',
  'CANCELLED',
]);

export const domainEvents = evtSchema.table(
  'domain_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: domainEventTypeEnum('event_type').notNull(),
    aggregateType: text('aggregate_type').notNull(),
    aggregateId: uuid('aggregate_id').notNull(),
    payloadVersion: integer('payload_version').notNull().default(1),
    payload: jsonb('payload').notNull().default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    idempotencyKey: text('idempotency_key'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    check('domain_events_payload_version_positive_chk', sql`${table.payloadVersion} >= 1`),
    check('domain_events_aggregate_type_not_empty_chk', sql`length(trim(${table.aggregateType})) > 0`),
    uniqueIndex('domain_events_idempotency_key_uidx')
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} IS NOT NULL`),
    index('domain_events_aggregate_idx').on(table.aggregateType, table.aggregateId),
    index('domain_events_event_type_occurred_at_idx').on(table.eventType, table.occurredAt),
  ],
);

export const notificationIntents = evtSchema.table(
  'notification_intents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    domainEventId: uuid('domain_event_id')
      .notNull()
      .references(() => domainEvents.id, { onDelete: 'restrict' }),
    intentKey: text('intent_key').notNull(),
    audienceScope: text('audience_scope').notNull(),
    templateKey: text('template_key').notNull(),
    payloadVersion: integer('payload_version').notNull().default(1),
    payload: jsonb('payload').notNull().default({}),
    status: notificationIntentStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    check('notification_intents_payload_version_positive_chk', sql`${table.payloadVersion} >= 1`),
    check('notification_intents_intent_key_not_empty_chk', sql`length(trim(${table.intentKey})) > 0`),
    check(
      'notification_intents_audience_scope_not_empty_chk',
      sql`length(trim(${table.audienceScope})) > 0`,
    ),
    check('notification_intents_template_key_not_empty_chk', sql`length(trim(${table.templateKey})) > 0`),
    uniqueIndex('notification_intents_domain_event_intent_key_uidx').on(
      table.domainEventId,
      table.intentKey,
    ),
    index('notification_intents_status_created_at_idx').on(table.status, table.createdAt),
  ],
);
