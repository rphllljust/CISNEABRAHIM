import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  uuid,
  check,
} from 'drizzle-orm/pg-core';
import { identities } from './identity';

export const auditSchema = pgSchema('audit');

export const securityAuditClassificationEnum = pgEnum('security_audit_classification', [
  'SECURITY_CRITICAL',
  'SECURITY_STANDARD',
]);

export const securityAuditOutcomeEnum = pgEnum('security_audit_outcome', [
  'SUCCESS',
  'FAILURE',
  'DENIED',
]);

export const securityAuditEvents = auditSchema.table(
  'security_audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    actorIdentityId: uuid('actor_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
    }),
    actorSessionId: uuid('actor_session_id'),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id'),
    outcome: securityAuditOutcomeEnum('outcome').notNull(),
    scopeType: text('scope_type'),
    correlationId: text('correlation_id'),
    reasonCode: text('reason_code'),
    classification: securityAuditClassificationEnum('classification').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('security_audit_events_action_not_empty_chk', sql`length(trim(${table.action})) > 0`),
    check(
      'security_audit_events_resource_type_not_empty_chk',
      sql`length(trim(${table.resourceType})) > 0`,
    ),
    check(
      'security_audit_events_correlation_id_length_chk',
      sql`${table.correlationId} IS NULL OR length(${table.correlationId}) <= 64`,
    ),
    index('security_audit_events_occurred_at_idx').on(table.occurredAt),
    index('security_audit_events_actor_identity_id_idx').on(table.actorIdentityId),
    index('security_audit_events_correlation_id_idx').on(table.correlationId),
    index('security_audit_events_action_idx').on(table.action),
  ],
);
