export const BUSINESS_ALERT_TYPES = {
  ServiceOrderDueSoon: 'SERVICE_ORDER_DUE_SOON',
  ServiceOrderOverdue: 'SERVICE_ORDER_OVERDUE',
  ServiceOrderStalled: 'SERVICE_ORDER_STALLED',
  MeasurementAging: 'MEASUREMENT_AGING',
  BillingAging: 'BILLING_AGING',
  PaymentOverdue: 'PAYMENT_OVERDUE',
} as const;

export type BusinessAlertType = (typeof BUSINESS_ALERT_TYPES)[keyof typeof BUSINESS_ALERT_TYPES];

export const BUSINESS_ALERT_SEVERITIES = {
  Warning: 'WARNING',
  Critical: 'CRITICAL',
} as const;

export type BusinessAlertSeverity =
  (typeof BUSINESS_ALERT_SEVERITIES)[keyof typeof BUSINESS_ALERT_SEVERITIES];

export const BUSINESS_ALERT_STATUSES = {
  Active: 'ACTIVE',
  Resolved: 'RESOLVED',
} as const;

export type BusinessAlertStatus =
  (typeof BUSINESS_ALERT_STATUSES)[keyof typeof BUSINESS_ALERT_STATUSES];

export const BUSINESS_ALERT_AGGREGATE_TYPES = {
  ServiceOrder: 'SERVICE_ORDER',
  Measurement: 'MEASUREMENT',
  BillingRecord: 'BILLING_RECORD',
  BillingDocument: 'BILLING_DOCUMENT',
} as const;

export type BusinessAlertAggregateType =
  (typeof BUSINESS_ALERT_AGGREGATE_TYPES)[keyof typeof BUSINESS_ALERT_AGGREGATE_TYPES];

export const ALERT_CONDITION_PHASES = {
  NotDueSoon: 'NOT_DUE_SOON',
  DueSoon: 'DUE_SOON',
  NotOverdue: 'NOT_OVERDUE',
  Overdue: 'OVERDUE',
  NotStalled: 'NOT_STALLED',
  Stalled: 'STALLED',
  NotAging: 'NOT_AGING',
  Aging: 'AGING',
  NotPaymentOverdue: 'NOT_PAYMENT_OVERDUE',
  PaymentOverdue: 'PAYMENT_OVERDUE',
} as const;

export type AlertConditionPhase = (typeof ALERT_CONDITION_PHASES)[keyof typeof ALERT_CONDITION_PHASES];

export type BusinessAlertRecord = {
  id: string;
  alertType: BusinessAlertType;
  severity: BusinessAlertSeverity;
  status: BusinessAlertStatus;
  aggregateType: BusinessAlertAggregateType;
  aggregateId: string;
  policyWindow: string;
  deduplicationKey: string;
  conditionPhase: AlertConditionPhase;
  title: string;
  message: string;
  entityHref: string;
  unitId: string | null;
  clientId: string | null;
  metadata: Record<string, unknown>;
  triggeredAt: string;
  resolvedAt: string | null;
  lastSeenAt: string;
};

export type BusinessAlertListItem = {
  id: string;
  alertType: BusinessAlertType;
  severity: BusinessAlertSeverity;
  status: BusinessAlertStatus;
  title: string;
  message: string;
  entityHref: string;
  unitId: string | null;
  triggeredAt: string;
  resolvedAt: string | null;
  lastSeenAt: string;
};
