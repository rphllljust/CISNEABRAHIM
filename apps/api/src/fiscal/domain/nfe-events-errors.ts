export const NFE_EVENT_ERROR_CODES = {
  FAKE_EVENT: 'NFE_FAKE_EVENT',
  DUPLICATE_EVENT: 'NFE_DUPLICATE_EVENT',
  TIMED_OUT: 'NFE_TIMED_OUT',
  REJECTED: 'NFE_REJECTED',
  CONTINGENCY_UNSUPPORTED: 'NFE_CONTINGENCY_UNSUPPORTED',
  XML_REQUIRED: 'NFE_XML_REQUIRED',
} as const;

export type NfeEventErrorCode =
  (typeof NFE_EVENT_ERROR_CODES)[keyof typeof NFE_EVENT_ERROR_CODES];

export class NfeEventError extends Error {
  constructor(
    readonly code: NfeEventErrorCode,
    readonly detail?: string,
  ) {
    super(code);
    this.name = 'NfeEventError';
  }
}
