import { sql } from 'drizzle-orm';
import { check, index, integer, pgEnum, pgSchema, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { notificationIntents } from './domain-events';

export const ntfSchema = pgSchema('ntf');

export const notificationChannelEnum = pgEnum('notification_channel', ['IN_APP', 'EMAIL', 'WHATSAPP']);

export const notificationStatusEnum = pgEnum('notification_status', [
  'PENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
]);

export const deliveryAttemptStatusEnum = pgEnum('delivery_attempt_status', [
  'PENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
]);

export const notifications = ntfSchema.table(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notificationIntentId: uuid('notification_intent_id')
      .notNull()
      .references(() => notificationIntents.id, { onDelete: 'restrict' }),
    channel: notificationChannelEnum('channel').notNull(),
    recipientRef: text('recipient_ref').notNull(),
    templateKey: text('template_key').notNull(),
    status: notificationStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    check('notifications_recipient_ref_not_empty_chk', sql`length(trim(${table.recipientRef})) > 0`),
    check('notifications_template_key_not_empty_chk', sql`length(trim(${table.templateKey})) > 0`),
    uniqueIndex('notifications_intent_channel_uidx').on(table.notificationIntentId, table.channel),
    index('notifications_status_created_at_idx').on(table.status, table.createdAt),
  ],
);

export const deliveryAttempts = ntfSchema.table(
  'delivery_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notificationId: uuid('notification_id')
      .notNull()
      .references(() => notifications.id, { onDelete: 'restrict' }),
    channel: notificationChannelEnum('channel').notNull(),
    recipientRef: text('recipient_ref').notNull(),
    provider: text('provider').notNull(),
    attempt: integer('attempt').notNull(),
    status: deliveryAttemptStatusEnum('status').notNull(),
    providerMessageId: text('provider_message_id'),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'string' }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true, mode: 'string' }),
    failureCode: text('failure_code'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    check('delivery_attempts_attempt_positive_chk', sql`${table.attempt} >= 1`),
    check('delivery_attempts_provider_not_empty_chk', sql`length(trim(${table.provider})) > 0`),
    check('delivery_attempts_recipient_ref_not_empty_chk', sql`length(trim(${table.recipientRef})) > 0`),
    uniqueIndex('delivery_attempts_notification_attempt_uidx').on(table.notificationId, table.attempt),
    index('delivery_attempts_provider_message_id_idx')
      .on(table.providerMessageId)
      .where(sql`${table.providerMessageId} IS NOT NULL`),
    index('delivery_attempts_notification_id_idx').on(table.notificationId),
  ],
);
