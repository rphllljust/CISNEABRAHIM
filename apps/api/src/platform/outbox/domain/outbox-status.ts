export const OUTBOX_EVENT_STATUSES = {
  Pending: 'PENDING',
  Processing: 'PROCESSING',
  Published: 'PUBLISHED',
  Failed: 'FAILED',
} as const;

export type OutboxEventStatus = (typeof OUTBOX_EVENT_STATUSES)[keyof typeof OUTBOX_EVENT_STATUSES];

export const OUTBOX_DEFAULT_MAX_ATTEMPTS = 10;
