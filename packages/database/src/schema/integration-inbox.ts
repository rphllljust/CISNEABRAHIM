import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const intSchema = pgSchema('int');

export const integrationInboxStatusEnum = pgEnum('integration_inbox_status', [
  'RECEIVED',
  'PROCESSING',
  'PROCESSED',
  'FAILED',
  'INVALID',
]);

export const integrationInboxErrorClassEnum = pgEnum('integration_inbox_error_class', [
  'TRANSIENT',
  'PERMANENT',
  'INVALID_PAYLOAD',
  'AUTH_FAILURE',
]);

export const integrationInbox = intSchema.table(
  'integration_inbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull(),
    externalMessageId: text('external_message_id').notNull(),
    eventType: text('event_type').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    payloadHash: text('payload_hash').notNull(),
    payload: jsonb('payload').notNull().default({}),
    status: integrationInboxStatusEnum('status').notNull().default('RECEIVED'),
    processedAt: timestamp('processed_at', { withTimezone: true, mode: 'string' }),
    errorClassification: integrationInboxErrorClassEnum('error_classification'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(5),
    runAfter: timestamp('run_after', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    lastError: text('last_error'),
    leaseOwner: text('lease_owner'),
    leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    check('integration_inbox_provider_not_empty_chk', sql`length(trim(${table.provider})) > 0`),
    check(
      'integration_inbox_external_message_id_not_empty_chk',
      sql`length(trim(${table.externalMessageId})) > 0`,
    ),
    check('integration_inbox_event_type_not_empty_chk', sql`length(trim(${table.eventType})) > 0`),
    check('integration_inbox_payload_hash_not_empty_chk', sql`length(trim(${table.payloadHash})) > 0`),
    check('integration_inbox_attempts_non_negative_chk', sql`${table.attempts} >= 0`),
    check('integration_inbox_max_attempts_positive_chk', sql`${table.maxAttempts} >= 1`),
    uniqueIndex('integration_inbox_provider_external_message_uidx').on(
      table.provider,
      table.externalMessageId,
    ),
    index('integration_inbox_poll_idx').on(table.status, table.runAfter, table.receivedAt),
    index('integration_inbox_lease_expires_idx')
      .on(table.leaseExpiresAt)
      .where(sql`${table.status} = 'PROCESSING'`),
  ],
);

export const integrationInboxEffects = intSchema.table(
  'integration_inbox_effects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    inboxId: uuid('inbox_id')
      .notNull()
      .references(() => integrationInbox.id, { onDelete: 'restrict' }),
    effectKey: text('effect_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'integration_inbox_effects_effect_key_not_empty_chk',
      sql`length(trim(${table.effectKey})) > 0`,
    ),
    uniqueIndex('integration_inbox_effects_effect_key_uidx').on(table.effectKey),
  ],
);
