export const BUSINESS_ALERT_TYPES = {
  ServiceOrderDueSoon: 'SERVICE_ORDER_DUE_SOON',
  ServiceOrderOverdue: 'SERVICE_ORDER_OVERDUE',
  ServiceOrderStalled: 'SERVICE_ORDER_STALLED',
  MeasurementAging: 'MEASUREMENT_AGING',
  BillingAging: 'BILLING_AGING',
  PaymentOverdue: 'PAYMENT_OVERDUE',
} as const;

export type BusinessAlertType =
  (typeof BUSINESS_ALERT_TYPES)[keyof typeof BUSINESS_ALERT_TYPES];

export type BusinessAlertSeverity = 'WARNING' | 'CRITICAL';
export type BusinessAlertStatus = 'ACTIVE' | 'RESOLVED';

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

export type BusinessAlertSummary = {
  activeCount: number;
};

export const ALERT_ERROR_CODES = {
  ACCESS_DENIED: 'ALERT_ACCESS_DENIED',
} as const;

export type AlertErrorCode = (typeof ALERT_ERROR_CODES)[keyof typeof ALERT_ERROR_CODES];

export type AlertApiErrorKind = 'denied' | 'network' | 'unknown';

export class AlertApiError extends Error {
  readonly status: number;
  readonly code?: AlertErrorCode;
  readonly kind: AlertApiErrorKind;

  constructor(status: number, code: AlertErrorCode | undefined, kind: AlertApiErrorKind) {
    super(code ?? `ALERT_API_ERROR_${status}`);
    this.name = 'AlertApiError';
    this.status = status;
    this.code = code;
    this.kind = kind;
  }
}

export type AlertListFilters = {
  status?: BusinessAlertStatus;
  type?: BusinessAlertType;
  severity?: BusinessAlertSeverity;
};
