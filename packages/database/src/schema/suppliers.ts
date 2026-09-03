import { sql } from 'drizzle-orm';
import { check, integer, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { identities } from './identity';
import { addressPurposeEnum, contactPurposeEnum, ptySchema } from './clients';

export const supplierStatusEnum = ptySchema.enum('supplier_status', ['ACTIVE', 'INACTIVE']);

export const suppliers = ptySchema.table(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    legalName: text('legal_name').notNull(),
    tradeName: text('trade_name'),
    normalizedTaxId: text('normalized_tax_id').notNull(),
    externalErpId: text('external_erp_id'),
    paymentTerms: text('payment_terms'),
    currencyCode: text('currency_code').notNull().default('BRL'),
    status: supplierStatusEnum('status').notNull().default('ACTIVE'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
    deactivatedByIdentityId: uuid('deactivated_by_identity_id').references(() => identities.id),
    deactivationReason: text('deactivation_reason'),
  },
  (table) => [
    check('suppliers_legal_name_not_empty_chk', sql`length(trim(${table.legalName})) > 0`),
    check('suppliers_normalized_tax_id_digits_chk', sql`${table.normalizedTaxId} ~ '^[0-9]{14}$'`),
    check('suppliers_version_positive_chk', sql`${table.version} >= 1`),
    uniqueIndex('suppliers_normalized_tax_id_uidx').on(table.normalizedTaxId),
  ],
);

export const supplierContacts = ptySchema.table('supplier_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id),
  name: text('name').notNull(),
  purpose: contactPurposeEnum('purpose').notNull(),
  email: text('email'),
  phone: text('phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const supplierAddresses = ptySchema.table('supplier_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id),
  purpose: addressPurposeEnum('purpose').notNull(),
  street: text('street'),
  number: text('number'),
  complement: text('complement'),
  district: text('district'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const supplierHistoryEvents = ptySchema.table('supplier_history_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id),
  eventKind: text('event_kind').notNull(),
  actorIdentityId: uuid('actor_identity_id')
    .notNull()
    .references(() => identities.id),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  payload: text('payload'),
});
