import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgSchema,
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
    check(
      'decision_audits_reason_code_not_empty_chk',
      sql`length(trim(${table.reasonCode})) > 0`,
    ),
    index('decision_audits_identity_id_idx').on(table.identityId),
    index('decision_audits_created_at_idx').on(table.createdAt),
  ],
);
