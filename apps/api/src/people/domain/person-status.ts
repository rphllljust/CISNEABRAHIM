export const PERSON_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export type PersonStatus = (typeof PERSON_STATUSES)[keyof typeof PERSON_STATUSES];

export const PERSON_HISTORY_EVENT_TYPES = {
  Created: 'CREATED',
  Updated: 'UPDATED',
  Deactivated: 'DEACTIVATED',
  Activated: 'ACTIVATED',
} as const;

export type PersonHistoryEventType =
  (typeof PERSON_HISTORY_EVENT_TYPES)[keyof typeof PERSON_HISTORY_EVENT_TYPES];
