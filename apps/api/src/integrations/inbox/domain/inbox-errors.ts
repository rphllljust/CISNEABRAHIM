import type { IntegrationInboxErrorClass } from './inbox-status';
import { INTEGRATION_INBOX_ERROR_CLASSES } from './inbox-status';

export class InvalidInboxPayloadError extends Error {
  readonly errorClass = INTEGRATION_INBOX_ERROR_CLASSES.InvalidPayload satisfies IntegrationInboxErrorClass;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'InvalidInboxPayloadError';
  }
}

export class InboxAuthFailureError extends Error {
  readonly errorClass = INTEGRATION_INBOX_ERROR_CLASSES.AuthFailure satisfies IntegrationInboxErrorClass;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'InboxAuthFailureError';
  }
}

export class TransientInboxError extends Error {
  readonly errorClass = INTEGRATION_INBOX_ERROR_CLASSES.Transient satisfies IntegrationInboxErrorClass;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'TransientInboxError';
  }
}

export class PermanentInboxError extends Error {
  readonly errorClass = INTEGRATION_INBOX_ERROR_CLASSES.Permanent satisfies IntegrationInboxErrorClass;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PermanentInboxError';
  }
}

export function classifyInboxError(error: unknown): IntegrationInboxErrorClass {
  if (error instanceof InvalidInboxPayloadError) {
    return INTEGRATION_INBOX_ERROR_CLASSES.InvalidPayload;
  }
  if (error instanceof InboxAuthFailureError) {
    return INTEGRATION_INBOX_ERROR_CLASSES.AuthFailure;
  }
  if (error instanceof PermanentInboxError) {
    return INTEGRATION_INBOX_ERROR_CLASSES.Permanent;
  }
  if (error instanceof TransientInboxError) {
    return INTEGRATION_INBOX_ERROR_CLASSES.Transient;
  }
  return INTEGRATION_INBOX_ERROR_CLASSES.Transient;
}

export function inboxErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
