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

export const contractStatusEnum = comSchema.enum('contract_status', [
  'DRAFT',
  'ACTIVE',
  'CLOSED',
  'EXPIRED',
]);

export const contracts = comSchema.table(
  'contracts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    internalCode: text('internal_code').notNull(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'restrict' }),
    unitId: text('unit_id').notNull(),
    contractNumber: text('contract_number').notNull(),
    title: text('title').notNull(),
    scopeDescription: text('scope_description'),
    validFrom: date('valid_from').notNull(),
    validTo: date('valid_to'),
    currencyCode: text('currency_code').notNull().default('BRL'),
    paymentTerms: text('payment_terms'),
    paymentMethod: text('payment_method'),
    commercialTerms: jsonb('commercial_terms').notNull().default({}),
    clientSnapshot: jsonb('client_snapshot'),
    status: contractStatusEnum('status').notNull().default('DRAFT'),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    activatedByIdentityId: uuid('activated_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
    }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    closedByIdentityId: uuid('closed_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
    }),
    closureReason: text('closure_reason'),
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
    uniqueIndex('contracts_internal_code_uidx').on(table.internalCode),
    index('contracts_client_id_idx').on(table.clientId),
    index('contracts_unit_id_idx').on(table.unitId),
    index('contracts_status_idx').on(table.status),
    check('contracts_internal_code_not_empty_chk', sql`length(trim(${table.internalCode})) > 0`),
    check('contracts_contract_number_not_empty_chk', sql`length(trim(${table.contractNumber})) > 0`),
    check('contracts_unit_id_not_empty_chk', sql`length(trim(${table.unitId})) > 0`),
    check('contracts_title_not_empty_chk', sql`length(trim(${table.title})) > 0`),
    check('contracts_row_version_positive_chk', sql`${table.rowVersion} >= 1`),
    check('contracts_currency_code_chk', sql`length(trim(${table.currencyCode})) = 3`),
    check(
      'contracts_validity_range_chk',
      sql`${table.validTo} IS NULL OR ${table.validTo} >= ${table.validFrom}`,
    ),
  ],
);

export const contractItems = comSchema.table(
  'contract_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => contracts.id, { onDelete: 'restrict' }),
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
    quantity: numeric('quantity', { precision: 18, scale: 4 }),
    unitCode: text('unit_code'),
    unitPriceAmount: numeric('unit_price_amount', { precision: 18, scale: 4 }),
    lineTotalAmount: numeric('line_total_amount', { precision: 18, scale: 4 }),
  },
  (table) => [
    uniqueIndex('contract_items_contract_line_uidx').on(table.contractId, table.lineNumber),
    check('contract_items_line_number_positive_chk', sql`${table.lineNumber} >= 1`),
    check('contract_items_description_not_empty_chk', sql`length(trim(${table.description})) > 0`),
  ],
);

export const contractDocumentLinks = comSchema.table(
  'contract_document_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => contracts.id, { onDelete: 'restrict' }),
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
    uniqueIndex('contract_document_links_contract_document_purpose_uidx').on(
      table.contractId,
      table.documentId,
      table.linkPurpose,
    ),
    check(
      'contract_document_links_purpose_not_empty_chk',
      sql`length(trim(${table.linkPurpose})) > 0`,
    ),
  ],
);

export const contractHistoryEvents = comSchema.table(
  'contract_history_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => contracts.id, { onDelete: 'restrict' }),
    eventType: text('event_type').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    actorIdentityId: uuid('actor_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),
    payload: jsonb('payload').notNull().default({}),
  },
  (table) => [
    index('contract_history_events_contract_id_idx').on(table.contractId),
    check(
      'contract_history_events_event_type_not_empty_chk',
      sql`length(trim(${table.eventType})) > 0`,
    ),
  ],
);
