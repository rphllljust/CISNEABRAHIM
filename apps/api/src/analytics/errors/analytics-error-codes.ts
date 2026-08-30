export const ANALYTICS_ERROR_CODES = {
  ACCESS_DENIED: 'ANALYTICS_ACCESS_DENIED',
} as const;

export type AnalyticsErrorCode = (typeof ANALYTICS_ERROR_CODES)[keyof typeof ANALYTICS_ERROR_CODES];
