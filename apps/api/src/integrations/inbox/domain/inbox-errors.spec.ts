import { describe, expect, it } from 'vitest';
import {
  classifyInboxError,
  InvalidInboxPayloadError,
  PermanentInboxError,
  TransientInboxError,
} from './inbox-errors';
import { INTEGRATION_INBOX_ERROR_CLASSES } from './inbox-status';
import { computeInboxBackoffDelayMs } from '../config/inbox-processor.config';

describe('integration inbox errors', () => {
  it('classifies inbox errors', () => {
    expect(classifyInboxError(new InvalidInboxPayloadError('x'))).toBe(
      INTEGRATION_INBOX_ERROR_CLASSES.InvalidPayload,
    );
    expect(classifyInboxError(new PermanentInboxError('x'))).toBe(
      INTEGRATION_INBOX_ERROR_CLASSES.Permanent,
    );
    expect(classifyInboxError(new TransientInboxError('x'))).toBe(
      INTEGRATION_INBOX_ERROR_CLASSES.Transient,
    );
    expect(classifyInboxError(new Error('x'))).toBe(INTEGRATION_INBOX_ERROR_CLASSES.Transient);
  });
});

describe('computeInboxBackoffDelayMs', () => {
  it('applies exponential backoff with cap', () => {
    expect(computeInboxBackoffDelayMs(1, 1_000, 5_000)).toBe(1_000);
    expect(computeInboxBackoffDelayMs(2, 1_000, 5_000)).toBe(2_000);
    expect(computeInboxBackoffDelayMs(4, 1_000, 5_000)).toBe(5_000);
  });
});
