import { describe, expect, it } from 'vitest';
import {
  BILLING_DOCUMENT_NUMBER_PREFIX,
  formatBillingDocumentNumber,
} from './billing-document';

describe('billing-document domain', () => {
  it('formats document number with zero padding', () => {
    expect(formatBillingDocumentNumber(2026, 1)).toBe(`${BILLING_DOCUMENT_NUMBER_PREFIX}-2026-000001`);
    expect(formatBillingDocumentNumber(2026, 123456)).toBe(`${BILLING_DOCUMENT_NUMBER_PREFIX}-2026-123456`);
  });
});
