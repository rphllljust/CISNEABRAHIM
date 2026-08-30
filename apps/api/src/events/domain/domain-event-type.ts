export const DOMAIN_EVENT_TYPES = {
  ServiceRequestSubmitted: 'SERVICE_REQUEST_SUBMITTED',
  ServiceOrderReleased: 'SERVICE_ORDER_RELEASED',
  ServiceOrderAssigned: 'SERVICE_ORDER_ASSIGNED',
  ServiceOrderCompleted: 'SERVICE_ORDER_COMPLETED',
  MeasurementSubmitted: 'MEASUREMENT_SUBMITTED',
  MeasurementApproved: 'MEASUREMENT_APPROVED',
  BillingReady: 'BILLING_READY',
  PaymentOverdue: 'PAYMENT_OVERDUE',
} as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[keyof typeof DOMAIN_EVENT_TYPES];

export const AGGREGATE_TYPES = {
  ServiceRequest: 'service-request',
  ServiceOrder: 'service-order',
  Measurement: 'measurement',
  BillingRecord: 'billing-record',
  BillingDocument: 'billing-document',
} as const;

export type AggregateType = (typeof AGGREGATE_TYPES)[keyof typeof AGGREGATE_TYPES];

export const DOMAIN_EVENT_PAYLOAD_VERSION = 1;

export const NOTIFICATION_INTENT_PAYLOAD_VERSION = 1;

export const NOTIFICATION_INTENT_STATUS = {
  Pending: 'PENDING',
  Dispatched: 'DISPATCHED',
  Cancelled: 'CANCELLED',
} as const;

export type NotificationIntentStatus =
  (typeof NOTIFICATION_INTENT_STATUS)[keyof typeof NOTIFICATION_INTENT_STATUS];
