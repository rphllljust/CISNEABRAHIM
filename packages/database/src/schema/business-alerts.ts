import { sql } from 'drizzle-orm';
import { check, index, jsonb, pgEnum, pgSchema, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const altSchema = pgSchema('alt');

export const businessAlertTypeEnum = pgEnum('business_alert_type', [
  'SERVICE_ORDER_DUE_SOON',
  'SERVICE_ORDER_OVERDUE',
  'SERVICE_ORDER_STALLED',
  'MEASUREMENT_AGING',
  'BILLING_AGING',
  'PAYMENT_OVERDUE',
]);

export const businessAlertSeverityEnum = pgEnum('business_alert_severity', ['WARNING', 'CRITICAL']);

export const businessAlertStatusEnum = pgEnum('business_alert_status', ['ACTIVE', 'RESOLVED']);

export const businessAlerts = altSchema.table(
  'business_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    alertType: businessAlertTypeEnum('alert_type').notNull(),
    severity: businessAlertSeverityEnum('severity').notNull(),
    status: businessAlertStatusEnum('status').notNull().default('ACTIVE'),
    aggregateType: text('aggregate_type').notNull(),
    aggregateId: uuid('aggregate_id').notNull(),
    policyWindow: text('policy_window').notNull(),
    deduplicationKey: text('deduplication_key').notNull(),
    conditionPhase: text('condition_phase').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    entityHref: text('entity_href').notNull(),
    unitId: text('unit_id'),
    clientId: uuid('client_id'),
    metadata: jsonb('metadata').notNull().default({}),
    triggeredAt: timestamp('triggered_at', { withTimezone: true, mode: 'string' }).notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'string' }),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    check('business_alerts_title_not_empty_chk', sql`length(trim(${table.title})) > 0`),
    check('business_alerts_message_not_empty_chk', sql`length(trim(${table.message})) > 0`),
    check('business_alerts_entity_href_not_empty_chk', sql`length(trim(${table.entityHref})) > 0`),
    check('business_alerts_policy_window_not_empty_chk', sql`length(trim(${table.policyWindow})) > 0`),
    check('business_alerts_deduplication_key_not_empty_chk', sql`length(trim(${table.deduplicationKey})) > 0`),
    uniqueIndex('business_alerts_dedup_active_uidx')
      .on(table.deduplicationKey)
      .where(sql`${table.status} = 'ACTIVE'`),
    index('business_alerts_status_type_idx').on(table.status, table.alertType, table.triggeredAt),
    index('business_alerts_unit_status_idx').on(table.unitId, table.status, table.triggeredAt),
    index('business_alerts_aggregate_idx').on(table.aggregateType, table.aggregateId, table.status),
  ],
);
