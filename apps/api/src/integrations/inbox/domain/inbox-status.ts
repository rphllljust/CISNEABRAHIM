export const INTEGRATION_INBOX_STATUSES = {
  Received: 'RECEIVED',
  Processing: 'PROCESSING',
  Processed: 'PROCESSED',
  Failed: 'FAILED',
  Invalid: 'INVALID',
} as const;

export type IntegrationInboxStatus =
  (typeof INTEGRATION_INBOX_STATUSES)[keyof typeof INTEGRATION_INBOX_STATUSES];

export const INTEGRATION_INBOX_ERROR_CLASSES = {
  Transient: 'TRANSIENT',
  Permanent: 'PERMANENT',
  InvalidPayload: 'INVALID_PAYLOAD',
  AuthFailure: 'AUTH_FAILURE',
} as const;

export type IntegrationInboxErrorClass =
  (typeof INTEGRATION_INBOX_ERROR_CLASSES)[keyof typeof INTEGRATION_INBOX_ERROR_CLASSES];

export const INTEGRATION_INBOX_DEFAULT_MAX_ATTEMPTS = 5;
