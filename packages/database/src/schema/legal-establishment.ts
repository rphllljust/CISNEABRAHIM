import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { identities } from './identity';
import { ptySchema } from './clients';

/**
 * Cadastro da própria empresa emissora (Prompt Legal Establishment Master).
 * LegalEntity / Establishment / TaxRegistration no schema `pty` (party),
 * espelhando os padrões de suppliers (version + histórico append-only).
 * Nenhum dado empresarial da Cisne é hardcoded: identidade vem do cadastro.
 */
export const legalEntityStatusEnum = ptySchema.enum('legal_entity_status', [
  'ACTIVE',
  'INACTIVE',
]);

export const establishmentStatusEnum = ptySchema.enum('establishment_status', [
  'ACTIVE',
  'INACTIVE',
]);

export const taxRegistrationKindEnum = ptySchema.enum('tax_registration_kind', [
  'CNPJ',
  'IE',
  'IM',
]);

export const taxRegistrationStatusEnum = ptySchema.enum('tax_registration_status', [
  'ACTIVE',
  'INACTIVE',
]);

export const taxRegimeEnum = ptySchema.enum('tax_regime', [
  'SIMPLES_NACIONAL',
  'MEI',
  'LUCRO_PRESUMIDO',
  'LUCRO_REAL',
]);

export const certificateKindEnum = ptySchema.enum('certificate_kind', ['A1', 'A3']);

export const certificateStatusEnum = ptySchema.enum('certificate_status', [
  'ACTIVE',
  'INACTIVE',
]);

export const legalEntities = ptySchema.table(
  'legal_entities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    legalName: text('legal_name').notNull(),
    tradeName: text('trade_name'),
    status: legalEntityStatusEnum('status').notNull().default('ACTIVE'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
    deactivatedByIdentityId: uuid('deactivated_by_identity_id').references(() => identities.id),
    deactivationReason: text('deactivation_reason'),
  },
  (table) => [
    check('legal_entities_legal_name_not_empty_chk', sql`length(trim(${table.legalName})) > 0`),
    check('legal_entities_version_positive_chk', sql`${table.version} >= 1`),
  ],
);

export const establishments = ptySchema.table(
  'establishments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    legalEntityId: uuid('legal_entity_id')
      .notNull()
      .references(() => legalEntities.id, { onDelete: 'restrict' }),
    code: text('code').notNull(),
    tradeName: text('trade_name'),
    status: establishmentStatusEnum('status').notNull().default('ACTIVE'),
    isDefaultIssuer: boolean('is_default_issuer').notNull().default(false),
    version: integer('version').notNull().default(1),
    // Endereço fiscal
    street: text('street'),
    number: text('number'),
    complement: text('complement'),
    district: text('district'),
    city: text('city'),
    state: text('state'),
    postalCode: text('postal_code'),
    country: text('country').notNull().default('BR'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
    deactivatedByIdentityId: uuid('deactivated_by_identity_id').references(() => identities.id),
    deactivationReason: text('deactivation_reason'),
  },
  (table) => [
    uniqueIndex('establishments_legal_entity_code_uidx').on(
      table.legalEntityId,
      table.code,
    ),
    uniqueIndex('establishments_default_issuer_per_entity_uidx')
      .on(table.legalEntityId)
      .where(sql`${table.isDefaultIssuer}`),
    check('establishments_code_not_empty_chk', sql`length(trim(${table.code})) > 0`),
    check('establishments_version_positive_chk', sql`${table.version} >= 1`),
    check(
      'establishments_postal_digits_chk',
      sql`${table.postalCode} IS NULL OR ${table.postalCode} ~ '^[0-9]{8}$'`,
    ),
    index('establishments_legal_entity_id_idx').on(table.legalEntityId),
  ],
);

export const establishmentTaxRegistrations = ptySchema.table(
  'establishment_tax_registrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id, { onDelete: 'restrict' }),
    taxKind: taxRegistrationKindEnum('tax_kind').notNull(),
    normalizedNumber: text('normalized_number').notNull(),
    state: text('state'),
    regime: taxRegimeEnum('regime'),
    status: taxRegistrationStatusEnum('status').notNull().default('ACTIVE'),
    validFrom: date('valid_from', { mode: 'string' }),
    validTo: date('valid_to', { mode: 'string' }),
    authority: text('authority'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
    deactivatedByIdentityId: uuid('deactivated_by_identity_id').references(() => identities.id),
    deactivationReason: text('deactivation_reason'),
  },
  (table) => [
    uniqueIndex('establishment_tax_registrations_cnpj_uidx')
      .on(table.normalizedNumber)
      .where(sql`${table.taxKind} = 'CNPJ'`),
    uniqueIndex('establishment_tax_registrations_ie_state_uidx')
      .on(table.state, table.normalizedNumber)
      .where(sql`${table.taxKind} = 'IE'`),
    uniqueIndex('establishment_tax_registrations_im_establishment_uidx')
      .on(table.establishmentId, table.normalizedNumber)
      .where(sql`${table.taxKind} = 'IM'`),
    check(
      'tax_registrations_number_not_empty_chk',
      sql`length(trim(${table.normalizedNumber})) > 0`,
    ),
    check('tax_registrations_version_positive_chk', sql`${table.version} >= 1`),
    check(
      'tax_registrations_cnpj_digits_chk',
      sql`${table.taxKind} <> 'CNPJ' OR ${table.normalizedNumber} ~ '^[0-9]{14}$'`,
    ),
    check(
      'tax_registrations_ie_format_chk',
      sql`${table.taxKind} <> 'IE' OR ${table.normalizedNumber} ~ '^[A-Z0-9]+$'`,
    ),
    check(
      'tax_registrations_im_digits_chk',
      sql`${table.taxKind} <> 'IM' OR ${table.normalizedNumber} ~ '^[0-9]+$'`,
    ),
    index('establishment_tax_registrations_establishment_id_idx').on(table.establishmentId),
  ],
);

export const establishmentCertificates = ptySchema.table(
  'establishment_certificates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id, { onDelete: 'restrict' }),
    certificateKind: certificateKindEnum('certificate_kind').notNull(),
    label: text('label').notNull(),
    subjectRef: text('subject_ref'),
    issuerRef: text('issuer_ref'),
    validFrom: date('valid_from', { mode: 'string' }),
    validTo: date('valid_to', { mode: 'string' }),
    status: certificateStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'establishment_certificates_label_not_empty_chk',
      sql`length(trim(${table.label})) > 0`,
    ),
    index('establishment_certificates_establishment_id_idx').on(table.establishmentId),
  ],
);

export const legalEntityHistoryEvents = ptySchema.table('legal_entity_history_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  legalEntityId: uuid('legal_entity_id')
    .notNull()
    .references(() => legalEntities.id),
  eventKind: text('event_kind').notNull(),
  actorIdentityId: uuid('actor_identity_id')
    .notNull()
    .references(() => identities.id),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  payload: text('payload'),
});

export const establishmentHistoryEvents = ptySchema.table('establishment_history_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  establishmentId: uuid('establishment_id')
    .notNull()
    .references(() => establishments.id),
  eventKind: text('event_kind').notNull(),
  actorIdentityId: uuid('actor_identity_id')
    .notNull()
    .references(() => identities.id),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  payload: text('payload'),
});

export const establishmentTaxRegistrationHistoryEvents = ptySchema.table(
  'establishment_tax_registration_history_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taxRegistrationId: uuid('tax_registration_id')
      .notNull()
      .references(() => establishmentTaxRegistrations.id),
    eventKind: text('event_kind').notNull(),
    actorIdentityId: uuid('actor_identity_id')
      .notNull()
      .references(() => identities.id),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    payload: text('payload'),
  },
);
