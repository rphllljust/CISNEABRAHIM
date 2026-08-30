import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { domainEventTypeEnum, evtSchema } from './domain-events';

export const outboxEventStatusEnum = pgEnum('outbox_event_status', [
  'PENDING',
  'PROCESSING',
  'PUBLISHED',
  'FAILED',
]);

export const outboxEvents = evtSchema.table(
  'outbox_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: domainEventTypeEnum('event_type').notNull(),
    aggregateType: text('aggregate_type').notNull(),
    aggregateId: uuid('aggregate_id').notNull(),
    payload: jsonb('payload').notNull().default({}),
    payloadVersion: integer('payload_version').notNull().default(1),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    availableAt: timestamp('available_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(10),
    status: outboxEventStatusEnum('status').notNull().default('PENDING'),
    idempotencyKey: text('idempotency_key').notNull(),
    orderingKey: text('ordering_key').notNull(),
    sequenceNumber: bigint('sequence_number', { mode: 'number' }).notNull(),
    leaseOwner: text('lease_owner'),
    leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true, mode: 'string' }),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    check('outbox_events_payload_version_positive_chk', sql`${table.payloadVersion} >= 1`),
    check('outbox_events_attempts_non_negative_chk', sql`${table.attempts} >= 0`),
    check('outbox_events_max_attempts_positive_chk', sql`${table.maxAttempts} >= 1`),
    check('outbox_events_idempotency_key_not_empty_chk', sql`length(trim(${table.idempotencyKey})) > 0`),
    check('outbox_events_ordering_key_not_empty_chk', sql`length(trim(${table.orderingKey})) > 0`),
    check('outbox_events_aggregate_type_not_empty_chk', sql`length(trim(${table.aggregateType})) > 0`),
    uniqueIndex('outbox_events_idempotency_key_uidx').on(table.idempotencyKey),
    index('outbox_events_poll_idx').on(
      table.status,
      table.availableAt,
      table.orderingKey,
      table.sequenceNumber,
    ),
    index('outbox_events_lease_expires_idx')
      .on(table.leaseExpiresAt)
      .where(sql`${table.status} = 'PROCESSING'`),
  ],
);
