export const ALERT_ERROR_CODES = {
  ACCESS_DENIED: 'ALERT_ACCESS_DENIED',
  INVALID_QUERY: 'ALERT_INVALID_QUERY',
} as const;

export type AlertErrorCode = (typeof ALERT_ERROR_CODES)[keyof typeof ALERT_ERROR_CODES];
