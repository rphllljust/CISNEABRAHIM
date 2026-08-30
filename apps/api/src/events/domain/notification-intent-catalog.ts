import type { DomainEventType } from './domain-event-type';
import { NOTIFICATION_INTENT_PAYLOAD_VERSION } from './domain-event-type';

export type NotificationIntentDefinition = {
  intentKey: string;
  audienceScope: string;
  templateKey: string;
  payload: Record<string, unknown>;
};

export const NOTIFICATION_INTENT_CATALOG: Partial<Record<DomainEventType, NotificationIntentDefinition[]>> = {
  SERVICE_REQUEST_SUBMITTED: [
    {
      intentKey: 'service-request-review-queue',
      audienceScope: 'UNIT_OPERATIONS',
      templateKey: 'service-request.submitted.review',
      payload: { schemaVersion: NOTIFICATION_INTENT_PAYLOAD_VERSION },
    },
  ],
  SERVICE_ORDER_RELEASED: [
    {
      intentKey: 'service-order-field-dispatch',
      audienceScope: 'UNIT_FIELD',
      templateKey: 'service-order.released.dispatch',
      payload: { schemaVersion: NOTIFICATION_INTENT_PAYLOAD_VERSION },
    },
  ],
  SERVICE_ORDER_ASSIGNED: [
    {
      intentKey: 'service-order-resource-assigned',
      audienceScope: 'UNIT_FIELD',
      templateKey: 'service-order.assigned.resource',
      payload: { schemaVersion: NOTIFICATION_INTENT_PAYLOAD_VERSION },
    },
  ],
  SERVICE_ORDER_COMPLETED: [
    {
      intentKey: 'service-order-completion-notice',
      audienceScope: 'UNIT_OPERATIONS',
      templateKey: 'service-order.completed.notice',
      payload: { schemaVersion: NOTIFICATION_INTENT_PAYLOAD_VERSION },
    },
  ],
  MEASUREMENT_SUBMITTED: [
    {
      intentKey: 'measurement-review-queue',
      audienceScope: 'UNIT_COMMERCIAL',
      templateKey: 'measurement.submitted.review',
      payload: { schemaVersion: NOTIFICATION_INTENT_PAYLOAD_VERSION },
    },
  ],
  MEASUREMENT_APPROVED: [
    {
      intentKey: 'measurement-approved-notice',
      audienceScope: 'UNIT_COMMERCIAL',
      templateKey: 'measurement.approved.notice',
      payload: { schemaVersion: NOTIFICATION_INTENT_PAYLOAD_VERSION },
    },
  ],
  BILLING_READY: [
    {
      intentKey: 'billing-ready-notice',
      audienceScope: 'UNIT_FINANCE',
      templateKey: 'billing.ready.notice',
      payload: { schemaVersion: NOTIFICATION_INTENT_PAYLOAD_VERSION },
    },
  ],
  PAYMENT_OVERDUE: [
    {
      intentKey: 'payment-overdue-reminder',
      audienceScope: 'UNIT_FINANCE',
      templateKey: 'billing.payment.overdue',
      payload: { schemaVersion: NOTIFICATION_INTENT_PAYLOAD_VERSION },
    },
  ],
};

export function resolveNotificationIntents(eventType: DomainEventType): NotificationIntentDefinition[] {
  return NOTIFICATION_INTENT_CATALOG[eventType] ?? [];
}
