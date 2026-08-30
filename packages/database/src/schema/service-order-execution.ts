import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { identities } from './identity';
import { serviceOrders } from './service-orders';

export const executionEntryTypeEnum = pgSchema('so').enum('execution_entry_type', [
  'QUANTITY',
  'MILEAGE',
  'HOUR_METER',
  'OBSERVATION',
  'OCCURRENCE',
]);

export const executionCommandIdempotency = pgSchema('so').table(
  'execution_command_idempotency',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceOrderId: uuid('service_order_id')
      .notNull()
      .references(() => serviceOrders.id, { onDelete: 'restrict' }),
    commandName: text('command_name').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    responsePayload: jsonb('response_payload').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('execution_command_idempotency_uidx').on(
      table.serviceOrderId,
      table.commandName,
      table.idempotencyKey,
    ),
    index('execution_command_idempotency_service_order_id_idx').on(table.serviceOrderId),
    check(
      'execution_command_idempotency_command_name_not_empty_chk',
      sql`length(trim(${table.commandName})) > 0`,
    ),
    check(
      'execution_command_idempotency_idempotency_key_not_empty_chk',
      sql`length(trim(${table.idempotencyKey})) > 0`,
    ),
  ],
);

export const executionEntries = pgSchema('so').table(
  'execution_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceOrderId: uuid('service_order_id')
      .notNull()
      .references(() => serviceOrders.id, { onDelete: 'restrict' }),
    entryType: executionEntryTypeEnum('entry_type').notNull(),
    evidenceKind: text('evidence_kind'),
    quantityValue: numeric('quantity_value'),
    quantityUnitCode: text('quantity_unit_code'),
    textValue: text('text_value'),
    context: jsonb('context').notNull().default({}),
    actorIdentityId: uuid('actor_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),
    recordedAt: timestamp('recorded_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    idempotencyKey: text('idempotency_key'),
    rowVersion: integer('row_version').notNull().default(1),
  },
  (table) => [
    uniqueIndex('execution_entries_idempotency_key_uidx').on(table.idempotencyKey),
    index('execution_entries_service_order_id_idx').on(table.serviceOrderId, table.recordedAt),
    check('execution_entries_row_version_positive_chk', sql`${table.rowVersion} >= 1`),
  ],
);

export const executionEvidence = pgSchema('so').table(
  'execution_evidence',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceOrderId: uuid('service_order_id')
      .notNull()
      .references(() => serviceOrders.id, { onDelete: 'restrict' }),
    evidenceKind: text('evidence_kind').notNull(),
    payload: jsonb('payload').notNull().default({}),
    actorIdentityId: uuid('actor_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),
    recordedAt: timestamp('recorded_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    idempotencyKey: text('idempotency_key'),
  },
  (table) => [
    uniqueIndex('execution_evidence_idempotency_key_uidx').on(table.idempotencyKey),
    index('execution_evidence_service_order_id_idx').on(
      table.serviceOrderId,
      table.evidenceKind,
      table.recordedAt,
    ),
    check(
      'execution_evidence_evidence_kind_not_empty_chk',
      sql`length(trim(${table.evidenceKind})) > 0`,
    ),
  ],
);

export const executionOccurrences = pgSchema('so').table(
  'execution_occurrences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceOrderId: uuid('service_order_id')
      .notNull()
      .references(() => serviceOrders.id, { onDelete: 'restrict' }),
    occurrenceCode: text('occurrence_code').notNull(),
    description: text('description').notNull(),
    payload: jsonb('payload').notNull().default({}),
    actorIdentityId: uuid('actor_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),
    recordedAt: timestamp('recorded_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    idempotencyKey: text('idempotency_key'),
  },
  (table) => [
    uniqueIndex('execution_occurrences_idempotency_key_uidx').on(table.idempotencyKey),
    index('execution_occurrences_service_order_id_idx').on(table.serviceOrderId, table.recordedAt),
    check(
      'execution_occurrences_occurrence_code_not_empty_chk',
      sql`length(trim(${table.occurrenceCode})) > 0`,
    ),
    check(
      'execution_occurrences_description_not_empty_chk',
      sql`length(trim(${table.description})) > 0`,
    ),
  ],
);

export const executionEntryHistoryEvents = pgSchema('so').table(
  'execution_entry_history_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    executionEntryId: uuid('execution_entry_id')
      .notNull()
      .references(() => executionEntries.id, { onDelete: 'restrict' }),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull().default({}),
    actorIdentityId: uuid('actor_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
    }),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('execution_entry_history_events_execution_entry_id_idx').on(
      table.executionEntryId,
      table.occurredAt,
    ),
    check(
      'execution_entry_history_events_event_type_not_empty_chk',
      sql`length(trim(${table.eventType})) > 0`,
    ),
  ],
);
