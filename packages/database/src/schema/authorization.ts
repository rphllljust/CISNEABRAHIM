import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { identities } from './identity';

/**
 * Persistência técnica de autorização (Prompt 22).
 * Concessões explícitas — sem array de permissões em identidade.
 */
export const authorizationSchema = pgSchema('authorization');

export const authzScopeTypeEnum = authorizationSchema.enum('authz_scope_type', [
  'GLOBAL',
  'OWN',
  'ASSIGNED',
  'UNIT',
  'CLIENT',
  'CONTRACT',
  'DOCUMENT',
  'FINANCIAL',
  'PLATFORM',
]);

export const authzDecisionTypeEnum = authorizationSchema.enum('authz_decision_type', [
  'ALLOW',
  'DENY',
]);

export const grants = authorizationSchema.table(
  'grants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identityId: uuid('identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id'),
    scopeType: authzScopeTypeEnum('scope_type').notNull(),
    constraints: jsonb('constraints').$type<Record<string, unknown> | null>(),
    grantedByIdentityId: uuid('granted_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    version: integer('version').notNull().default(1),
    validFrom: timestamp('valid_from', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    validUntil: timestamp('valid_until', { withTimezone: true, mode: 'string' }),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    revokedByIdentityId: uuid('revoked_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('grants_action_not_empty_chk', sql`length(trim(${table.action})) > 0`),
    check('grants_resource_type_not_empty_chk', sql`length(trim(${table.resourceType})) > 0`),
    check('grants_version_positive_chk', sql`${table.version} >= 1`),
    check(
      'grants_valid_until_after_valid_from_chk',
      sql`${table.validUntil} IS NULL OR ${table.validUntil} > ${table.validFrom}`,
    ),
    check(
      'grants_revoked_at_after_created_chk',
      sql`${table.revokedAt} IS NULL OR ${table.revokedAt} >= ${table.createdAt}`,
    ),
    check(
      'grants_anchored_scope_requires_ref_chk',
      sql`${table.scopeType} NOT IN ('UNIT', 'CLIENT', 'CONTRACT', 'DOCUMENT', 'FINANCIAL') OR (${table.resourceId} IS NOT NULL AND length(trim(${table.resourceId})) > 0)`,
    ),
    check(
      'grants_global_no_resource_chk',
      sql`${table.scopeType} <> 'GLOBAL' OR ${table.resourceId} IS NULL`,
    ),
    index('grants_identity_action_idx').on(table.identityId, table.action, table.resourceType),
    index('grants_identity_active_idx').on(table.identityId),
  ],
);

export const decisionAudits = authorizationSchema.table(
  'decision_audits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identityId: uuid('identity_id').references(() => identities.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id'),
    decision: authzDecisionTypeEnum('decision').notNull(),
    reasonCode: text('reason_code').notNull(),
    correlationId: text('correlation_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('decision_audits_action_not_empty_chk', sql`length(trim(${table.action})) > 0`),
    check(
      'decision_audits_resource_type_not_empty_chk',
      sql`length(trim(${table.resourceType})) > 0`,
    ),
    check('decision_audits_reason_code_not_empty_chk', sql`length(trim(${table.reasonCode})) > 0`),
    index('decision_audits_identity_id_idx').on(table.identityId),
    index('decision_audits_created_at_idx').on(table.createdAt),
  ],
);

export const scopeRefs = authorizationSchema.table(
  'scope_refs',
  {
    scopeType: authzScopeTypeEnum('scope_type').notNull(),
    refId: text('ref_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.scopeType, table.refId] }),
    check(
      'scope_refs_anchor_scope_chk',
      sql`${table.scopeType} IN ('UNIT', 'CLIENT', 'CONTRACT', 'DOCUMENT', 'FINANCIAL')`,
    ),
    check('scope_refs_ref_id_not_empty_chk', sql`length(trim(${table.refId})) > 0`),
  ],
);

export const scopedRecords = authorizationSchema.table(
  'scoped_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerIdentityId: uuid('owner_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    assignedIdentityId: uuid('assigned_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
    unitId: text('unit_id').notNull(),
    clientId: text('client_id').notNull(),
    contractId: text('contract_id').notNull(),
    documentId: text('document_id').notNull(),
    isFinancial: boolean('is_financial').notNull().default(false),
    label: text('label').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('scoped_records_unit_id_not_empty_chk', sql`length(trim(${table.unitId})) > 0`),
    check('scoped_records_client_id_not_empty_chk', sql`length(trim(${table.clientId})) > 0`),
    check('scoped_records_contract_id_not_empty_chk', sql`length(trim(${table.contractId})) > 0`),
    check('scoped_records_document_id_not_empty_chk', sql`length(trim(${table.documentId})) > 0`),
    index('scoped_records_unit_id_idx').on(table.unitId),
    index('scoped_records_client_id_idx').on(table.clientId),
    index('scoped_records_contract_id_idx').on(table.contractId),
    index('scoped_records_document_id_idx').on(table.documentId),
    index('scoped_records_assigned_identity_id_idx').on(table.assignedIdentityId),
    index('scoped_records_owner_identity_id_idx').on(table.ownerIdentityId),
  ],
);
